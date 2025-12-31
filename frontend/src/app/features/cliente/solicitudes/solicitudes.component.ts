import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { ProyectosService, Proyecto } from '../../../core/services/proyectos.service';

interface SolicitudExtendida {
  id: number;
  subtarea_id: number;
  vendedor_id: number;
  estado: string;
  mensaje?: string;
  motivo_rechazo?: string;
  fecha_solicitud: string;
  fecha_respuesta?: string;
  subtarea_codigo?: string;
  subtarea_titulo?: string;
  vendedor_nombre?: string;
  vendedor_email?: string;
  // Datos adicionales
  proyecto_id?: number;
  proyecto_titulo?: string;
}

interface ProyectoConSolicitudes {
  proyecto: Proyecto;
  solicitudes: SolicitudExtendida[];
  expandido: boolean;
}

@Component({
  selector: 'app-solicitudes-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  proyectosConSolicitudes: ProyectoConSolicitudes[] = [];
  cargando = true;
  error = '';

  constructor(
    private router: Router,
    private solicitudService: SolicitudService,
    private proyectosService: ProyectosService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    const clienteId = this.obtenerClienteId();

    if (!clienteId) {
      this.error = 'No se pudo obtener el ID del cliente';
      this.cargando = false;
      return;
    }

    // Primero obtener todos los proyectos del cliente
    this.proyectosService.obtenerProyectosCliente(clienteId).subscribe({
      next: (proyectos) => {
        console.log('✅ Proyectos del cliente:', proyectos);
        
        // Para cada proyecto, obtener sus solicitudes
        const promesas = proyectos.map(proyecto => 
          this.solicitudService.obtenerSolicitudesProyecto(proyecto.id).toPromise()
            .then(solicitudes => ({
              proyecto,
              solicitudes: solicitudes || [],
              expandido: false
            }))
        );

        Promise.all(promesas).then(resultados => {
          // Filtrar solo proyectos con solicitudes pendientes
          this.proyectosConSolicitudes = resultados.filter(r => r.solicitudes.length > 0);
          
          console.log('📬 Proyectos con solicitudes:', this.proyectosConSolicitudes);
          this.cargando = false;
        }).catch(error => {
          console.error('❌ Error al cargar solicitudes:', error);
          this.error = 'Error al cargar las solicitudes';
          this.cargando = false;
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar proyectos:', error);
        this.error = 'Error al cargar los proyectos';
        this.cargando = false;
      }
    });
  }

  toggleProyecto(proyectoConSol: ProyectoConSolicitudes): void {
    proyectoConSol.expandido = !proyectoConSol.expandido;
  }

  aceptarSolicitud(solicitud: SolicitudExtendida, event: Event): void {
    event.stopPropagation();

    const confirmacion = confirm(
      `¿Deseas aceptar la solicitud de:\n\n` +
      `👤 Vendedor: ${solicitud.vendedor_nombre}\n` +
      `📧 Email: ${solicitud.vendedor_email}\n` +
      `📋 Sub-tarea: ${solicitud.subtarea_titulo}\n\n` +
      `Esta sub-tarea será asignada a este vendedor.`
    );

    if (!confirmacion) return;

    this.solicitudService.responderSolicitud(solicitud.id, {
      accion: 'ACEPTAR'
    }).subscribe({
      next: (response) => {
        console.log('✅ Solicitud aceptada:', response);
        alert(`✅ ¡Solicitud aceptada!\n\nLa sub-tarea ha sido asignada a ${solicitud.vendedor_nombre}`);
        this.cargarSolicitudes(); // Recargar
      },
      error: (error) => {
        console.error('❌ Error al aceptar solicitud:', error);
        alert('❌ Error al aceptar la solicitud. Intenta nuevamente.');
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudExtendida, event: Event): void {
    event.stopPropagation();

    const motivo = prompt(
      `Rechazar solicitud de: ${solicitud.vendedor_nombre}\n\n` +
      `Escribe el motivo del rechazo (opcional):`
    );

    if (motivo === null) return; // Usuario canceló

    this.solicitudService.responderSolicitud(solicitud.id, {
      accion: 'RECHAZAR',
      motivo_rechazo: motivo || undefined
    }).subscribe({
      next: (response) => {
        console.log('✅ Solicitud rechazada:', response);
        alert('✅ Solicitud rechazada');
        this.cargarSolicitudes(); // Recargar
      },
      error: (error) => {
        console.error('❌ Error al rechazar solicitud:', error);
        alert('❌ Error al rechazar la solicitud. Intenta nuevamente.');
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private obtenerClienteId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      return usuarioObj.id;
    }
    return null;
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