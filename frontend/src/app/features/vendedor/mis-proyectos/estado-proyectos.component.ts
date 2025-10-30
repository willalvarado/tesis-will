import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ProyectosService, ProyectoUpdate } from '../../../core/services/proyectos.service';

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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  proyectos: any[] = [];
  proyectoSeleccionado: any | null = null;
  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  mostrarChat: boolean = false;
  cargando: boolean = false;
  enviandoMensaje: boolean = false;
  
  mostrarModalEstado: boolean = false;
  nuevoEstado: string = '';
  motivoCambio: string = '';
  estadosDisponibles = [
    { valor: 'asignado', etiqueta: 'Asignado' },
    { valor: 'en_proceso', etiqueta: 'En Proceso' },
    { valor: 'pausado', etiqueta: 'Pausado' },
    { valor: 'completado', etiqueta: 'Completado' },
    { valor: 'cancelado', etiqueta: 'Cancelado' }
  ];

  isDragOver: boolean = false;
  archivoSubiendo: boolean = false;
  nombreArchivoSubiendo: string = '';
  progresoSubida: number = 0;
  
  private actualizacionSubscription?: Subscription;
  private proyectoActualParaArchivos: any = null;

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
    const vendedorId = this.obtenerVendedorId();
    
    if (!vendedorId) {
      console.error('No se encontró el ID del vendedor');
      this.cargando = false;
      return;
    }

    this.proyectosService.obtenerProyectosVendedor(vendedorId).subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos.map(proyecto => ({
          ...proyecto,
          nombre: proyecto.titulo,
          fechaInicio: new Date(proyecto.fecha_inicio),
          fechaEstimada: proyecto.fecha_estimada ? new Date(proyecto.fecha_estimada) : null,
          fechaCompletado: proyecto.fecha_completado ? new Date(proyecto.fecha_completado) : null,
          ultimaActividad: new Date(proyecto.updated_at),
          archivos: proyecto.archivos || []
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
    this.mensajes = [];
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.proyectoSeleccionado) return;
    this.enviandoMensaje = true;
    
    const mensaje: Mensaje = {
      id: Date.now(), 
      proyectoId: this.proyectoSeleccionado.id, 
      remitente: 'vendedor',
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

  actualizarProgreso(proyecto: any, event: any): void {
    const nuevoProgreso = parseInt(event.target.value);
    const datos: ProyectoUpdate = { progreso: nuevoProgreso };
    
    this.proyectosService.actualizarProyecto(proyecto.id, datos).subscribe({
      next: (proyectoActualizado) => {
        proyecto.progreso = proyectoActualizado.progreso;
      },
      error: (error) => console.error('Error al actualizar progreso:', error)
    });
  }

  actualizarPagado(proyecto: any, event: any): void {
    const nuevoPagado = parseFloat(event.target.value);
    if (nuevoPagado < 0) return;

    const datos: ProyectoUpdate = { pagado: nuevoPagado };
    
    this.proyectosService.actualizarProyecto(proyecto.id, datos).subscribe({
      next: (proyectoActualizado) => {
        proyecto.pagado = proyectoActualizado.pagado;
      },
      error: (error) => console.error('Error al actualizar pagado:', error)
    });
  }

  actualizarFechaEntrega(proyecto: any, event: any): void {
    const nuevaFecha = event.target.value;
    if (!nuevaFecha) return;

    const datos: ProyectoUpdate = { fecha_estimada: nuevaFecha };
    
    this.proyectosService.actualizarProyecto(proyecto.id, datos).subscribe({
      next: (proyectoActualizado) => {
        proyecto.fechaEstimada = new Date(proyectoActualizado.fecha_estimada!);
      },
      error: (error) => console.error('Error al actualizar fecha:', error)
    });
  }

  abrirModalEstado(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.nuevoEstado = proyecto.estado;
    this.motivoCambio = '';
    this.mostrarModalEstado = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
    this.proyectoSeleccionado = null;
    this.nuevoEstado = '';
    this.motivoCambio = '';
  }

  cambiarEstadoProyecto(): void {
    if (!this.proyectoSeleccionado || !this.nuevoEstado) return;

    const datos: ProyectoUpdate = { estado: this.nuevoEstado };
    
    this.proyectosService.actualizarProyecto(this.proyectoSeleccionado.id, datos).subscribe({
      next: (proyectoActualizado) => {
        this.proyectoSeleccionado.estado = proyectoActualizado.estado;
        if (proyectoActualizado.fecha_completado) {
          this.proyectoSeleccionado.fechaCompletado = new Date(proyectoActualizado.fecha_completado);
        }
        this.cerrarModalEstado();
        alert('Estado actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado');
      }
    });
  }

  abrirSelectorArchivos(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any, proyecto: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.subirArchivos(files, proyecto);
    }
  }

  onDragOver(event: DragEvent, proyecto: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    this.proyectoActualParaArchivos = proyecto;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent, proyecto: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.subirArchivos(files, proyecto);
    }
  }

  subirArchivos(files: FileList, proyecto: any): void {
    this.archivoSubiendo = true;
    this.nombreArchivoSubiendo = files[0].name;
    this.progresoSubida = 0;

    const interval = setInterval(() => {
      this.progresoSubida += 10;
      if (this.progresoSubida >= 100) {
        clearInterval(interval);
        
        Array.from(files).forEach(file => {
          proyecto.archivos.push({
            nombre: file.name,
            fechaSubida: new Date(),
            tamaño: this.formatearTamaño(file.size)
          });
        });
        
        this.archivoSubiendo = false;
        this.nombreArchivoSubiendo = '';
        this.progresoSubida = 0;
      }
    }, 200);
  }

  eliminarArchivo(proyecto: any, index: number): void {
    if (confirm('¿Estás seguro de eliminar este archivo?')) {
      proyecto.archivos.splice(index, 1);
    }
  }

  descargarArchivo(nombreArchivo: string): void {
    console.log('Descargando archivo:', nombreArchivo);
    alert(`Descargando: ${nombreArchivo}`);
  }

  private formatearTamaño(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private iniciarActualizacionAutomatica(): void {
    this.actualizacionSubscription = interval(30000).subscribe(() => {
      this.cargarProyectos();
    });
  }

  private obtenerVendedorId(): number | null {
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

  formatearFecha(fecha: Date | null): string {
    if (!fecha) return 'No definida';
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

  obtenerIconoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    const iconos: { [key: string]: string } = {
      pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
      fig: '🎨', psd: '🎨', zip: '📦', rar: '📦', txt: '📃',
      mp4: '🎥', avi: '🎥', mp3: '🎵', wav: '🎵'
    };
    return iconos[extension || ''] || '📄';
  }
}