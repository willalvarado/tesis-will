import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SubtareaService, SubTarea } from '../../../core/services/subtarea.service';
import { ChatService, Mensaje as MensajeChat } from '../../../core/services/chat.service';


interface MensajeUI {
  id: number;
  subtareaId: number;
  remitente: 'cliente' | 'vendedor';
  contenido: string;
  fecha: Date;
  leido: boolean;
}

@Component({
  selector: 'app-chat-subtarea',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-subtarea.component.html',
  styleUrls: ['./chat-subtarea.component.css']
})
export class ChatSubtareaComponent implements OnInit, OnDestroy {
  subtareaId: number = 0;
  subtarea: any = null;
  mensajes: MensajeUI[] = [];
  nuevoMensaje: string = '';
  cargando = true;
  enviandoMensaje = false;
  error = '';

  private mensajesSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subtareaService: SubtareaService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.subtareaId = +params['id'];
      if (this.subtareaId) {
        this.cargarSubtarea();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
    this.chatService.desconectarChat();
  }

  cargarSubtarea(): void {
    this.cargando = true;
    this.subtareaService.obtenerDetalleSubtarea(this.subtareaId).subscribe({
      next: (response) => {
        console.log('✅ Detalle de sub-tarea:', response);
        this.subtarea = response;
        this.cargando = false;
        
        // Conectar al chat de la sub-tarea
        this.conectarChat();
      },
      error: (error) => {
        console.error('❌ Error cargando sub-tarea:', error);
        this.error = 'Error al cargar la sub-tarea';
        this.cargando = false;
      }
    });
  }

  conectarChat(): void {
    console.log('🔌 Conectando al chat de la sub-tarea:', this.subtareaId);
    
    // Conectar WebSocket
    this.chatService.conectarChatSubtarea(this.subtareaId);
    
    // Cargar historial
    this.cargarMensajes();
    
    // Escuchar nuevos mensajes
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
    
    this.mensajesSubscription = this.chatService.mensajes$.subscribe(mensaje => {
      console.log('📩 Nuevo mensaje recibido:', mensaje);
      
      const existe = this.mensajes.find(m => m.id === mensaje.id);
      if (!existe) {
        this.mensajes.push({
          id: mensaje.id || Date.now(),
          subtareaId: mensaje.subtarea_id || this.subtareaId,
          remitente: mensaje.remitente_tipo,
          contenido: mensaje.contenido,
          fecha: mensaje.created_at ? new Date(mensaje.created_at) : new Date(),
          leido: mensaje.leido
        });
        this.scrollToBottom();
      }
    });
  }

  cargarMensajes(): void {
    console.log('📚 Cargando mensajes de la sub-tarea:', this.subtareaId);
    
    this.chatService.obtenerMensajesSubtarea(this.subtareaId).subscribe({
      next: (mensajes) => {
        console.log('✅ Mensajes cargados:', mensajes);
        this.mensajes = mensajes.map(m => ({
          id: m.id || 0,
          subtareaId: m.subtarea_id || this.subtareaId,
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
    console.log('🚀 Método enviarMensaje() ejecutado');
    console.log('📝 nuevoMensaje:', this.nuevoMensaje);
    
    if (!this.nuevoMensaje.trim()) {
      console.warn('⚠️ Mensaje vacío');
      return;
    }
    
    const clienteId = this.obtenerClienteId();
    console.log('👤 clienteId:', clienteId);
    
    if (!clienteId) {
      console.error('❌ No hay clienteId');
      alert('Error: No se encontró el ID del cliente');
      return;
    }
    
    const mensaje: MensajeChat = {
      subtarea_id: this.subtareaId,
      remitente_id: clienteId,
      remitente_tipo: 'cliente',
      contenido: this.nuevoMensaje.trim(),
      leido: false
    };
    
    this.enviandoMensaje = true;
    console.log('📤 Enviando mensaje:', mensaje);
    
    this.chatService.guardarMensaje(mensaje).subscribe({
      next: (mensajeGuardado) => {
        console.log('✅ Mensaje guardado:', mensajeGuardado);
        this.chatService.enviarMensajeWS(mensajeGuardado);
        this.nuevoMensaje = '';
        this.enviandoMensaje = false;
        
        setTimeout(() => {
          const input = document.querySelector('.message-input') as HTMLInputElement;
          if (input) input.focus();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error al enviar mensaje:', error);
        this.enviandoMensaje = false;
        alert('Error al enviar el mensaje');
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

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

  volver(): void {
    this.router.navigate(['/cliente/requerimientos']);
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': '#9ca3af',
      'ASIGNADA': '#3b82f6',
      'EN_PROGRESO': '#f59e0b',
      'COMPLETADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  }

  getEstadoIcon(estado: string): string {
    const iconos: { [key: string]: string } = {
      'PENDIENTE': '⏳',
      'ASIGNADA': '👤',
      'EN_PROGRESO': '⚙️',
      'COMPLETADO': '✅',
      'CANCELADO': '❌'
    };
    return iconos[estado] || '📋';
  }

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': '#dc2626',
      'MEDIA': '#f59e0b',
      'BAJA': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  }

  formatearFecha(fecha: string | Date | null): string {
    if (!fecha) return 'No definida';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}