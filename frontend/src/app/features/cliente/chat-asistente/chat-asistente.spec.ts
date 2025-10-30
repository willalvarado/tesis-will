
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  mensajes: { de: 'cliente' | 'bot', texto: string }[] = [];
  mensaje: string = '';
  cargando: boolean = false;

  constructor(private http: HttpClient) {}

  enviarMensaje() {
    if (!this.mensaje.trim()) return;

    const texto = this.mensaje.trim();
    this.mensajes.push({ de: 'cliente', texto });
    this.mensaje = '';
    this.cargando = true;

    this.http.post<any>('http://localhost:8000/chat', { mensaje: texto }).subscribe({
      next: (res) => {
        this.mensajes.push({ de: 'bot', texto: res.respuesta });
        this.cargando = false;
      },
      error: () => {
        this.mensajes.push({ de: 'bot', texto: 'Ocurrió un error al responder.' });
        this.cargando = false;
      }
    });
  }
}
