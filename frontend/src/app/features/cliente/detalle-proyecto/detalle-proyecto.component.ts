import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubtareaService, SubTarea, EstadisticasProyecto } from '../../../core/services/subtarea.service';
import { ChatAnalisisService } from '../../../core/services/chat-analisis.service';

@Component({
  selector: 'app-detalle-proyecto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-proyecto.component.html',
  styleUrls: ['./detalle-proyecto.component.css']
})
export class DetalleProyectoComponent implements OnInit {
  proyectoId: number = 0;
  estadisticas: EstadisticasProyecto | null = null;
  cargando = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subtareaService: SubtareaService,
    private chatAnalisisService: ChatAnalisisService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.proyectoId = +params['id'];
      if (this.proyectoId) {
        this.cargarProyecto();
      }
    });
  }

  cargarProyecto(): void {
    this.cargando = true;
    this.subtareaService.obtenerSubtareasProyecto(this.proyectoId).subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando proyecto:', error);
        this.error = 'Error al cargar el proyecto';
        this.cargando = false;
      }
    });
  }

  // 🔥 NUEVO: Ver detalle de sub-tarea
  verDetalleSubtarea(subtarea: SubTarea): void {
    // Validar que tenga vendedor asignado
    if (subtarea.estado === 'PENDIENTE' || !subtarea.vendedor_id) {
      alert('⏳ Esta sub-tarea aún no tiene vendedor asignado.\n\nEspera a que un vendedor especializado la acepte.');
      return;
    }

    // Navegar a la vista de chat de la sub-tarea
    console.log('🔀 Navegando a sub-tarea:', subtarea.id);
    this.router.navigate(['/cliente/subtarea', subtarea.id]);
  }

  publicarProyecto(): void {
    if (!confirm('¿Estás seguro de publicar este proyecto? Las sub-tareas estarán disponibles para vendedores.')) {
      return;
    }

    this.chatAnalisisService.publicarProyecto({
      proyecto_id: this.proyectoId
    }).subscribe({
      next: (response) => {
        alert(`¡Proyecto publicado! ${response.subtareas_publicadas} sub-tareas disponibles para vendedores.`);
        this.cargarProyecto();
      },
      error: (error) => {
        console.error('Error publicando:', error);
        alert('Error al publicar el proyecto');
      }
    });
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'estado-pendiente',
      'ASIGNADA': 'estado-asignado',
      'EN_PROGRESO': 'estado-en-progreso',
      'COMPLETADO': 'estado-completado',
      'CANCELADO': 'estado-cancelado'
    };
    return colores[estado] || 'estado-pendiente';
  }

  getPrioridadIcon(prioridad: string): string {
    const iconos: { [key: string]: string } = {
      'ALTA': '🔴',
      'MEDIA': '🟡',
      'BAJA': '🟢'
    };
    return iconos[prioridad] || '⚪';
  }

  getNombreEspecialidad(codigo: string): string {
    const nombres: { [key: string]: string } = {
      'CONSULTORIA_DESARROLLO': 'Consultoría en desarrollo',
      'CONSULTORIA_HARDWARE': 'Consultoría en hardware',
      'CONSULTORIA_SOFTWARE': 'Consultoría en software',
      'DESARROLLO_MEDIDA': 'Desarrollo a medida',
      'SOFTWARE_EMPAQUETADO': 'Software empaquetado',
      'ACTUALIZACION_SOFTWARE': 'Actualización de software',
      'HOSTING': 'Hosting',
      'PROCESAMIENTO_DATOS': 'Procesamiento de datos',
      'CLOUD_COMPUTING': 'Cloud computing',
      'RECUPERACION_DESASTRES': 'Recuperación ante desastres',
      'CIBERSEGURIDAD': 'Ciberseguridad',
      'CAPACITACION_TI': 'Capacitación en TI'
    };
    return nombres[codigo] || codigo;
  }

  volver(): void {
    this.router.navigate(['/cliente/requerimientos']);
  }
}