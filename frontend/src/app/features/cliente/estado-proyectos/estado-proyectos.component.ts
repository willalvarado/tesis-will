import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ProyectosService, Proyecto } from '../../../core/services/proyectos.service';
import { ChatService, Mensaje as MensajeChat } from '../../../core/services/chat.service';

export interface Archivo {
  nombre: string;
  fechaSubida: Date;
  tamaño?: string;
}

export interface MensajeUI {
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
  mensajes: MensajeUI[] = [];
  nuevoMensaje: string = '';
  mostrarChat: boolean = false;
  cargando: boolean = false;
  enviandoMensaje: boolean = false;
  
  private actualizacionSubscription?: Subscription;
  private mensajesSubscription?: Subscription;

  constructor(
    private router: Router,
    private proyectosService: ProyectosService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
    this.chatService.desconectarChat();
  }

  cargarProyectos(): void {
    this.cargando = true;
    
    const clienteId = this.obtenerClienteId();
    
    if (!clienteId) {
      console.error('No se encontró el ID del cliente');
      this.cargando = false;
      return;
    }

    this.proyectosService.obtenerProyectosCliente(clienteId).subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos.map(proyecto => ({
          ...proyecto,
          fechaInicio: new Date(proyecto.fecha_inicio),
          fechaEstimada: proyecto.fecha_estimada ? new Date(proyecto.fecha_estimada) : null,
          fechaCompletado: proyecto.fecha_completado ? new Date(proyecto.fecha_completado) : null,
          ultimaActividad: new Date(proyecto.updated_at),
          archivos: proyecto.archivos || [],
          vendedor: proyecto.vendedor || {
            id: proyecto.vendedor_id,
            nombre: 'Vendedor',
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
    
    console.log('🔌 Conectando al chat del proyecto:', proyecto.id);
    
    // Conectar al WebSocket del proyecto
    this.chatService.conectarChat(proyecto.id);
    
    // Cargar historial de mensajes
    this.cargarMensajes(proyecto.id);
    
    // Suscribirse a mensajes en tiempo real
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
    
    this.mensajesSubscription = this.chatService.mensajes$.subscribe(mensaje => {
      console.log('📩 Nuevo mensaje recibido en tiempo real:', mensaje);
      
      // Solo agregar si no está ya en la lista (evitar duplicados)
      const existe = this.mensajes.find(m => m.id === mensaje.id);
      if (!existe) {
        this.mensajes.push({
          id: mensaje.id || Date.now(),
          proyectoId: mensaje.proyecto_id,
          remitente: mensaje.remitente_tipo,
          contenido: mensaje.contenido,
          fecha: mensaje.created_at ? new Date(mensaje.created_at) : new Date(),
          leido: mensaje.leido
        });
        this.scrollToBottom();
      }
    });
    
    this.mostrarChat = true;
    
    // Hacer focus en el input después de abrir el modal
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 300);
  }

  cargarMensajes(proyectoId: number): void {
    console.log('📚 Cargando historial de mensajes del proyecto:', proyectoId);
    
    this.chatService.obtenerMensajes(proyectoId).subscribe({
      next: (mensajes) => {
        console.log('✅ Mensajes cargados:', mensajes);
        this.mensajes = mensajes.map(m => ({
          id: m.id || 0,
          proyectoId: m.proyecto_id,
          remitente: m.remitente_tipo,
          contenido: m.contenido,
          fecha: m.created_at ? new Date(m.created_at) : new Date(),
          leido: m.leido
        }));
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('❌ Error al cargar mensajes:', error);
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.proyectoSeleccionado) return;
    
    const clienteId = this.obtenerClienteId();
    if (!clienteId) {
      console.error('No se pudo obtener el ID del cliente');
      return;
    }
    
    const mensaje: MensajeChat = {
      proyecto_id: this.proyectoSeleccionado.id,
      remitente_id: clienteId,
      remitente_tipo: 'cliente',
      contenido: this.nuevoMensaje.trim(),
      leido: false
    };
    
    this.enviandoMensaje = true;
    console.log('📤 Enviando mensaje:', mensaje);
    
    // Primero guardar en BD
    this.chatService.guardarMensaje(mensaje).subscribe({
      next: (mensajeGuardado) => {
        console.log('✅ Mensaje guardado en BD:', mensajeGuardado);
        
        // Luego enviar por WebSocket para tiempo real
        this.chatService.enviarMensajeWS(mensajeGuardado);
        
        this.nuevoMensaje = '';
        this.enviandoMensaje = false;
        
        // Mantener focus en el input
        setTimeout(() => {
          const input = document.querySelector('.message-input') as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error al enviar mensaje:', error);
        this.enviandoMensaje = false;
      }
    });
  }

  cerrarChat(): void {
    console.log('❌ Cerrando chat y desconectando WebSocket');
    this.chatService.desconectarChat();
    this.mostrarChat = false;
    this.proyectoSeleccionado = null;
    this.mensajes = [];
    
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
  }

  cerrarChatOverlay(event: MouseEvent): void {
    // Solo cerrar si se hace click directamente en el overlay (fondo negro)
    if ((event.target as HTMLElement).classList.contains('chat-overlay')) {
      this.cerrarChat();
    }
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

  private obtenerClienteId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      console.log('✅ Usuario obtenido del localStorage:', usuarioObj);
      return usuarioObj.id;
    }
    
    // TEMPORAL: Hardcodear para probar el chat
    console.warn('⚠️ localStorage vacío. Usando ID hardcodeado: 2');
    return 2; // Tu cliente William Alvarado
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
}