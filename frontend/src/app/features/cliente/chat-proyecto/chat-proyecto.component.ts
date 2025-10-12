import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Mensaje as MensajeChat } from '../../../core/services/chat.service';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { ArchivosService, Archivo } from '../../../core/services/archivos.service';

interface MensajeUI {
  id: number;
  proyectoId: number;
  remitente: 'cliente' | 'vendedor';
  contenido: string;
  fecha: Date;
  leido: boolean;
}

@Component({
  selector: 'app-chat-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-proyecto.component.html',
  styleUrls: ['./chat-proyecto.component.css']
})
export class ChatProyectoComponent implements OnInit, OnDestroy {
  proyectoId: number = 0;
  proyecto: any = null;
  mensajes: MensajeUI[] = [];
  nuevoMensaje: string = '';
  enviandoMensaje: boolean = false;
  cargando: boolean = true;
  
  // Archivos
  archivos: Archivo[] = [];
  subiendoArchivo: boolean = false;
  
  private mensajesSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private proyectosService: ProyectosService,
    private archivosService: ArchivosService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.proyectoId = +params['id'];
      console.log('📋 Proyecto ID:', this.proyectoId);
      
      this.cargarProyecto();
      this.conectarChat();
      this.cargarArchivos();
    });
  }

  ngOnDestroy(): void {
    this.chatService.desconectarChat();
    if (this.mensajesSubscription) {
      this.mensajesSubscription.unsubscribe();
    }
  }

  cargarProyecto(): void {
    const clienteId = this.obtenerClienteId();
    if (!clienteId) return;

    this.proyectosService.obtenerProyectosCliente(clienteId).subscribe({
      next: (proyectos) => {
        this.proyecto = proyectos.find(p => p.id === this.proyectoId);
        if (this.proyecto) {
          console.log('✅ Proyecto cargado:', this.proyecto);
        } else {
          console.error('❌ Proyecto no encontrado');
          this.router.navigate(['/cliente/estado-proyectos']);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar proyecto:', error);
        this.cargando = false;
      }
    });
  }

  conectarChat(): void {
    console.log('🔌 Conectando al WebSocket del proyecto:', this.proyectoId);
    
    this.chatService.conectarChat(this.proyectoId);
    this.cargarMensajes();
    
    this.mensajesSubscription = this.chatService.mensajes$.subscribe(mensaje => {
      console.log('📩 Mensaje recibido en tiempo real:', mensaje);
      
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
  }

  cargarMensajes(): void {
    console.log('📚 Cargando historial de mensajes...');
    
    this.chatService.obtenerMensajes(this.proyectoId).subscribe({
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
    if (!this.nuevoMensaje.trim()) return;
    
    const clienteId = this.obtenerClienteId();
    if (!clienteId) {
      console.error('❌ No se pudo obtener el ID del cliente');
      return;
    }
    
    const mensaje: MensajeChat = {
      proyecto_id: this.proyectoId,
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
      },
      error: (error) => {
        console.error('❌ Error al enviar mensaje:', error);
        this.enviandoMensaje = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/cliente/estado-proyectos']);
  }

  // === MÉTODOS DE ARCHIVOS ===

  cargarArchivos(): void {
    this.archivosService.listarArchivos(this.proyectoId).subscribe({
      next: (archivos) => {
        this.archivos = archivos;
        console.log('✅ Archivos cargados:', archivos);
      },
      error: (error) => {
        console.error('❌ Error al cargar archivos:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => this.subirArchivo(file));
    }
  }

  subirArchivo(file: File): void {
    const clienteId = this.obtenerClienteId();
    if (!clienteId) return;

    this.subiendoArchivo = true;
    console.log('📤 Subiendo archivo:', file.name);

    this.archivosService.subirArchivo(
      this.proyectoId,
      file,
      'cliente',
      clienteId
    ).subscribe({
      next: (archivo) => {
        console.log('✅ Archivo subido:', archivo);
        this.archivos.push(archivo);
        this.subiendoArchivo = false;
      },
      error: (error) => {
        console.error('❌ Error al subir archivo:', error);
        this.subiendoArchivo = false;
        alert('Error al subir el archivo');
      }
    });
  }

  descargarArchivo(archivoId: number): void {
    this.archivosService.descargarArchivo(archivoId);
  }

  eliminarArchivo(archivoId: number): void {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    this.archivosService.eliminarArchivo(archivoId).subscribe({
      next: () => {
        console.log('✅ Archivo eliminado');
        this.archivos = this.archivos.filter(a => a.id !== archivoId);
      },
      error: (error) => {
        console.error('❌ Error al eliminar archivo:', error);
        alert('Error al eliminar el archivo');
      }
    });
  }

  abrirSelectorArchivos(): void {
    document.getElementById('fileInput')?.click();
  }

  formatearTamanio(bytes: number): string {
    return this.archivosService.formatearTamanio(bytes);
  }

  obtenerIconoArchivo(nombreArchivo: string): string {
    return this.archivosService.obtenerIcono(nombreArchivo);
  }

  formatearFechaArchivo(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.mensajes-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  private obtenerClienteId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      return JSON.parse(usuario).id;
    }
    console.warn('⚠️ localStorage vacío. Usando ID hardcodeado: 2');
    return 2;
  }

  formatearHora(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  }

  formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(fecha);
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
}