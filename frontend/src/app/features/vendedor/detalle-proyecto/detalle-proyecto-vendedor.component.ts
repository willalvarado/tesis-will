import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SubtareaService } from '../../../core/services/subtarea.service';
import { Location } from '@angular/common';

interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string;
  cliente: {
    id: number;
    nombre: string;
    email: string;
  };
  presupuesto: number;
  fecha_inicio: string;
  fecha_estimada: string | null;
  fase: string;
  total_subtareas: number;
  subtareas_completadas: number;
}

interface SubTarea {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  especialidad: string;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'EN_PROGRESO' | 'COMPLETADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estimacion_horas: number;
  vendedor_id: number | null;
  vendedor_nombre: string | null;
}

@Component({
  selector: 'app-detalle-proyecto-vendedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-proyecto-vendedor.component.html',
  styleUrls: ['./detalle-proyecto-vendedor.component.css']
})
export class DetalleProyectoVendedorComponent implements OnInit {
  proyectoId!: number;
  proyecto: Proyecto | null = null;
  misSubtareas: SubTarea[] = [];
  cargando: boolean = true;
  vendedorId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private subtareaService: SubtareaService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Obtener ID del vendedor
    this.vendedorId = this.obtenerVendedorId();
    
    // Obtener ID del proyecto desde la URL
    this.route.params.subscribe(params => {
      this.proyectoId = +params['id'];
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    
    // Cargar proyecto
    this.http.get<Proyecto>(`http://localhost:8000/proyectos/${this.proyectoId}`)
      .subscribe({
        next: (proyecto) => {
          this.proyecto = proyecto;
          console.log('✅ Proyecto cargado:', proyecto);
          
          // Cargar sub-tareas del proyecto
          this.cargarSubtareas();
        },
        error: (error) => {
          console.error('❌ Error cargando proyecto:', error);
          this.cargando = false;
        }
      });
  }

  cargarSubtareas(): void {
    this.subtareaService.obtenerSubtareasProyecto(this.proyectoId)
      .subscribe({
        next: (response: any) => {
          // Filtrar SOLO las sub-tareas asignadas a este vendedor
          const todasSubtareas = response.subtareas || [];
          this.misSubtareas = todasSubtareas.filter(
            (st: SubTarea) => st.vendedor_id === this.vendedorId
          );
          
          console.log('✅ Mis sub-tareas en este proyecto:', this.misSubtareas);
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error cargando sub-tareas:', error);
          this.cargando = false;
        }
      });
  }

  cambiarEstadoSubtarea(subtarea: SubTarea, nuevoEstado: string): void {
    const confirmacion = confirm(
      `¿Cambiar el estado de "${subtarea.titulo}" a ${nuevoEstado}?`
    );
    
    if (!confirmacion) return;

    this.subtareaService.actualizarProgreso(subtarea.id, nuevoEstado)
      .subscribe({
        next: (response) => {
          console.log('✅ Estado actualizado:', response);
          alert(`Estado actualizado a ${nuevoEstado}`);
          
          // Recargar datos
          this.cargarDatos();
        },
        error: (error) => {
          console.error('❌ Error actualizando estado:', error);
          alert('Error al actualizar el estado');
        }
      });
  }

  abrirChat(subtareaId: number): void {
    this.router.navigate(['/vendedor/subtarea', subtareaId]);
  }

  volverAtras(): void {
  this.location.back(); // ← Cambiar a location.back()
}

  private obtenerVendedorId(): number | null {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    const usuarioObj = JSON.parse(usuario);
    console.log('✅ Usuario vendedor obtenido:', usuarioObj);
    return usuarioObj.id;
  }
  
  console.warn('⚠️ localStorage vacío. Usando ID vendedor hardcodeado: 2');
  return 2;  // ✅ FALLBACK temporal
}

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': '#ef4444',
      'MEDIA': '#f59e0b',
      'BAJA': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'ASIGNADA': '#8b5cf6',
      'EN_PROGRESO': '#3b82f6',
      'COMPLETADO': '#10b981'
    };
    return colores[estado] || '#6b7280';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No definida';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(fecha));
  }
  irADashboard(): void {
  this.router.navigate(['/vendedor/bienvenida']);
}
cerrarSesion(): void {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
}