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
    console.log('🔍 Intentando login con:', correo);
    
    // Intento primero en clientes
    return this.http.post<any>('http://localhost:8000/usuarios/login', { correo, contrasena }).pipe(
      tap(response => {
        console.log('✅ Respuesta cliente:', response);
        const userData = response.usuario || response;
        userData.tipo = 'cliente';
        this.setUsuarioActual(userData);
      })
    ).pipe(
      // Si falla, probamos en vendedores
      catchError(() => {
        console.log('❌ Login cliente falló, probando vendedor...');
        return this.http.post<any>('http://localhost:8000/vendedores/login-vendedor', { correo, contrasena }).pipe(
          tap(response => {
            console.log('✅ Respuesta vendedor completa:', response);
            const userData = response.vendedor;
            console.log('📋 Datos extraídos del vendedor:', userData);
            userData.tipo = 'vendedor';
            console.log('🔄 Llamando setUsuarioActual...');
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
    console.log('💾 Guardando usuario en localStorage:', usuario);
    this.usuarioActualSubject.next(usuario);
    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
      console.log('✅ Usuario guardado. Verificación:', localStorage.getItem('usuario'));
    } else {
      console.log('❌ Usuario es null, no se guarda nada');
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