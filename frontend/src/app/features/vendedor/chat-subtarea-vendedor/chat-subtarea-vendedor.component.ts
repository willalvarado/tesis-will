import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { SubtareaService } from '../../../core/services/subtarea.service';
import { ChatService, Mensaje as MensajeChat } from '../../../core/services/chat.service';
import { Location } from '@angular/common'; 

interface MensajeUI {
  id: number;
  subtareaId: number;
  remitente: 'cliente' | 'vendedor';
  contenido: string;
  fecha: Date;
  leido: boolean;
}

interface Archivo {
  id: number;
  subtarea_id: number;
  subido_por_id: number;
  subido_por_tipo: 'cliente' | 'vendedor';
  nombre_original: string;
  tamano: number;
  tipo_mime: string;
  created_at: string;
}

@Component({
  selector: 'app-chat-subtarea-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-subtarea-vendedor.component.html',
  styleUrls: ['./chat-subtarea-vendedor.component.css']
})
export class ChatSubtareaVendedorComponent implements OnInit, OnDestroy {
  subtareaId: number = 0;
  subtarea: any = null;
  mensajes: MensajeUI[] = [];
  archivos: Archivo[] = [];
  nuevoMensaje: string = '';
  
  // Estados
  cargando = true;
  enviandoMensaje = false;
  subiendoArchivo = false;
  editandoPresupuesto = false;
  error = '';
  
  // Datos del vendedor
  vendedorId: number | null = null;
  
  // Edición de presupuesto
  presupuestoEdit: number = 0;
  
  private mensajesSubscription?: Subscription;
  private apiUrl = 'http://localhost:8000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private subtareaService: SubtareaService,
    private chatService: ChatService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.vendedorId = this.obtenerVendedorId();
    
    this.route.params.subscribe(params => {
      this.subtareaId = +params['id'];
      if (this.subtareaId) {
        this.cargarDatos();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
    this.chatService.desconectarChat();
  }

  cargarDatos(): void {
    this.cargando = true;
    
    // Cargar sub-tarea
    this.subtareaService.obtenerDetalleSubtarea(this.subtareaId).subscribe({
      next: (response) => {
        console.log('✅ Detalle de sub-tarea:', response);
        this.subtarea = response;
        this.presupuestoEdit = response.subtarea?.presupuesto || 0;
        this.cargando = false;
        
        // Conectar chat y cargar archivos
        this.conectarChat();
        this.cargarArchivos();
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
    
    this.chatService.conectarChatSubtarea(this.subtareaId);
    this.cargarMensajes();
    
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
    console.log('📚 Cargando mensajes...');
    
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
        console.error('❌ Error cargando mensajes:', error);
      }
    });
  }

  cargarArchivos(): void {
    console.log('📎 Cargando archivos...');
    
    this.http.get<Archivo[]>(`${this.apiUrl}/chat/subtarea/${this.subtareaId}/archivos`)
      .subscribe({
        next: (archivos) => {
          console.log('✅ Archivos cargados:', archivos);
          this.archivos = archivos;
        },
        error: (error) => {
          console.error('❌ Error cargando archivos:', error);
        }
      });
  }

  enviarMensaje(): void {
  console.log('🚀 Método enviarMensaje() ejecutado');
  console.log('📝 nuevoMensaje:', this.nuevoMensaje);
  console.log('👤 vendedorId:', this.vendedorId);
  
  if (!this.nuevoMensaje.trim()) {
    console.warn('⚠️ Mensaje vacío');
    alert('Por favor escribe un mensaje');
    return;
  }
  
  if (!this.vendedorId) {
    console.error('❌ No hay vendedorId');
    alert('Error: No se encontró el ID del vendedor. Por favor recarga la página.');
    return;
  }
  
  const mensaje: MensajeChat = {
    subtarea_id: this.subtareaId,
    remitente_id: this.vendedorId,
    remitente_tipo: 'vendedor',
    contenido: this.nuevoMensaje.trim(),
    leido: false
  };
  
  this.enviandoMensaje = true;
  console.log('📤 Enviando mensaje:', mensaje);
  
  this.chatService.guardarMensaje(mensaje).subscribe({
    next: (mensajeGuardado) => {
      console.log('✅ Mensaje guardado en BD:', mensajeGuardado);
      this.chatService.enviarMensajeWS(mensajeGuardado);
      this.nuevoMensaje = '';
      this.enviandoMensaje = false;
    },
    error: (error) => {
      console.error('❌ Error al enviar mensaje:', error);
      this.enviandoMensaje = false;
      alert('Error al enviar el mensaje');
    }
  });
}

  // 🔥 NUEVO: Subir archivo
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file || !this.vendedorId) return;
    
    this.subiendoArchivo = true;
    
    const formData = new FormData();
    formData.append('archivo', file);
    
    const url = `${this.apiUrl}/chat/subtarea/${this.subtareaId}/archivo?subido_por_id=${this.vendedorId}&subido_por_tipo=vendedor`;
    
    this.http.post<Archivo>(url, formData).subscribe({
      next: (archivo) => {
        console.log('✅ Archivo subido:', archivo);
        this.archivos.unshift(archivo);
        this.subiendoArchivo = false;
        alert('📎 Archivo subido exitosamente');
      },
      error: (error) => {
        console.error('❌ Error subiendo archivo:', error);
        this.subiendoArchivo = false;
        alert('Error al subir archivo');
      }
    });
  }

  // 🔥 NUEVO: Eliminar archivo (vendedor puede eliminar todos)
  eliminarArchivo(archivo: Archivo): void {
    if (!confirm(`¿Eliminar "${archivo.nombre_original}"?`)) return;
    
    const url = `${this.apiUrl}/chat/archivo/${archivo.id}?usuario_id=${this.vendedorId}&usuario_tipo=vendedor`;
    
    this.http.delete(url).subscribe({
      next: () => {
        console.log('✅ Archivo eliminado');
        this.archivos = this.archivos.filter(a => a.id !== archivo.id);
        alert('🗑️ Archivo eliminado');
      },
      error: (error) => {
        console.error('❌ Error eliminando archivo:', error);
        alert('Error al eliminar archivo');
      }
    });
  }

  // 🔥 NUEVO: Editar presupuesto
  toggleEditarPresupuesto(): void {
    this.editandoPresupuesto = !this.editandoPresupuesto;
    if (!this.editandoPresupuesto) {
      this.presupuestoEdit = this.subtarea.subtarea?.presupuesto || 0;
    }
  }

  guardarPresupuesto(): void {
  if (this.presupuestoEdit < 0) {
    alert('El presupuesto no puede ser negativo');
    return;
  }
  
  // 🔥 USAR ENDPOINT CORRECTO
  const url = `${this.apiUrl}/subtareas/${this.subtareaId}/actualizar-presupuesto`;
  const body = {
    presupuesto: this.presupuestoEdit
  };
  
  this.http.put(url, body).subscribe({
    next: () => {
      console.log('✅ Presupuesto actualizado');
      this.subtarea.subtarea.presupuesto = this.presupuestoEdit;
      this.editandoPresupuesto = false;
      alert('💰 Presupuesto actualizado exitosamente');
    },
    error: (error) => {
      console.error('❌ Error actualizando presupuesto:', error);
      alert('Error al actualizar presupuesto');
    }
  });
}

  descargarArchivo(archivo: Archivo): void {
    // Por ahora solo muestra alert, después implementamos descarga real
    alert(`📥 Descargando: ${archivo.nombre_original}`);
    console.log('Descargar archivo:', archivo);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

  private obtenerVendedorId(): number | null {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    const usuarioObj = JSON.parse(usuario);
    console.log('✅ Usuario vendedor obtenido:', usuarioObj);
    return usuarioObj.id;
  }
  
  console.warn('⚠️ localStorage vacío. Usando ID vendedor hardcodeado: 2');
  return 2;  // ✅ FALLBACK: ID del vendedor wire@gmail.com
}

  volver(): void {
  this.location.back();
}
irADashboard(): void {
  this.router.navigate(['/vendedor/bienvenida']);
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

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}