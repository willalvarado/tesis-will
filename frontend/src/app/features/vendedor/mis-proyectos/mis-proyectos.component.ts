import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mis-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Mis Proyectos</h1>
        <p>Gestiona tus proyectos activos y completados</p>
      </div>

      <div class="content">
        <!-- Proyectos Activos -->
        <section class="seccion">
          <h2>Proyectos Activos</h2>
          
          <div class="proyecto-card activo">
            <div class="proyecto-header">
              <h3>Sistema de Gestión Empresarial</h3>
              <span class="estado activo">En Progreso</span>
            </div>
            <p class="cliente">Cliente: TechCorp SA</p>
            <p class="descripcion">Desarrollo de sistema completo de gestión empresarial...</p>
            <div class="progreso">
              <div class="progreso-bar">
                <div class="progreso-fill" style="width: 65%"></div>
              </div>
              <span>65% completado</span>
            </div>
            <div class="proyecto-footer">
              <span class="precio">$1,200</span>
              <button class="btn-accion">Ver Detalles</button>
            </div>
          </div>

          <div class="proyecto-card activo">
            <div class="proyecto-header">
              <h3>Diseño de Landing Page</h3>
              <span class="estado activo">En Progreso</span>
            </div>
            <p class="cliente">Cliente: StartupXYZ</p>
            <p class="descripcion">Diseño y desarrollo de página de aterrizaje...</p>
            <div class="progreso">
              <div class="progreso-bar">
                <div class="progreso-fill" style="width: 30%"></div>
              </div>
              <span>30% completado</span>
            </div>
            <div class="proyecto-footer">
              <span class="precio">$350</span>
              <button class="btn-accion">Ver Detalles</button>
            </div>
          </div>
        </section>

        <!-- Proyectos Completados -->
        <section class="seccion">
          <h2>Proyectos Completados</h2>
          
          <div class="proyecto-card completado">
            <div class="proyecto-header">
              <h3>App Móvil E-commerce</h3>
              <span class="estado completado">Completado</span>
            </div>
            <p class="cliente">Cliente: ShopFast</p>
            <p class="descripcion">Aplicación móvil para tienda online...</p>
            <div class="proyecto-footer">
              <span class="precio">$800</span>
              <span class="calificacion">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </section>

        <div class="back-section">
          <button class="btn-back" [routerLink]="['/vendedor/bienvenida']">
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 10px; }
    .seccion { margin-bottom: 40px; }
    .seccion h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    
    .proyecto-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 20px; border-left: 4px solid #667eea; }
    .proyecto-card.completado { border-left-color: #28a745; }
    
    .proyecto-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
    .proyecto-header h3 { margin: 0; color: #333; }
    
    .estado { padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; font-weight: 600; }
    .estado.activo { background: #fff3cd; color: #856404; }
    .estado.completado { background: #d4edda; color: #155724; }
    
    .cliente { color: #667eea; font-weight: 600; margin: 10px 0; }
    .descripcion { color: #666; margin: 15px 0; }
    
    .progreso { display: flex; align-items: center; gap: 15px; margin: 15px 0; }
    .progreso-bar { background: #e9ecef; height: 8px; border-radius: 4px; flex: 1; overflow: hidden; }
    .progreso-fill { background: linear-gradient(90deg, #4facfe, #00f2fe); height: 100%; border-radius: 4px; }
    
    .proyecto-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
    .precio { color: #28a745; font-weight: bold; font-size: 1.2rem; }
    .calificacion { font-size: 1.1rem; }
    
    .btn-accion { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-back { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; margin-top: 20px; }
    .back-section { text-align: center; }
    
    @media (max-width: 768px) {
      .proyecto-header { flex-direction: column; align-items: flex-start; gap: 10px; }
      .proyecto-footer { flex-direction: column; gap: 15px; align-items: flex-start; }
    }
  `
})
export class MisProyectosComponent { }