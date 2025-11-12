import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RequerimientosService, Requerimiento } from '../../../core/services/requerimientos.service';

@Component({
  selector: 'app-requerimientos-vendedor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="requerimientos-container">
      <!-- 🔥 NUEVA BARRA DE NAVEGACIÓN SUPERIOR -->
      <div class="top-navigation">
        <button class="btn-back" (click)="volverAtras()">
          ← Atrás
        </button>
        <h2 class="page-title"></h2>
        <button class="btn-proyectos" (click)="irAProyectos()">
          📂 Proyectos
        </button>
      </div>

      <!-- Header con estadísticas -->
      <div class="header">
        <div class="header-left">
          <h2>🎯 Requerimientos Disponibles</h2>
          <p class="subtitle">Proyectos que coinciden con tus especialidades</p>
        </div>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-number">{{ requerimientosDisponibles.length }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ misRequerimientos.length }}</span>
            <span class="stat-label">Aceptados</span>
          </div>
        </div>
      </div>

      <!-- Requerimientos Disponibles -->
      <section class="section">
        <h3>📋 Nuevos Proyectos</h3>
        
        <div class="requerimientos-list">
          <div *ngFor="let req of requerimientosDisponibles" class="requerimiento-card disponible">
            <div class="card-header">
              <h4>{{ req.titulo }}</h4>
              <span class="badge disponible">Disponible</span>
            </div>
            
            <p class="mensaje">{{ req.mensaje }}</p>
            
            <div class="info">
              <span class="especialidad">{{ req.especialidad }}</span>
              <span class="cliente">👤 Cliente: {{ req.cliente_nombre || 'Cliente #' + req.cliente_id }}</span>
            </div>
            
            <div class="actions">
              <button class="btn-secondary" (click)="verDetalles(req)">
                Ver Detalles
              </button>
              <button class="btn-primary" (click)="aceptarRequerimiento(req.id)">
                ✅ Aceptar Proyecto
              </button>
            </div>
          </div>

          <div *ngIf="requerimientosDisponibles.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No hay requerimientos disponibles en este momento</p>
            <p class="empty-subtitle">Vuelve pronto para ver nuevas oportunidades</p>
            <button class="btn-refresh" (click)="cargarRequerimientos()">
              🔄 Actualizar
            </button>
          </div>
        </div>
      </section>

      <!-- Mis Proyectos Aceptados -->
      <section class="section">
        <h3>🚀 Mis Proyectos Activos</h3>
        
        <div class="requerimientos-list">
          <div *ngFor="let req of misRequerimientos" class="requerimiento-card activo">
            <div class="card-header">
              <h4>{{ req.titulo }}</h4>
              <span class="badge activo">En Progreso</span>
            </div>
            
            <p class="mensaje">{{ req.mensaje }}</p>
            
            <div class="info">
              <span class="especialidad">{{ req.especialidad }}</span>
              <span class="cliente">👤 Cliente: {{ req.cliente_nombre || 'Cliente #' + req.cliente_id }}</span>
            </div>
            
            <div class="actions">
              <button class="btn-secondary" (click)="verProyecto(req)">
                📋 Ver Proyecto
              </button>
              <button class="btn-accent" (click)="gestionarProyecto(req.id)">
                ⚙️ Gestionar
              </button>
            </div>
          </div>

          <div *ngIf="misRequerimientos.length === 0" class="empty-state">
            <div class="empty-icon">📂</div>
            <p>No has aceptado proyectos aún</p>
            <p class="empty-subtitle">Cuando aceptes requerimientos, aparecerán aquí</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .requerimientos-container {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 20px;
      padding-top: 80px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* 🔥 NUEVA BARRA DE NAVEGACIÓN SUPERIOR */
    .top-navigation {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      border-bottom: 2px solid #f0f0f0;
    }

    .page-title {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #2c3e50;
    }

    .btn-back, .btn-proyectos {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-back {
      background: linear-gradient(135deg, #6c757d, #5a6268);
      color: white;
    }

    .btn-back:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }

    .btn-proyectos {
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      color: white;
    }

    .btn-proyectos:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-left h2 {
      color: #2c3e50;
      margin: 0 0 5px 0;
      font-size: 28px;
      font-weight: 700;
    }

    .subtitle {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    .stats {
      display: flex;
      gap: 15px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      text-align: center;
      min-width: 80px;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .section {
      margin-bottom: 40px;
    }

    .section h3 {
      color: #2c3e50;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .requerimientos-list {
      display: grid;
      gap: 20px;
    }

    .requerimiento-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid transparent;
    }

    .requerimiento-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .requerimiento-card.disponible {
      border-left-color: #28a745;
    }

    .requerimiento-card.activo {
      border-left-color: #667eea;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .card-header h4 {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.disponible {
      background: #d4edda;
      color: #155724;
    }

    .badge.activo {
      background: #cce5ff;
      color: #004085;
    }

    .mensaje {
      color: #555;
      margin: 0 0 15px 0;
      line-height: 1.5;
      font-size: 15px;
    }

    .info {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .especialidad {
      background: #e3f2fd;
      color: #1976d2;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .cliente {
      background: #f8f9fa;
      color: #495057;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary, .btn-secondary, .btn-accent, .btn-refresh {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      font-size: 14px;
      flex: 1;
    }

    .btn-primary {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #dee2e6;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    .btn-accent {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .btn-accent:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-refresh {
      background: #6c757d;
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.6;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .empty-subtitle {
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 20px !important;
    }

    @media (max-width: 768px) {
      .requerimientos-container {
        padding: 15px;
        padding-top: 70px;
      }

      .top-navigation {
        padding: 12px 16px;
      }

      .page-title {
        font-size: 18px;
      }

      .btn-back, .btn-proyectos {
        padding: 8px 14px;
        font-size: 13px;
      }
      
      .header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .info {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class RequerimientoComponent implements OnInit {
  requerimientosDisponibles: Requerimiento[] = [];
  misRequerimientos: Requerimiento[] = [];

  constructor(
    private requerimientosService: RequerimientosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRequerimientos();
  }

  // 🔥 NUEVOS MÉTODOS DE NAVEGACIÓN
  volverAtras(): void {
    this.router.navigate(['/vendedor/bienvenida']);
  }

  irAProyectos(): void {
    this.router.navigate(['/vendedor/mis-proyectos']);
  }

  cargarRequerimientos(): void {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    const vendedor = JSON.parse(usuario);
    const vendedorId = vendedor.id;

    // 🔥 OBTENER LA ESPECIALIDAD DEL VENDEDOR
    const especialidadVendedor = vendedor.especialidades || vendedor.especialidad;
    
    console.log('🔍 Datos del vendedor:', vendedor);
    console.log('🔍 Especialidad del vendedor:', especialidadVendedor);

    // 🔥 PASAR LA ESPECIALIDAD AL SERVICIO
    this.requerimientosService.obtenerRequerimientosDisponibles(especialidadVendedor).subscribe({
      next: (requerimientos) => {
        this.requerimientosDisponibles = requerimientos;
        console.log('✅ Requerimientos disponibles (filtrados):', requerimientos);
      },
      error: (error) => {
        console.error('❌ Error al cargar requerimientos disponibles:', error);
      }
    });

    // Cargar mis requerimientos aceptados
    this.requerimientosService.obtenerRequerimientosVendedor(vendedorId).subscribe({
      next: (requerimientos) => {
        this.misRequerimientos = requerimientos;
        console.log('✅ Mis requerimientos:', requerimientos);
      },
      error: (error) => {
        console.error('❌ Error al cargar mis requerimientos:', error);
      }
    });
  }
}

  aceptarRequerimiento(requerimientoId: number): void {
    if (confirm('¿Estás seguro de que deseas aceptar este proyecto?')) {
      const usuario = localStorage.getItem('usuario');
      if (usuario) {
        const vendedorId = JSON.parse(usuario).id;

        this.requerimientosService.asignarRequerimiento(requerimientoId, vendedorId).subscribe({
          next: () => {
            console.log('Requerimiento aceptado exitosamente');
            alert('✅ ¡Proyecto aceptado exitosamente!');
            this.cargarRequerimientos();
          },
          error: (error) => {
            console.error('Error al aceptar requerimiento:', error);
            alert('❌ Hubo un error al aceptar el proyecto. Intenta nuevamente.');
          }
        });
      }
    }
  }

  verDetalles(requerimiento: Requerimiento): void {
    alert(`Detalles del Proyecto:\n\n` +
          `Título: ${requerimiento.titulo}\n` +
          `Descripción: ${requerimiento.mensaje}\n` +
          `Especialidad: ${requerimiento.especialidad}\n` +
          `Cliente: ${requerimiento.cliente_nombre || 'Cliente #' + requerimiento.cliente_id}`);
  }

  verProyecto(requerimiento: Requerimiento): void {
    alert(`Proyecto Activo:\n\n` +
          `${requerimiento.titulo}\n\n` +
          `Estado: En progreso\n` +
          `Cliente: ${requerimiento.cliente_nombre || 'Cliente #' + requerimiento.cliente_id}\n` +
          `Especialidad: ${requerimiento.especialidad}`);
  }

  gestionarProyecto(requerimientoId: number): void {
    alert('🚀 Gestión del Proyecto\n\n' +
          'Funcionalidades disponibles:\n' +
          '• Comunicarte con el cliente\n' +
          '• Actualizar el progreso\n' +
          '• Subir archivos de entregables\n' +
          '• Marcar como completado\n\n' +
          '(Esta funcionalidad se implementará en "Mis Proyectos")');
  }
}