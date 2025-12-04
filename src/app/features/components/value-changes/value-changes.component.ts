import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-value-changes',
  templateUrl: './value-changes.component.html',
  styleUrls: ['./value-changes.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, JsonPipe]
})
export class valueChangesComponent implements OnInit, OnDestroy {
  cotizacionForm: FormGroup;
  total: number = 0;
  descuentoAplicado: number = 0;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    // Inicializar el formulario con FormBuilder
    this.cotizacionForm = this.fb.group({
      producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      codigoDescuento: [''],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Escuchar cambios en cantidad y precio para calcular total
    this.cotizacionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(valores => {
        this.calcularTotal(valores.cantidad, valores.precioUnitario);
      });

    // Escuchar cambios en el código de descuento con debounce
    this.cotizacionForm.get('codigoDescuento')?.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(codigo => {
        this.aplicarDescuento(codigo);
      });

    // Escuchar cambios en el email para validación personalizada
    this.cotizacionForm.get('email')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email) {
          console.log('Validando email:', email);
          // Aquí podrías hacer una validación asíncrona
        }
      });
  }

  calcularTotal(cantidad: number, precio: number): void {
    const subtotal = (cantidad || 0) * (precio || 0);
    this.total = subtotal - this.descuentoAplicado;
  }

  aplicarDescuento(codigo: string): void {
    // Simulación de validación de código de descuento
    if (codigo === 'DESC10') {
      this.descuentoAplicado = this.total * 0.10;
      console.log('Descuento del 10% aplicado');
    } else if (codigo === 'DESC20') {
      this.descuentoAplicado = this.total * 0.20;
      console.log('Descuento del 20% aplicado');
    } else {
      this.descuentoAplicado = 0;
    }

    // Recalcular el total
    const valores = this.cotizacionForm.value;
    this.calcularTotal(valores.cantidad, valores.precioUnitario);
  }

  enviarCotizacion(): void {
    if (this.cotizacionForm.valid) {
      console.log('Cotización enviada:', {
        ...this.cotizacionForm.value,
        total: this.total
      });
      alert('¡Cotización enviada exitosamente!');
      this.cotizacionForm.reset();
      this.total = 0;
      this.descuentoAplicado = 0;
    } else {
      alert('Por favor completa todos los campos correctamente');
    }
  }

  ngOnDestroy(): void {
    // Completar el Subject para cancelar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
}
