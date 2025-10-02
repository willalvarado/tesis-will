import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';

export interface Archivo {
  nombre: string;
  fechaSubida: Date;
  tamaño?: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  cliente: string;
  vendedor: { id: number; nombre: string; email: string; avatar?: string; };
  estado: 'asignado' | 'en_proceso' | 'pausado' | 'completado' | 'cancelado';
  fechaInicio: Date;
  fechaEstimada: Date;
  fechaCompletado?: Date;
  presupuesto: number;
  pagado: number;
  archivos: Archivo[];
  progreso: number;
  ultimaActividad: Date;
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
  proyectos: Proyecto[] = [];
  proyectoSeleccionado: Proyecto | null = null;
  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  mostrarChat: boolean = false;
  cargando: boolean = false;
  enviandoMensaje: boolean = false;
  
  private actualizacionSubscription?: Subscription;

  constructor(private router: Router) {}

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
    
    setTimeout(() => {
      this.proyectos = [
        {
          id: 1,
          nombre: "E-commerce Boutique Fashion",
          descripcion: "Desarrollo de tienda online para ropa femenina con sistema de pagos integrado",
          cliente: "María González",
          vendedor: { id: 101, nombre: "Carlos Rodríguez", email: "carlos@dev.com", avatar: "👨‍💻" },
          estado: 'en_proceso',
          fechaInicio: new Date('2024-09-01'),
          fechaEstimada: new Date('2024-10-15'),
          presupuesto: 2500,
          pagado: 1000,
          archivos: [
            { nombre: 'wireframes.pdf', fechaSubida: new Date('2024-09-05T10:30:00') },
            { nombre: 'propuesta.docx', fechaSubida: new Date('2024-09-03T14:15:00') },
            { nombre: 'diseños_v1.fig', fechaSubida: new Date('2024-09-15T16:45:00') }
          ],
          progreso: 65,
          ultimaActividad: new Date('2024-09-20')
        },
        {
          id: 2,
          nombre: "App Móvil Delivery",
          descripcion: "Aplicación móvil para delivery de comida con GPS y pagos móviles",
          cliente: "María González",
          vendedor: { id: 102, nombre: "Ana Martínez", email: "ana@dev.com", avatar: "👩‍💻" },
          estado: 'pausado',
          fechaInicio: new Date('2024-09-10'),
          fechaEstimada: new Date('2024-11-20'),
          presupuesto: 4000,
          pagado: 800,
          archivos: [
            { nombre: 'mockups.fig', fechaSubida: new Date('2024-09-12T09:45:00') },
            { nombre: 'requerimientos.pdf', fechaSubida: new Date('2024-09-11T16:20:00') }
          ],
          progreso: 25,
          ultimaActividad: new Date('2024-09-18')
        }
      ];
      this.cargando = false;
    }, 1000);
  }

  seleccionarProyecto(proyecto: Proyecto): void {
    this.proyectoSeleccionado = proyecto;
    this.cargarMensajes(proyecto.id);
    this.mostrarChat = true;
  }

  cargarMensajes(proyectoId: number): void {
    this.mensajes = [
      { 
        id: 1, 
        proyectoId, 
        remitente: 'vendedor', 
        contenido: '¡Hola María! He comenzado con el desarrollo de tu proyecto. Te mantendré informada del progreso.', 
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
      },
      { 
        id: 3, 
        proyectoId, 
        remitente: 'vendedor', 
        contenido: 'Por supuesto. Ya tengo el 65% completado. Te comparto el wireframe actualizado en los archivos.', 
        fecha: new Date('2024-09-20T09:45:00'), 
        leido: false 
      }
    ];
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.proyectoSeleccionado) return;
    
    this.enviandoMensaje = true;
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
    this.actualizacionSubscription = interval(30000).subscribe(() => {
      this.cargarProyectos();
    });
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

  obtenerEstadoProyecto(estado: string): string {
    switch(estado) {
      case 'asignado':
        return 'Tu proyecto ha sido asignado y pronto comenzará el desarrollo';
      case 'en_proceso':
        return 'Tu proyecto está en desarrollo activo';
      case 'pausado':
        return 'El desarrollo está temporalmente pausado';
      case 'completado':
        return '¡Tu proyecto ha sido completado exitosamente!';
      case 'cancelado':
        return 'Este proyecto ha sido cancelado';
      default:
        return 'Estado desconocido';
    }
  }
}