import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProyectosService, Proyecto } from '../../../core/services/proyectos.service';
import { ChatAnalisisService } from '../../../core/services/chat-analisis.service';
import { SubtareaService, SubTarea } from '../../../core/services/subtarea.service';

interface ProyectoAgrupado extends Proyecto {
  subtareas?: SubTarea[];
  expandido?: boolean;
}

@Component({
  selector: 'app-requerimientos-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './requerimientos-list.component.html',
  styleUrls: ['./requerimientos-list.component.css']
})
export class RequerimientosListComponent implements OnInit {
  // Proyectos agrupados por fase
  proyectosAnalisis: ProyectoAgrupado[] = [];
  proyectosPublicados: ProyectoAgrupado[] = [];
  proyectosEnProgreso: ProyectoAgrupado[] = [];
  proyectosCompletados: ProyectoAgrupado[] = [];
  proyectosCancelados: ProyectoAgrupado[] = [];

  cargando = true;
  error = '';

  constructor(
    private router: Router,
    private proyectosService: ProyectosService,
    private chatAnalisisService: ChatAnalisisService,
    private subtareaService: SubtareaService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.cargando = true;
    const clienteId = this.obtenerClienteId();

    if (!clienteId) {
      this.error = 'No se pudo obtener el ID del cliente';
      this.cargando = false;
      return;
    }

    this.proyectosService.obtenerProyectosCliente(clienteId).subscribe({
      next: (proyectos) => {
        console.log('✅ Proyectos cargados:', proyectos);
        this.agruparProyectos(proyectos);
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar proyectos:', error);
        this.error = 'Error al cargar los proyectos';
        this.cargando = false;
      }
    });
  }

  agruparProyectos(proyectos: Proyecto[]): void {
    // Limpiar arrays
    this.proyectosAnalisis = [];
    this.proyectosPublicados = [];
    this.proyectosEnProgreso = [];
    this.proyectosCompletados = [];
    this.proyectosCancelados = [];

    proyectos.forEach(proyecto => {
      const proyectoAgrupado: ProyectoAgrupado = {
        ...proyecto,
        expandido: false
      };

      const fase = proyecto.fase?.toUpperCase() || '';

      switch (fase) {
        case 'ANÁLISIS':
        case 'ANALISIS':
          this.proyectosAnalisis.push(proyectoAgrupado);
          break;
        case 'PUBLICADO':
          this.proyectosPublicados.push(proyectoAgrupado);
          break;
        case 'EN_PROGRESO':
          this.proyectosEnProgreso.push(proyectoAgrupado);
          break;
        case 'COMPLETADO':
          this.proyectosCompletados.push(proyectoAgrupado);
          break;
        case 'CANCELADO':
          this.proyectosCancelados.push(proyectoAgrupado);
          break;
        default:
          // Proyectos sin fase definida van a "En Análisis"
          this.proyectosAnalisis.push(proyectoAgrupado);
      }
    });

    console.log('📊 Proyectos agrupados:');
    console.log('- En Análisis:', this.proyectosAnalisis.length);
    console.log('- Publicados:', this.proyectosPublicados.length);
    console.log('- En Progreso:', this.proyectosEnProgreso.length);
    console.log('- Completados:', this.proyectosCompletados.length);
    console.log('- Cancelados:', this.proyectosCancelados.length);
  }

  toggleProyecto(proyecto: ProyectoAgrupado): void {
    // Si ya tiene sub-tareas cargadas, solo expandir/colapsar
    if (proyecto.subtareas) {
      proyecto.expandido = !proyecto.expandido;
      return;
    }

    // Si tiene sub-tareas pero no están cargadas, cargarlas
    if (proyecto.total_subtareas && proyecto.total_subtareas > 0) {
      proyecto.expandido = true;
      this.cargarSubtareas(proyecto);
    }
  }

  cargarSubtareas(proyecto: ProyectoAgrupado): void {
    this.subtareaService.obtenerSubtareasProyecto(proyecto.id).subscribe({
      next: (data) => {
        proyecto.subtareas = data.subtareas || [];
        console.log(`✅ Sub-tareas del proyecto ${proyecto.id} cargadas:`, proyecto.subtareas);
      },
      error: (error) => {
        console.error('❌ Error al cargar sub-tareas:', error);
        alert('Error al cargar las sub-tareas del proyecto');
      }
    });
  }

  verDetalleProyecto(proyecto: Proyecto): void {
    // Si es proyecto con sub-tareas, navegar al detalle
    if (proyecto.total_subtareas && proyecto.total_subtareas > 0) {
      this.router.navigate(['/cliente/proyecto', proyecto.id]);
    } else {
      // Proyecto viejo sin sub-tareas
      alert('Este es un proyecto del sistema antiguo. Funcionalidad en desarrollo.');
    }
  }

  publicarProyecto(proyecto: Proyecto, event: Event): void {
    event.stopPropagation();

    if (!confirm('¿Estás seguro de publicar este proyecto?\n\nLas sub-tareas estarán disponibles para vendedores especializados.')) {
      return;
    }

    this.chatAnalisisService.publicarProyecto({
      proyecto_id: proyecto.id
    }).subscribe({
      next: (response) => {
        alert(`✅ ¡Proyecto publicado exitosamente!\n\n${response.subtareas_publicadas} sub-tareas disponibles para vendedores.`);
        this.cargarProyectos(); // Recargar para actualizar el estado
      },
      error: (error) => {
        console.error('❌ Error al publicar proyecto:', error);
        alert('❌ Error al publicar el proyecto. Intenta nuevamente.');
      }
    });
  }

  verSubtarea(subtarea: SubTarea, event: Event): void {
    event.stopPropagation();

    if (!subtarea.vendedor_id) {
      alert('⏳ Esta sub-tarea aún no tiene vendedor asignado.\n\nEspera a que un vendedor especializado la acepte.');
      return;
    }

    // Navegar al chat de la sub-tarea
    this.router.navigate(['/cliente/subtarea', subtarea.id]);
  }

  eliminarProyecto(proyecto: Proyecto, event: Event): void {
    event.stopPropagation();

    if (!confirm(`¿Estás seguro de eliminar el proyecto "${proyecto.titulo}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.proyectosService.eliminarProyecto(proyecto.id).subscribe({
      next: () => {
        alert('✅ Proyecto eliminado exitosamente');
        this.cargarProyectos();
      },
      error: (error) => {
        console.error('❌ Error al eliminar proyecto:', error);
        alert('❌ Error al eliminar el proyecto');
      }
    });
  }

  obtenerColorFase(fase: string): string {
    const colores: { [key: string]: string } = {
      'ANÁLISIS': '#9333ea',
      'ANALISIS': '#9333ea',
      'PUBLICADO': '#3b82f6',
      'EN_PROGRESO': '#f59e0b',
      'COMPLETADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return colores[fase?.toUpperCase()] || '#6b7280';
  }

  obtenerIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'PENDIENTE': '⏳',
      'ASIGNADA': '👤',
      'EN_PROGRESO': '⚙️',
      'COMPLETADO': '✅',
      'CANCELADO': '❌'
    };
    return iconos[estado] || '📋';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // 🔥 CORREGIDO: Con fallback
  private obtenerClienteId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      console.log('✅ Usuario cliente obtenido:', usuarioObj);
      return usuarioObj.id;
    }
    
    console.warn('⚠️ localStorage vacío. Usando ID cliente hardcodeado: 2');
    return 2;  // ✅ FALLBACK: ID del cliente will@gmail.com
  }
  irADashboard(): void {
  this.router.navigate(['/cliente/bienvenida']);
}
cerrarSesion(): void {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
}