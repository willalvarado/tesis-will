import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServicioAuth } from '../../core/services/auth.service'; 
import { Usuario } from '../../models/usuario.modelo'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], // 🔥 RouterLink eliminado porque no se usa en este HTML
  template: `
    <div class="container">
      <div class="header">
        <h1>Dashboard</h1>
        <div class="user-info">
          <span>Bienvenido, {{ usuarioActual?.nombre }}</span>
          <button (click)="cerrarSesion()" class="btn-logout">Cerrar sesión</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="user-type-badge" [ngClass]="{'client': usuarioActual?.tipo === 'cliente', 'vendor': usuarioActual?.tipo === 'vendedor'}">
          {{ usuarioActual?.tipo === 'cliente' ? '🔵 Cliente' : '🟠 Vendedor' }}
        </div>
        
        <div class="card">
          <h2>Información de la cuenta</h2>
          <div class="info-item">
            <span class="label">Nombre:</span>
            <span class="value">{{ usuarioActual?.nombre }}</span>
          </div>
          <div class="info-item">
            <span class="label">Correo:</span>
            <span class="value">{{ usuarioActual?.correo }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tipo de cuenta:</span>
            <span class="value">{{ usuarioActual?.tipo === 'cliente' ? 'Cliente' : 'Vendedor' }}</span>
          </div>
          <div class="info-item" *ngIf="usuarioActual?.tipo === 'vendedor' && usuarioActual?.especialidades">
            <span class="label">Especialidades:</span>
            <span class="value">{{ mostrarEspecialidades(usuarioActual?.especialidades || []) }}</span> 
            <!-- 🔥 manejamos undefined -->
          </div>
        </div>
        
        <div class="dashboard-message">
          <p *ngIf="usuarioActual?.tipo === 'cliente'">
            Como cliente, puedes navegar por nuestros productos y servicios. 
            Próximamente nuevas funcionalidades estarán disponibles.
          </p>
          <p *ngIf="usuarioActual?.tipo === 'vendedor'">
            Como vendedor, puedes administrar tus productos y servicios.
            Próximamente nuevas funcionalidades estarán disponibles.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: `/* Tus estilos aquí, no los modifiqué */`
})
export class DashboardComponent implements OnInit {
  usuarioActual: Usuario | null = null; // 🔥 corregido

  constructor(
    private servicioAuth: ServicioAuth,
    private router: Router
  ) {}

  ngOnInit() {
    this.servicioAuth.usuarioActual$.subscribe((usuario: Usuario | null) => {
      if (!usuario) {
        this.router.navigate(['/login']);
        return;
      }
      this.usuarioActual = usuario;
    });
  }

  mostrarEspecialidades(especialidades: string[]): string {
    if (!especialidades.length) {
      return 'Ninguna';
    }
    return especialidades.map(e => this.capitalizarPrimeraLetra(e)).join(', ');
  }

  capitalizarPrimeraLetra(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  cerrarSesion() {
    this.servicioAuth.cerrarSesion(); // ✅ ahora sí existe este método
    this.router.navigate(['/']);
  }
  
}
