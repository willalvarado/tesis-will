import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequerimientosService } from '../../../core/services/requerimientos.service';
import { OpenAIService, Mensaje } from '../../../core/services/openai.service';
import { HttpClient } from '@angular/common/http';

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
  conversacionFinalizada = false;
  requerimientoGenerado: any = null;

 constructor(
  private openAIService: OpenAIService,
  private requerimientosService: RequerimientosService,
  private router: Router,
  private http: HttpClient  // 🔥 AGREGAR
) {}

  ngOnInit(): void {
    // Mensaje de bienvenida inicial
    this.agregarMensajeAsistente(
      '¡Hola! 👋 Soy tu asistente virtual de Conecta Solutions.\n\n' +
      'Estoy aquí para ayudarte a definir tu proyecto. Puedes contarme sobre tu idea y te guiaré paso a paso.\n\n' +
      '💡 También puedes usar estas sugerencias:'
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
    if (!this.mensajeUsuario.trim() || this.enviando || this.conversacionFinalizada) {
      return;
    }

    const mensaje = this.mensajeUsuario.trim();
    this.mensajeUsuario = '';

    // Agregar mensaje del usuario
    this.agregarMensajeUsuario(mensaje);

    // Mostrar loader
    this.enviando = true;
    this.agregarMensajeAsistente('', true);

    // Preparar historial para enviar a OpenAI
    const historial: Mensaje[] = this.mensajes
      .filter(m => !m.mostrarLoader)
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    // Llamar a OpenAI
    this.openAIService.chatRequerimiento(historial).subscribe({
      next: (response) => {
        // Quitar loader
        this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);

        if (response.exito) {
          // Agregar respuesta del asistente
          this.agregarMensajeAsistente(response.respuesta);

          // Si la conversación terminó
          if (response.finalizado && response.requerimiento) {
            this.conversacionFinalizada = true;
            this.requerimientoGenerado = response.requerimiento;
            
            // Crear el requerimiento en la base de datos
            this.crearRequerimientoFinal();
          }
        } else {
          this.agregarMensajeAsistente(
            '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.'
          );
        }

        this.enviando = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error en chat:', error);
        
        // Quitar loader
        this.mensajes = this.mensajes.filter(m => !m.mostrarLoader);
        
        this.agregarMensajeAsistente(
          '❌ Error de conexión. Por favor, verifica tu conexión e intenta nuevamente.'
        );
        
        this.enviando = false;
        this.scrollToBottom();
      }
    });
  }

private crearRequerimientoFinal(): void {
  const usuario = localStorage.getItem('usuario');
  if (!usuario) {
    this.agregarMensajeAsistente('❌ Error: No se encontró información del usuario.');
    return;
  }

  const clienteId = JSON.parse(usuario).id;

  this.agregarMensajeAsistente(
    '✨ Perfecto! Estoy creando tu requerimiento en el sistema...'
  );

  // PASO 1: Crear requerimiento básico
  this.requerimientosService.crearRequerimiento(
    clienteId, 
    this.requerimientoGenerado.mensaje
  ).subscribe({
    next: (requerimiento) => {
      console.log('Requerimiento creado:', requerimiento);
      
      // PASO 2: Actualizar con datos de OpenAI
      this.http.put('http://localhost:8000/requerimientos/actualizar-con-ia', {
        requerimiento_id: requerimiento.id,
        titulo: this.requerimientoGenerado.titulo,
        descripcion: this.requerimientoGenerado.descripcion,
        especialidad_codigo: this.requerimientoGenerado.especialidad,
        presupuesto: this.requerimientoGenerado.presupuesto
      }).subscribe({
        next: () => {
          this.agregarMensajeAsistente(
            '✅ ¡Excelente! Tu requerimiento ha sido creado exitosamente.\n\n' +
            `📋 **${this.requerimientoGenerado.titulo}**\n\n` +
            `💰 Presupuesto: $${this.requerimientoGenerado.presupuesto}\n\n` +
            'Te notificaremos cuando un vendedor especializado acepte tu proyecto.\n\n' +
            '🔄 Redirigiendo a tus requerimientos en 3 segundos...'
          );

          setTimeout(() => {
            this.router.navigate(['/cliente/requerimientos']);
          }, 3000);
        },
        error: (error) => {
          console.error('Error al actualizar con IA:', error);
          // Continuar de todos modos
          setTimeout(() => {
            this.router.navigate(['/cliente/requerimientos']);
          }, 2000);
        }
      });
    },
    error: (error) => {
      console.error('Error al crear requerimiento:', error);
      this.agregarMensajeAsistente(
        '❌ Hubo un error al guardar tu requerimiento. Por favor, intenta nuevamente.'
      );
    }
  });
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
}