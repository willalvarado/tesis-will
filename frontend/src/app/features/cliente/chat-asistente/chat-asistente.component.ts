import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatAnalisisService, ProyectoAnalizado } from '../../../core/services/chat-analisis.service';

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
  mostrarLoader?: boolean;
}

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-asistente.component.html',
  styleUrls: ['./chat-asistente.component.css']
})
export class ChatAsistenteComponent implements OnInit {
  @ViewChild('chatMessages') chatMessages!: ElementRef;

  mensajes: MensajeChat[] = [];
  mensajeUsuario = '';
  enviando = false;
  analisisCompletado = false;
  proyectoId: number | null = null;
  proyectoAnalizado: ProyectoAnalizado | null = null;
  mostrarResumen = false;

  constructor(
    private chatAnalisisService: ChatAnalisisService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Mensaje de bienvenida mejorado
    this.agregarMensajeAsistente(
      '¡Hola! 👋 Soy tu **Analista de Proyectos con IA** de Conecta Solutions.\n\n' +
      'Voy a ayudarte a definir tu proyecto de forma **completa y detallada**. No hay límite de preguntas, así que tómate el tiempo necesario.\n\n' +
      '✨ Al final, generaré automáticamente:\n' +
      '• Historia de usuario profesional\n' +
      '• Sub-tareas técnicas específicas\n' +
      '• Estimaciones de tiempo y presupuesto\n' +
      '• Criterios de aceptación\n\n' +
      '💡 Puedes empezar contándome sobre tu proyecto o usar estas sugerencias:'
    );
  }

  usarSugerencia(sugerencia: string): void {
    this.mensajeUsuario = sugerencia;
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.mensajeUsuario.trim() && !this.enviando) {
        this.enviarMensaje();
      }
    }
  }

  enviarMensaje(): void {
    if (!this.mensajeUsuario.trim() || this.enviando || this.analisisCompletado) {
      return;
    }

    const mensaje = this.mensajeUsuario.trim();
    this.mensajeUsuario = '';

    // Agregar mensaje del usuario
    this.agregarMensajeUsuario(mensaje);

    // Mostrar loader
    this.enviando = true;
    this.agregarMensajeAsistente('', true);

    // Determinar si es el primer mensaje o continuación
    if (!this.proyectoId) {
      // Primer mensaje - Iniciar análisis
      this.iniciarAnalisis(mensaje);
    } else {
      // Continuación del análisis
      this.continuarAnalisis(mensaje);
    }
  }

  private iniciarAnalisis(mensaje: string): void {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
      this.mostrarError('Error: No se encontró información del usuario.');
      return;
    }

    const clienteId = JSON.parse(usuario).id;

    this.chatAnalisisService.iniciarAnalisis({
      cliente_id: clienteId,
      mensaje_inicial: mensaje
    }).subscribe({
      next: (response) => {
        // Quitar loader
        this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);

        if (response.exito) {
          this.proyectoId = response.proyecto_id;
          this.agregarMensajeAsistente(response.respuesta_ia);
          console.log(`✅ Proyecto ${this.proyectoId} iniciado - ${response.tokens_usados} tokens`);
        } else {
          this.mostrarError('Error al iniciar el análisis. Intenta nuevamente.');
        }

        this.enviando = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error iniciando análisis:', error);
        this.mostrarError('Error de conexión. Verifica tu conexión e intenta nuevamente.');
      }
    });
  }

  private continuarAnalisis(mensaje: string): void {
    if (!this.proyectoId) return;

    this.chatAnalisisService.continuarAnalisis({
      proyecto_id: this.proyectoId,
      mensaje: mensaje
    }).subscribe({
      next: (response) => {
        // Quitar loader
        this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);

        if (response.exito) {
          this.agregarMensajeAsistente(response.respuesta_ia);

          // Si el análisis finalizó
          if (response.finalizado && response.proyecto) {
            this.analisisCompletado = true;
            this.proyectoAnalizado = response.proyecto;
            this.mostrarResumenProyecto();
            console.log(`🎉 Análisis completado - ${response.proyecto.subtareas.length} sub-tareas generadas`);
          }

          console.log(`💬 Respuesta - ${response.tokens_usados} tokens`);
        } else {
          this.mostrarError('Error al procesar tu mensaje. Intenta nuevamente.');
        }

        this.enviando = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error continuando análisis:', error);
        this.mostrarError('Error de conexión. Verifica tu conexión e intenta nuevamente.');
      }
    });
  }

  private mostrarResumenProyecto(): void {
    if (!this.proyectoAnalizado) return;

    const proyecto = this.proyectoAnalizado;
    
    let resumen = '\n\n---\n\n';
    resumen += '## 📋 Resumen del Proyecto\n\n';
    resumen += `**${proyecto.titulo}**\n\n`;
    resumen += `💰 **Presupuesto:** $${proyecto.presupuesto_estimado.toLocaleString()}\n`;
    resumen += `⏱️ **Tiempo estimado:** ${proyecto.tiempo_estimado_dias} días\n`;
    resumen += `🎯 **Sub-tareas:** ${proyecto.subtareas.length}\n\n`;
    
    resumen += '### 📝 Historia de Usuario\n';
    resumen += `${proyecto.historia_usuario}\n\n`;
    
    resumen += '### ✅ Criterios de Aceptación\n';
    proyecto.criterios_aceptacion.forEach((criterio, i) => {
      resumen += `${i + 1}. ${criterio}\n`;
    });
    
    resumen += '\n### 🔧 Sub-tareas Generadas\n';
    proyecto.subtareas.forEach((tarea) => {
      const prioridad = tarea.prioridad === 'ALTA' ? '🔴' : 
                       tarea.prioridad === 'MEDIA' ? '🟡' : '🟢';
      resumen += `\n**${tarea.codigo}** ${prioridad} - ${tarea.titulo}\n`;
      resumen += `└─ ${tarea.estimacion_horas}h · ${this.getNombreEspecialidad(tarea.especialidad)}\n`;
    });

    this.agregarMensajeAsistente(resumen);
    this.mostrarResumen = true;
  }

publicarProyecto(): void {
  if (!this.proyectoId || !this.proyectoAnalizado) {
    return;
  }

  this.enviando = true;
  this.agregarMensajeAsistente('📢 Publicando tu proyecto...', true);

  this.chatAnalisisService.publicarProyecto({
    proyecto_id: this.proyectoId
  }).subscribe({
    next: (response) => {
      this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);

      if (response.exito) {
        this.agregarMensajeAsistente(
          `✅ ¡Proyecto publicado exitosamente!\n\n` +
          `📊 ${response.subtareas_publicadas} sub-tareas disponibles.\n\n` +
          `Puedes ver el detalle en "Mis Proyectos".\n\n` +
          `🔄 Redirigiendo...`
        );

        setTimeout(() => {
          // Redirigir a "Mis Proyectos" donde ya puede ver el proyecto
          this.router.navigate(['/cliente/estado-proyectos']);
        }, 2000);
      }

      this.enviando = false;
    },
    error: (error) => {
      console.error('Error publicando proyecto:', error);
      this.mostrarError('Error al publicar el proyecto.');
    }
  });
}
  // Método para formatear mensaje con HTML básico
  formatearMensaje(contenido: string): string {
    return contenido
      .split('\n')
      .map(linea => {
        // Headers H2
        if (linea.startsWith('## ')) {
          return `<h2 class="titulo-h2">${linea.replace('## ', '')}</h2>`;
        }
        // Headers H3
        if (linea.startsWith('### ')) {
          return `<h3 class="titulo-h3">${linea.replace('### ', '')}</h3>`;
        }
        // Negritas
        const negritaRegex = /\*\*(.*?)\*\*/g;
        if (negritaRegex.test(linea)) {
          linea = linea.replace(negritaRegex, '<strong class="negrita">$1</strong>');
        }
        // Bullets
        if (linea.startsWith('• ')) {
          return `<div class="bullet">${linea}</div>`;
        }
        // Sub-bullets
        if (linea.startsWith('└─')) {
          return `<div class="sub-bullet">${linea}</div>`;
        }
        // Separador
        if (linea === '---') {
          return '<hr class="separador">';
        }
        // Línea normal
        return linea ? `<p>${linea}</p>` : '<br>';
      })
      .join('');
  }

  private getNombreEspecialidad(codigo: string): string {
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

  private agregarMensajeUsuario(contenido: string): void {
    this.mensajes.push({
      role: 'user',
      content: contenido
    });
    this.scrollToBottom();
  }

  private agregarMensajeAsistente(contenido: string, mostrarLoader: boolean = false): void {
    this.mensajes.push({
      role: 'assistant',
      content: contenido,
      mostrarLoader: mostrarLoader
    });
    this.scrollToBottom();
  }

  private mostrarError(mensaje: string): void {
    this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);
    this.agregarMensajeAsistente(`❌ ${mensaje}`);
    this.enviando = false;
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessages) {
        const element = this.chatMessages.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  cancelar(): void {
    this.router.navigate(['/cliente/requerimientos']);
  }
  irARequerimientos(): void {
  this.router.navigate(['/cliente/requerimientos']);
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