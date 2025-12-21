import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubtareaService } from '../../../core/services/subtarea.service';
import { ServicioAuth } from '../../../core/services/auth.service';

interface ProyectoConSubtareas {
  proyecto_id: number;
  proyecto_titulo: string;
  proyecto_descripcion?: string;
  proyecto_presupuesto?: number;
  proyecto_tiempo_estimado?: number;
  cliente_id: number;
  cliente_nombre: string;
  subtareas: SubtareaDisponible[];
  expandido: boolean;
}

interface SubtareaDisponible {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  especialidad: string;
  prioridad: string;
  estimacion_horas: number;
  proyecto_id: number;
  proyecto_titulo?: string;
  cliente_nombre?: string;
}

@Component({
  selector: 'app-requerimientos-vendedor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="requerimientos-container">
      <!-- Barra de navegación superior -->
      <div class="top-navigation">
        <button class="btn-back" (click)="volverAtras()">
          ← Atrás
        </button>
        <h2 class="page-title">Oportunidades Disponibles</h2>
        <button class="btn-proyectos" (click)="irAProyectos()">
          📂 Mis Proyectos
        </button>
      </div>

      <!-- Header con estadísticas -->
      <div class="header">
        <div class="header-left">
          <h2>🎯 Sub-tareas Disponibles</h2>
          <p class="subtitle">
            Proyectos que coinciden con tu especialidad: 
            <span class="especialidad-badge">{{ especialidadesVendedor[0] || 'Todas' }}</span>
          </p>
        </div>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-number">{{ totalSubtareasDisponibles }}</span>
            <span class="stat-label">Sub-tareas</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ proyectosAgrupados.length }}</span>
            <span class="stat-label">Proyectos</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando oportunidades...</p>
      </div>

      <!-- Lista de proyectos con sub-tareas -->
      <div *ngIf="!cargando" class="proyectos-list">
        
        <!-- Por cada proyecto -->
        <div *ngFor="let proyecto of proyectosAgrupados" class="proyecto-card">
          
          <!-- Header del proyecto (siempre visible) -->
          <div class="proyecto-header" (click)="toggleProyecto(proyecto.proyecto_id)">
            <div class="proyecto-info">
              <h3>{{ proyecto.proyecto_titulo }}</h3>
              <p class="cliente">👤 {{ proyecto.cliente_nombre }}</p>
            </div>
            <div class="proyecto-meta">
              <span class="subtareas-count">
                {{ proyecto.subtareas.length }} sub-tarea{{ proyecto.subtareas.length !== 1 ? 's' : '' }} disponible{{ proyecto.subtareas.length !== 1 ? 's' : '' }}
              </span>
              <span class="expand-icon">{{ proyecto.expandido ? '▼' : '▶' }}</span>
            </div>
          </div>

          <!-- Detalle del proyecto (expandible) -->
          <div class="proyecto-detalle" *ngIf="proyecto.expandido">
            
            <!-- Sub-tareas del proyecto -->
            <div class="subtareas-list">
              <div *ngFor="let subtarea of proyecto.subtareas" class="subtarea-card">
                
                <!-- Header de la sub-tarea -->
                <div class="subtarea-header">
                  <div class="subtarea-codigo">
                    {{ getPrioridadIcon(subtarea.prioridad) }} {{ subtarea.codigo }}
                  </div>
                  <span class="prioridad-badge" [style.background-color]="getPrioridadColor(subtarea.prioridad)">
                    {{ subtarea.prioridad }}
                  </span>
                </div>

                <!-- Contenido de la sub-tarea -->
                <div class="subtarea-body">
                  <h4>{{ subtarea.titulo }}</h4>
                  <p class="descripcion">{{ subtarea.descripcion }}</p>

                  <div class="subtarea-info">
                    <div class="info-item">
                      <span class="icon">⏱️</span>
                      <span class="text">{{ subtarea.estimacion_horas }}h estimadas</span>
                    </div>
                    <div class="info-item">
                      <span class="icon">⚙️</span>
                      <span class="text">{{ subtarea.especialidad }}</span>
                    </div>
                  </div>

                  <!-- 🔥 BOTÓN CONDICIONAL -->
                  <button 
                    *ngIf="puedeAceptarSubtarea(subtarea)"
                    class="btn-aceptar" 
                    (click)="aceptarSubtarea(subtarea.id)">
                    ✅ Aceptar Sub-tarea
                  </button>

                  <button 
                    *ngIf="!puedeAceptarSubtarea(subtarea)"
                    class="btn-no-disponible" 
                    disabled>
                    🚫 No es tu especialidad
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

        <!-- Empty state -->
        <div *ngIf="proyectosAgrupados.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No hay sub-tareas disponibles</h3>
          <p>No encontramos sub-tareas que coincidan con tu especialidad en este momento.</p>
          <p class="empty-subtitle">Vuelve pronto para ver nuevas oportunidades</p>
          <button class="btn-refresh" (click)="cargarSubtareasDisponibles()">
            🔄 Actualizar
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .requerimientos-container {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 20px;
      padding-top: 80px;
      max-width: 1400px;
      margin: 0 auto;
    }

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
    }

    .btn-back {
      background: linear-gradient(135deg, #6c757d, #5a6268);
      color: white;
    }

    .btn-proyectos {
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      color: white;
    }

    .btn-back:hover, .btn-proyectos:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
    }

    .subtitle {
      color: #666;
      margin: 0;
      font-size: 15px;
    }

    .especialidad-badge {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
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
      min-width: 100px;
    }

    .stat-number {
      display: block;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .proyectos-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .proyecto-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .proyecto-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .proyecto-header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }

    .proyecto-header:hover {
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    }

    .proyecto-info h3 {
      margin: 0 0 6px 0;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
    }

    .cliente {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .proyecto-meta {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .subtareas-count {
      background: #667eea;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .expand-icon {
      font-size: 18px;
      color: #667eea;
      font-weight: bold;
    }

    .proyecto-detalle {
      padding: 24px;
      border-top: 2px solid #f0f0f0;
    }

    .subtareas-list {
      display: grid;
      gap: 16px;
    }

    .subtarea-card {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }

    .subtarea-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .subtarea-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .subtarea-codigo {
      font-weight: 600;
      color: #495057;
      font-size: 14px;
    }

    .prioridad-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
    }

    .subtarea-body h4 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .descripcion {
      color: #555;
      line-height: 1.6;
      margin: 0 0 16px 0;
      font-size: 14px;
    }

    .subtarea-info {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: white;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      color: #495057;
    }

    .icon {
      font-size: 16px;
    }

    .btn-aceptar {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-aceptar:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.3);
    }

    /* 🔥 NUEVO ESTILO PARA BOTÓN DESHABILITADO */
    .btn-no-disponible {
      width: 100%;
      padding: 12px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 22px;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 15px;
    }

    .empty-subtitle {
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 24px !important;
    }

    .btn-refresh {
      padding: 12px 24px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-refresh:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .requerimientos-container {
        padding: 15px;
        padding-top: 70px;
      }

      .header {
        flex-direction: column;
      }

      .stats {
        width: 100%;
        justify-content: space-around;
      }

      .proyecto-meta {
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
    }
  `]
})
export class RequerimientoComponent implements OnInit {
  proyectosAgrupados: ProyectoConSubtareas[] = [];
  subtareasDisponibles: SubtareaDisponible[] = [];
  cargando: boolean = true;
  especialidadesVendedor: string[] = [];
  totalSubtareasDisponibles: number = 0;

  constructor(
    private subtareaService: SubtareaService,
    private router: Router
    
    , private authService: ServicioAuth
  ) {}

  ngOnInit(): void {
  this.obtenerEspecialidadVendedor();
  // 🔥 NO llamar aquí, llamar al final de obtenerEspecialidadVendedor()
}

obtenerEspecialidadVendedor(): void {
  let usuario = localStorage.getItem('usuario');
  
  // 🔥 FALLBACK: Si localStorage está vacío, intentar obtener del servicio
  if (!usuario) {
    console.warn('⚠️ localStorage vacío, intentando obtener del AuthService...');
    const usuarioActual = this.authService?.obtenerUsuarioActual();
    if (usuarioActual) {
      usuario = JSON.stringify(usuarioActual);
      localStorage.setItem('usuario', usuario); // Guardarlo para próximas veces
    } else {
      console.error('❌ No hay usuario en localStorage ni en AuthService');
      this.cargando = false;
      return;
    }
  }
  
  const vendedor = JSON.parse(usuario);
  
  console.log('🔍 Usuario completo:', vendedor);
  console.log('🔍 Especialidades raw:', vendedor.especialidades);
  console.log('🔍 Tipo:', typeof vendedor.especialidades);
  
  // 🔥 Guardar TODAS las especialidades
  if (Array.isArray(vendedor.especialidades)) {
    this.especialidadesVendedor = vendedor.especialidades;
  } else if (typeof vendedor.especialidades === 'string') {
    try {
      // Si viene como JSON string
      const parsed = JSON.parse(vendedor.especialidades);
      this.especialidadesVendedor = Array.isArray(parsed) ? parsed : [vendedor.especialidades];
    } catch {
      // Si viene como string con comas
      this.especialidadesVendedor = vendedor.especialidades.split(',').map((e: string) => e.trim());
    }
  }
  
  console.log('✅ Especialidades cargadas:', this.especialidadesVendedor);
  
  // 🔥 AHORA SÍ cargar sub-tareas
  this.cargarSubtareasDisponibles();
}

  // 🔥 NUEVO MÉTODO: Verifica si puede aceptar la sub-tarea
  puedeAceptarSubtarea(subtarea: SubtareaDisponible): boolean {
  // Convertir especialidades del vendedor a códigos
  const especialidadesVendedorCodigos = this.especialidadesVendedor.map(esp => 
    this.convertirEspecialidadACodigo(esp)
  );
  
  // 🔥 TAMBIÉN convertir la especialidad de la sub-tarea a código
  const especialidadSubtareaCodigo = this.convertirEspecialidadACodigo(subtarea.especialidad);
  
  // Verificar si hacen match
  const puedeAceptar = especialidadesVendedorCodigos.includes(especialidadSubtareaCodigo);
  
  console.log(`🔍 ¿Puede aceptar "${subtarea.codigo}"?`, puedeAceptar);
  console.log(`   Especialidad sub-tarea (original): ${subtarea.especialidad}`);
  console.log(`   Especialidad sub-tarea (código): ${especialidadSubtareaCodigo}`);
  console.log(`   Especialidades vendedor (códigos): ${especialidadesVendedorCodigos.join(', ')}`);
  
  return puedeAceptar;
}

  // 🔥 HELPER: Convierte nombres a códigos
  private convertirEspecialidadACodigo(especialidad: string): string {
    const mapeo: { [key: string]: string } = {
      "Consultoría en desarrollo de sistemas": "CONSULTORIA_DESARROLLO",
      "Consultoría en hardware": "CONSULTORIA_HARDWARE",
      "Consultoría en software": "CONSULTORIA_SOFTWARE",
      "Desarrollo de software a medida": "DESARROLLO_MEDIDA",
      "Desarrollo y producción de software empaquetado": "SOFTWARE_EMPAQUETADO",
      "Actualización y adaptación de software": "ACTUALIZACION_SOFTWARE",
      "Servicios de alojamiento de datos (hosting)": "HOSTING",
      "Servicios de procesamiento de datos": "PROCESAMIENTO_DATOS",
      "Servicios en la nube (cloud computing)": "CLOUD_COMPUTING",
      "Servicios de recuperación ante desastres": "RECUPERACION_DESASTRES",
      "Servicios de ciberseguridad": "CIBERSEGURIDAD",
      "Capacitación en TI": "CAPACITACION_TI"
    };
    
    return mapeo[especialidad] || especialidad;
  }

 cargarSubtareasDisponibles(): void {
  // 🔥 VALIDACIÓN: Si no hay especialidades, obtenerlas primero
  if (!this.especialidadesVendedor || this.especialidadesVendedor.length === 0) {
    console.warn('⚠️ Especialidades vacías, recargando usuario...');
    this.obtenerEspecialidadVendedor();
    return;
  }

  this.cargando = true;
  
  // 🔥 CONVERTIR A CÓDIGOS antes de enviar
  const especialidadesCodigos = this.especialidadesVendedor.map(esp => 
    this.convertirEspecialidadACodigo(esp)
  );
  const especialidadesStr = especialidadesCodigos.join(',');
  
  console.log('🔍 Especialidades del vendedor (nombres):', this.especialidadesVendedor);
  console.log('🔍 Especialidades convertidas (códigos):', especialidadesCodigos);
  console.log('🔍 String enviado al backend:', especialidadesStr);
  
  this.subtareaService.obtenerSubtareasDisponibles(especialidadesStr).subscribe({
    next: (response) => {
      console.log('✅ Respuesta del servidor:', response);
      console.log('📊 Sub-tareas recibidas:', response.subtareas);
      console.log('📊 Total:', response.total);
      
      this.subtareasDisponibles = response.subtareas || [];
      this.totalSubtareasDisponibles = response.total || 0;
      
      this.agruparPorProyecto();
      
      this.cargando = false;
    },
    error: (error) => {
      console.error('❌ Error al cargar sub-tareas:', error);
      this.cargando = false;
    }
  });
}

  agruparPorProyecto(): void {
    const proyectosMap = new Map<number, ProyectoConSubtareas>();
    
    this.subtareasDisponibles.forEach(subtarea => {
      if (!proyectosMap.has(subtarea.proyecto_id)) {
        proyectosMap.set(subtarea.proyecto_id, {
          proyecto_id: subtarea.proyecto_id,
          proyecto_titulo: subtarea.proyecto_titulo || 'Proyecto sin título',
          cliente_id: 0,
          cliente_nombre: subtarea.cliente_nombre || 'Cliente desconocido',
          subtareas: [],
          expandido: false
        });
      }
      
      proyectosMap.get(subtarea.proyecto_id)!.subtareas.push(subtarea);
    });
    
    this.proyectosAgrupados = Array.from(proyectosMap.values());
    console.log('📊 Proyectos agrupados:', this.proyectosAgrupados);
  }

  toggleProyecto(proyectoId: number): void {
    const proyecto = this.proyectosAgrupados.find(p => p.proyecto_id === proyectoId);
    if (proyecto) {
      proyecto.expandido = !proyecto.expandido;
    }
  }

  aceptarSubtarea(subtareaId: number): void {
  const subtarea = this.subtareasDisponibles.find(s => s.id === subtareaId);
  
  if (!subtarea) {
    alert('❌ Sub-tarea no encontrada');
    return;
  }

  if (!this.puedeAceptarSubtarea(subtarea)) {
    alert('❌ No tienes la especialidad requerida para esta sub-tarea');
    return;
  }

  const confirmacion = confirm(
    `¿Deseas aceptar esta sub-tarea?\n\n` +
    `📋 ${subtarea.titulo}\n` +
    `⏱️ Estimación: ${subtarea.estimacion_horas}h\n` +
    `🔴 Prioridad: ${subtarea.prioridad}\n\n` +
    `Una vez aceptada, aparecerá en "Mis Proyectos"`
  );

  if (!confirmacion) return;

  const vendedorId = this.obtenerVendedorId();
  if (!vendedorId) {
    alert('❌ Error: No se pudo obtener tu ID de vendedor');
    return;
  }

  this.subtareaService.aceptarSubtarea(subtareaId, vendedorId).subscribe({
    next: (response) => {
      console.log('✅ Sub-tarea aceptada:', response);
      alert(`✅ ¡Sub-tarea "${subtarea.titulo}" aceptada exitosamente!\n\nAhora aparecerá en "Mis Proyectos"`);
      
      // 🔥 SOLUCIÓN: Recargar desde obtenerEspecialidadVendedor para asegurar que las especialidades estén cargadas
      this.obtenerEspecialidadVendedor();
    },
    error: (error) => {
      console.error('❌ Error al aceptar sub-tarea:', error);
      alert('❌ Error al aceptar la sub-tarea. Intenta nuevamente.');
    }
  });
}

  volverAtras(): void {
    this.router.navigate(['/vendedor/bienvenida']);
  }

  irAProyectos(): void {
    this.router.navigate(['/vendedor/mis-proyectos']);
  }

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': '#ef4444',
      'MEDIA': '#f59e0b',
      'BAJA': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  }

  getPrioridadIcon(prioridad: string): string {
    const iconos: { [key: string]: string } = {
      'ALTA': '🔴',
      'MEDIA': '🟡',
      'BAJA': '🟢'
    };
    return iconos[prioridad] || '⚪';
  }

  private obtenerVendedorId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      return JSON.parse(usuario).id;
    }
    return 2; // Fallback
  }
}