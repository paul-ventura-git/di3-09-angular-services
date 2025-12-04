import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  discount: string;
  rating: string;
  stock: string;
  brand: string;
  weight: string;
}

interface ApiResponse {
  products: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class MyServiceService {
  private apiUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) { }

  // GET ALL - Obtener todos los productos
  getAll(): Observable<Product[]> {
    return this.http.get<ApiResponse>(this.apiUrl).pipe(
      map(response => response.products),
      retry(2), // Reintentar 2 veces en caso de error
      catchError(this.handleError)
    );
  }

  // GET BY ID - Obtener un producto por ID
  getById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<{ products: Product }>(url).pipe(
      map(response => response.products),
      catchError(this.handleError)
    );
  }

  // CREATE - Crear un nuevo producto
  create(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<{ products: Product }>(this.apiUrl, product).pipe(
      map(response => response.products),
      catchError(this.handleError)
    );
  }

  // UPDATE - Actualizar un producto existente
  update(id: string, product: Partial<Product>): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<{ products: Product }>(url, product).pipe(
      map(response => response.products),
      catchError(this.handleError)
    );
  }

  // DELETE - Eliminar un producto
  delete(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ products: any }>(url).pipe(
      map(response => response.products),
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
