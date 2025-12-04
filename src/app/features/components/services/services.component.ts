import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MyServiceService, Product } from '../../../core/services/my-service.service';
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// import { AppRoutingModule } from './app-routing.module';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
  standalone: true,
  imports: [DecimalPipe, CommonModule, ReactiveFormsModule]
})
export class ServicesComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  productForm: FormGroup;
  isEditMode: boolean = false;
  editingProductId: string | null = null;
  isLoading: boolean = false;
  formStatus: string = 'INVALID';
  totalProductos: number = 0;
  valorTotalInventario: number = 0;
  precioConDescuento: number = 0;

  private destroy$ = new Subject<void>();

  categorias: string[] = ['Electrónica', 'Ropa', 'Accesorios', 'Muebles', 'Alimentos', 'Deportes'];
  ratings: string[] = ['1', '2', '3', '4', '5'];

  constructor(
    private fb: FormBuilder,
    private productService: MyServiceService
  ) {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      price: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      discount: ['', [Validators.required, Validators.pattern(/^0(\.\d{1,2})?$/), Validators.max(0.99)]],
      rating: ['', Validators.required],
      stock: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      brand: ['', [Validators.required, Validators.minLength(2)]],
      weight: ['', [Validators.required, Validators.pattern(/^\d+$/)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // statusChanges - Monitorear el estado de validación del formulario
    this.productForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.formStatus = status;
        console.log('Estado del formulario:', status);

        if (status === 'VALID') {
          console.log('Formulario válido - Listo para guardar');
        } else if (status === 'INVALID') {
          console.log('Formulario inválido - Revisa los campos');
        }
      });

    // valueChanges - Calcular precio con descuento en tiempo real
    this.productForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(valores => {
        const precio = parseFloat(valores.price) || 0;
        const descuento = parseFloat(valores.discount) || 0;
        const stock = parseInt(valores.stock) || 0;

        // Calcular precio con descuento
        this.precioConDescuento = precio * (1 - descuento);

        // Calcular valor total del producto
        const valorTotal = this.precioConDescuento * stock;
        console.log('Valor total de este producto:', valorTotal.toFixed(2));
      });

    // statusChanges en campo title
    this.productForm.get('title')?.statusChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(status => {
        if (status === 'VALID') {
          console.log('Título del producto válido');
        }
      });

    // valueChanges en precio - Advertir si el precio es muy alto
    this.productForm.get('price')?.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(precio => {
        const precioNum = parseFloat(precio);
        if (precioNum > 1000) {
          console.log('Precio alto detectado: $' + precioNum);
        }
      });

    // valueChanges en descuento
    this.productForm.get('discount')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(discount => {
        const desc = parseFloat(discount);
        if (desc > 0.5) {
          console.log('Descuento mayor al 50%:', (desc * 100).toFixed(0) + '%');
        }
      });

    // statusChanges en stock
    this.productForm.get('stock')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        if (status === 'VALID') {
          const stockValue = parseInt(this.productForm.get('stock')?.value);
          if (stockValue < 10) {
            console.log('Stock bajo detectado:', stockValue);
          }
        }
      });
  }

  // GET ALL - Cargar todos los productos
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.calcularEstadisticas();
          this.isLoading = false;
          console.log('Productos cargados:', products.length);
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          this.isLoading = false;
          alert('Error al cargar los productos. Verifica que la API esté corriendo en http://localhost:8080/products');
        }
      });
  }

  // CREATE o UPDATE - Guardar producto
  saveProduct(): void {
    if (this.productForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;
    const productData = this.productForm.value;

    if (this.isEditMode && this.editingProductId !== null) {
      // UPDATE - Actualizar producto existente
      this.productService.update(this.editingProductId, productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProduct) => {
            console.log('Producto actualizado:', updatedProduct);
            this.loadProducts();
            this.resetForm();
            this.isLoading = false;
            alert('Producto actualizado exitosamente');
          },
          error: (error) => {
            console.error('Error al actualizar:', error);
            this.isLoading = false;
            alert('Error al actualizar el producto: ' + error.message);
          }
        });
    } else {
      // CREATE - Crear nuevo producto
      this.productService.create(productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newProduct) => {
            console.log('Producto creado:', newProduct);
            this.loadProducts();
            this.resetForm();
            this.isLoading = false;
            alert('Producto creado exitosamente');
          },
          error: (error) => {
            console.error('Error al crear:', error);
            this.isLoading = false;
            alert('Error al crear el producto: ' + error.message);
          }
        });
    }
  }

  // GET BY ID y cargar en formulario para editar
  editProduct(id: string): void {
    this.isLoading = true;
    this.productService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product) {
            this.isEditMode = true;
            this.editingProductId = id;

            // Cargar datos en el formulario
            this.productForm.patchValue({
              title: product.title,
              description: product.description,
              category: product.category,
              price: product.price,
              discount: product.discount,
              rating: product.rating,
              stock: product.stock,
              brand: product.brand,
              weight: product.weight
            });

            this.isLoading = false;

            // Scroll al formulario
            document.getElementById('product-form')?.scrollIntoView({
              behavior: 'smooth'
            });

            console.log('Editando producto:', product);
          }
        },
        error: (error) => {
          console.error('Error al cargar producto:', error);
          this.isLoading = false;
          alert('Error al cargar el producto: ' + error.message);
        }
      });
  }

  // DELETE - Eliminar producto
  deleteProduct(id: string, title: string): void {
    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar el producto "${title}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      return;
    }

    this.isLoading = true;
    this.productService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Producto eliminado con ID:', id);
          this.loadProducts();
          this.isLoading = false;
          alert('Producto eliminado exitosamente');

          // Si estábamos editando este producto, resetear el formulario
          if (this.editingProductId === id) {
            this.resetForm();
          }
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.isLoading = false;
          alert('Error al eliminar el producto: ' + error.message);
        }
      });
  }

  // Resetear formulario
  resetForm(): void {
    this.productForm.reset({
      title: '',
      description: '',
      category: '',
      price: '',
      discount: '',
      rating: '',
      stock: '',
      brand: '',
      weight: ''
    });
    this.isEditMode = false;
    this.editingProductId = null;
    this.precioConDescuento = 0;
  }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    this.totalProductos = this.products.length;
    this.valorTotalInventario = this.products.reduce((total, product) => {
      const precio = parseFloat(product.price) || 0;
      const descuento = parseFloat(product.discount) || 0;
      const stock = parseInt(product.stock) || 0;
      const precioFinal = precio * (1 - descuento);
      return total + (precioFinal * stock);
    }, 0);
  }

  // Calcular precio con descuento de un producto
  calcularPrecioFinal(product: Product): number {
    const precio = parseFloat(product.price) || 0;
    const descuento = parseFloat(product.discount) || 0;
    return precio * (1 - descuento);
  }

  // Calcular valor total de un producto
  calcularValorTotal(product: Product): number {
    const precioFinal = this.calcularPrecioFinal(product);
    const stock = parseInt(product.stock) || 0;
    return precioFinal * stock;
  }

  // Obtener estrellas para el rating
  getStars(rating: string): string {
    const numRating = parseInt(rating) || 0;
    return '⭐'.repeat(numRating) + '☆'.repeat(5 - numRating);
  }

  // Verificar si un campo es inválido y fue tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
