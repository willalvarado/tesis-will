// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../../models/usuario.modelo';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServicioAuth {
  private baseUrlUsuarios = 'http://localhost:8000/usuarios';
  private baseUrlVendedores = 'http://localhost:8000/vendedores';

  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Al iniciar el servicio, cargamos el usuario guardado si existe
    const savedUser = localStorage.getItem('usuario');
    if (savedUser) {
      this.usuarioActualSubject.next(JSON.parse(savedUser));
    }
  }

  iniciarSesion(correo: string, contrasena: string): Observable<any> {
  // Intento primero en clientes
  return this.http.post<any>('http://localhost:8000/usuarios/login', { correo, contrasena }).pipe(
    tap(response => {
      // Caso cliente
      const userData = response.usuario || response;
      userData.tipo = 'cliente';
      this.setUsuarioActual(userData);
    })
  ).pipe(
    // Si falla, probamos en vendedores
    catchError(() => {
      return this.http.post<any>('http://localhost:8000/vendedores/login-vendedor', { correo, contrasena }).pipe(
        tap(response => {
          const userData = response.usuario || response;
          userData.tipo = 'vendedor';
          this.setUsuarioActual(userData);
        })
      );
    })
  );
}


  registrarCliente(usuario: Usuario): Observable<any> {
    return this.http.post<any>(`${this.baseUrlUsuarios}/registro`, usuario);
  }

  registrarVendedor(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrlVendedores}/registro-vendedor`, data);
  }

  setUsuarioActual(usuario: Usuario | null): void {
    this.usuarioActualSubject.next(usuario);
    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  cerrarSesion(): void {
    // Borramos todo
    localStorage.removeItem('usuario');
    this.usuarioActualSubject.next(null);
    this.router.navigate(['/login']);
  }
}