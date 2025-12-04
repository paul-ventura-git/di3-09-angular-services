import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-status-changes',
  templateUrl: './status-changes.component.html',
  styleUrls: ['./status-changes.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class StatusChangesComponent implements OnInit, OnDestroy {
  registroForm: FormGroup;
  estadoFormulario: string = 'INVALID';
  mensajeEstado: string = '';
  camposInvalidos: string[] = [];
  mostrarPassword: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    // Inicializar el formulario con validaciones
    this.registroForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(20)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', Validators.required],
      edad: ['', [
        Validators.required,
        Validators.min(18),
        Validators.max(120)
      ]],
      terminos: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Escuchar cambios en el ESTADO del formulario completo
    this.registroForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.estadoFormulario = status;
        this.actualizarMensajeEstado(status);
        console.log('Estado del formulario:', status);
      });

    // Escuchar cambios de estado en el campo username
    this.registroForm.get('username')?.statusChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(status => {
        console.log('Estado del username:', status);
        if (status === 'VALID') {
          console.log('Username válido');
        }
      });

    // Escuchar cambios de estado en el campo password
    this.registroForm.get('password')?.statusChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(status => {
        console.log('Estado del password:', status);
        if (status === 'INVALID') {
          console.log('Password no cumple los requisitos');
        }
      });

    // Escuchar cambios de estado en el campo email
    this.registroForm.get('email')?.statusChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(status => {
        if (status === 'VALID') {
          console.log('Email válido, podrías verificar disponibilidad aquí');
          // Aquí podrías llamar a un servicio para verificar si el email existe
        }
      });

    // Monitorear campos inválidos cuando cambie el estado
    this.registroForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarCamposInvalidos();
      });
  }

  // Validador personalizado para la fortaleza de la contraseña
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { weakPassword: true } : null;
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  actualizarMensajeEstado(status: string): void {
    switch(status) {
      case 'VALID':
        this.mensajeEstado = 'Formulario completo y válido - Listo para enviar';
        break;
      case 'INVALID':
        this.mensajeEstado = 'Hay campos con errores - Por favor revisa';
        break;
      case 'PENDING':
        this.mensajeEstado = 'Validando información...';
        break;
      case 'DISABLED':
        this.mensajeEstado = 'Formulario deshabilitado';
        break;
    }
  }

  actualizarCamposInvalidos(): void {
    this.camposInvalidos = [];
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      if (control?.invalid && control?.touched) {
        this.camposInvalidos.push(this.getNombreCampo(key));
      }
    });
  }

  getNombreCampo(key: string): string {
    const nombres: { [key: string]: string } = {
      username: 'Nombre de usuario',
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      edad: 'Edad',
      terminos: 'Términos y condiciones'
    };
    return nombres[key] || key;
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  enviarRegistro(): void {
    if (this.registroForm.valid) {
      console.log('Registro enviado:', this.registroForm.value);
      alert('¡Registro exitoso!');
      this.registroForm.reset();
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registroForm.controls).forEach(key => {
        this.registroForm.get(key)?.markAsTouched();
      });
      alert('Por favor completa todos los campos correctamente');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
