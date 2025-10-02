import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ProyectosService, Proyecto } from '../../../core/services/proyectos.service';

export interface Archivo {
  nombre: string;
  fechaSubida: Date;
  tamaño?: string;
}

export interface Mensaje {
  id: number;
  proyectoId: number;
  remitente: 'cliente' | 'vendedor';
  contenido: string;
  fecha: Date;
  leido: boolean;
}

@Component({
  selector: 'app-estado-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './estado-proyectos.component.html',
  styleUrls: ['./estado-proyectos.component.css']
})
export class EstadoProyectosComponent implements OnInit, OnDestroy {
  proyectos: any[] = [];
  proyectoSeleccionado: any | null = null;
  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  mostrarChat: boolean = false;
  cargando: boolean = false;
  enviandoMensaje: boolean = false;
  
  private actualizacionSubscription?: Subscription;

  constructor(
    private router: Router,
    private proyectosService: ProyectosService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  cargarProyectos(): void {
    this.cargando = true;
    
    // Obtener el cliente_id del usuario logueado
    const clienteId = this.obtenerClienteId();
    
    if (!clienteId) {
      console.error('No se encontró el ID del cliente');
      this.cargando = false;
      return;
    }

    // Llamar al servicio real
    this.proyectosService.obtenerProyectosCliente(clienteId).subscribe({
      next: (proyectos) => {
        // Mapear los proyectos y agregar información adicional del vendedor
        this.proyectos = proyectos.map(proyecto => ({
          ...proyecto,
          fechaInicio: new Date(proyecto.fecha_inicio),
          fechaEstimada: proyecto.fecha_estimada ? new Date(proyecto.fecha_estimada) : null,
          fechaCompletado: proyecto.fecha_completado ? new Date(proyecto.fecha_completado) : null,
          ultimaActividad: new Date(proyecto.updated_at),
          archivos: proyecto.archivos || [],
          vendedor: proyecto.vendedor || {
            id: proyecto.vendedor_id,
            nombre: 'Vendedor', // Temporal, se puede mejorar con otro endpoint
            email: '',
            avatar: '👨‍💻'
          }
        }));
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.cargando = false;
      }
    });
  }

  seleccionarProyecto(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.cargarMensajes(proyecto.id);
    this.mostrarChat = true;
  }

  cargarMensajes(proyectoId: number): void {
    // TODO: Implementar servicio de mensajes del chat
    // Por ahora usamos mensajes de ejemplo
    this.mensajes = [
      { 
        id: 1, 
        proyectoId, 
        remitente: 'vendedor', 
        contenido: '¡Hola! He comenzado con el desarrollo de tu proyecto. Te mantendré informado del progreso.', 
        fecha: new Date('2024-09-15T10:30:00'), 
        leido: true 
      },
      { 
        id: 2, 
        proyectoId, 
        remitente: 'cliente', 
        contenido: 'Perfecto, ¿podrías enviarme los avances cuando tengas algo para mostrar?', 
        fecha: new Date('2024-09-15T14:15:00'), 
        leido: true 
      }
    ];
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.proyectoSeleccionado) return;
    
    this.enviandoMensaje = true;
    
    // TODO: Implementar servicio de mensajes del chat
    const mensaje: Mensaje = {
      id: Date.now(), 
      proyectoId: this.proyectoSeleccionado.id, 
      remitente: 'cliente',
      contenido: this.nuevoMensaje.trim(), 
      fecha: new Date(), 
      leido: true
    };
    
    setTimeout(() => {
      this.mensajes.push(mensaje);
      this.nuevoMensaje = '';
      this.enviandoMensaje = false;
      this.scrollToBottom();
    }, 500);
  }

  cerrarChat(): void {
    this.mostrarChat = false;
    this.proyectoSeleccionado = null;
    this.mensajes = [];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

  private iniciarActualizacionAutomatica(): void {
    // Actualizar cada 30 segundos
    this.actualizacionSubscription = interval(30000).subscribe(() => {
      this.cargarProyectos();
    });
  }

  private obtenerClienteId(): number | null {
    // Obtener del localStorage o del servicio de autenticación
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      return usuarioObj.id;
    }
    return null;
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'asignado': '#8b5cf6',
      'en_proceso': '#3b82f6', 
      'pausado': '#f59e0b',
      'completado': '#10b981',
      'cancelado': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const etiquetas: { [key: string]: string } = {
      'asignado': 'Asignado',
      'en_proceso': 'En Proceso',
      'pausado': 'Pausado', 
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return etiquetas[estado] || estado;
  }

  formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(fecha);
  }

  formatearHora(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  }

  formatearFechaArchivo(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  }

  descargarArchivo(nombreArchivo: string): void {
    console.log('Cliente descargando archivo:', nombreArchivo);
    // TODO: Implementar descarga real de archivos
    alert(`Descargando: ${nombreArchivo}`);
  }

  obtenerIconoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    const iconos: { [key: string]: string } = {
      pdf: '📄', 
      doc: '📝', docx: '📝', 
      xls: '📊', xlsx: '📊',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
      fig: '🎨', psd: '🎨',
      zip: '📦', rar: '📦', 
      txt: '📃',
      mp4: '🎥', avi: '🎥',
      mp3: '🎵', wav: '🎵'
    };
    return iconos[extension || ''] || '📄';
  }
}