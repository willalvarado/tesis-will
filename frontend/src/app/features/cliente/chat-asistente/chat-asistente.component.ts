import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequerimientosService } from '../../../core/services/requerimientos.service';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat-asistente.component.html',
  styleUrls: ['./chat-asistente.component.css']
})
export class ChatAsistenteComponent {
  requerimientoForm: FormGroup;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  mensajeUsuario = '';

  constructor(
    private fb: FormBuilder,
    private requerimientosService: RequerimientosService,
    private router: Router
  ) {
    this.requerimientoForm = this.fb.group({
      mensaje: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  usarSugerencia(sugerencia: string): void {
    this.requerimientoForm.get('mensaje')?.setValue(sugerencia);
    // Auto focus en el textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(sugerencia.length, sugerencia.length);
      }
    }, 100);
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.requerimientoForm.valid && !this.enviando) {
        this.crearRequerimiento();
      }
    }
  }

  crearRequerimiento(): void {
    if (this.requerimientoForm.invalid) return;

    this.enviando = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mensajeUsuario = this.requerimientoForm.get('mensaje')?.value;

    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
      this.mensajeError = 'No se encontró información del usuario';
      this.enviando = false;
      return;
    }

    const clienteId = JSON.parse(usuario).id;
    const mensaje = this.requerimientoForm.get('mensaje')?.value;

    // Scroll to bottom
    this.scrollToBottom();

    this.requerimientosService.crearRequerimiento(clienteId, mensaje).subscribe({
      next: (requerimiento) => {
        console.log('Requerimiento creado:', requerimiento);
        this.mensajeExito = '¡Requerimiento creado exitosamente!';
        this.requerimientoForm.reset();
        this.enviando = false;

        // Scroll to bottom
        this.scrollToBottom();

        // Redirigir a la lista después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/cliente/requerimientos']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error al crear requerimiento:', error);
        this.mensajeError = 'Error al crear el requerimiento. Por favor, intenta nuevamente.';
        this.enviando = false;

        // Scroll to bottom
        this.scrollToBottom();
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

  cancelar(): void {
    this.router.navigate(['/cliente/requerimientos']);
  }
}