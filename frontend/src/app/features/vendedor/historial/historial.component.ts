import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Historial de Actividades</h1>
        <p>Revisa tu historial completo de proyectos y transacciones</p>
      </div>

      <div class="content">
        <!-- Filtros -->
        <div class="filtros">
          <select class="filtro-select">
            <option value="">Todos los tipos</option>
            <option value="proyecto">Proyectos</option>
            <option value="pago">Pagos</option>
            <option value="mensaje">Mensajes</option>
          </select>
          <select class="filtro-select">
            <option value="">Último mes</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
          </select>
        </div>

        <!-- Lista de Actividades -->
        <div class="actividades">
          <div class="actividad-item proyecto">
            <div class="actividad-icon">📋</div>
            <div class="actividad-content">
              <h3>Proyecto completado: Sistema de Gestión</h3>
              <p>Has completado exitosamente el proyecto para TechCorp SA</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 2 días</span>
                <span class="monto">+$1,200</span>
              </div>
            </div>
          </div>

          <div class="actividad-item pago">
            <div class="actividad-icon">💰</div>
            <div class="actividad-content">
              <h3>Pago recibido</h3>
              <p>Pago procesado por el proyecto de Landing Page</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 5 días</span>
                <span class="monto">+$350</span>
              </div>
            </div>
          </div>

          <div class="actividad-item mensaje">
            <div class="actividad-icon">💬</div>
            <div class="actividad-content">
              <h3>Nuevo mensaje de cliente</h3>
              <p>StartupXYZ te ha enviado un mensaje sobre las revisiones</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 1 semana</span>
                <span class="estado">Respondido</span>
              </div>
            </div>
          </div>

          <div class="actividad-item proyecto">
            <div class="actividad-icon">🚀</div>
            <div class="actividad-content">
              <h3>Nuevo proyecto iniciado</h3>
              <p>Has comenzado el proyecto "Diseño de Landing Page"</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 2 semanas</span>
                <span class="estado">En progreso</span>
              </div>
            </div>
          </div>

          <div class="actividad-item proyecto">
            <div class="actividad-icon">⭐</div>
            <div class="actividad-content">
              <h3>Calificación recibida</h3>
              <p>ShopFast te ha calificado con 5 estrellas por la App Móvil</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 3 semanas</span>
                <span class="calificacion">⭐⭐⭐⭐⭐</span>
              </div>
            </div>
          </div>

          <div class="actividad-item pago">
            <div class="actividad-icon">💳</div>
            <div class="actividad-content">
              <h3>Pago procesado</h3>
              <p>Pago recibido por App Móvil E-commerce</p>
              <div class="actividad-meta">
                <span class="fecha">Hace 1 mes</span>
                <span class="monto">+$800</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="resumen">
          <h2>Resumen del Mes</h2>
          <div class="resumen-stats">
            <div class="stat">
              <span class="stat-numero">3</span>
              <span class="stat-label">Proyectos Completados</span>
            </div>
            <div class="stat">
              <span class="stat-numero">$2,350</span>
              <span class="stat-label">Ingresos Totales</span>
            </div>
            <div class="stat">
              <span class="stat-numero">4.9</span>
              <span class="stat-label">Calificación Promedio</span>
            </div>
          </div>
        </div>

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
    
    .filtros { display: flex; gap: 15px; margin-bottom: 30px; }
    .filtro-select { padding: 10px 15px; border: 2px solid #e0e0e0; border-radius: 8px; background: white; cursor: pointer; }
    
    .actividades { margin-bottom: 40px; }
    .actividad-item { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 15px; display: flex; align-items: flex-start; gap: 15px; border-left: 4px solid #667eea; }
    .actividad-item.proyecto { border-left-color: #007bff; }
    .actividad-item.pago { border-left-color: #28a745; }
    .actividad-item.mensaje { border-left-color: #ffc107; }
    
    .actividad-icon { font-size: 1.5rem; background: #f8f9fa; padding: 10px; border-radius: 50%; }
    .actividad-content { flex: 1; }
    .actividad-content h3 { margin: 0 0 8px 0; color: #333; }
    .actividad-content p { color: #666; margin: 0 0 12px 0; }
    
    .actividad-meta { display: flex; gap: 15px; align-items: center; }
    .fecha { color: #999; font-size: 0.9rem; }
    .monto { color: #28a745; font-weight: bold; }
    .estado { background: #e9ecef; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; }
    .calificacion { font-size: 0.9rem; }
    
    .resumen { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .resumen h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .resumen-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px; }
    .stat { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; }
    .stat-numero { display: block; font-size: 2rem; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; font-size: 0.9rem; }
    
    .btn-back { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; margin-top: 20px; }
    .back-section { text-align: center; }
    
    @media (max-width: 768px) {
      .filtros { flex-direction: column; }
      .actividad-item { flex-direction: column; text-align: center; }
      .actividad-meta { justify-content: center; }
      .resumen-stats { grid-template-columns: 1fr; }
    }
  `
})
export class HistorialComponent { }