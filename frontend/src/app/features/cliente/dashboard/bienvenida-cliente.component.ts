import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router'; 


@Component({
  selector: 'app-bienvenida-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './bienvenida-cliente.component.html',
  styleUrls: ['./bienvenida-cliente.component.css']
})
export class BienvenidaClienteComponent {
  nuevoMensaje = '';
  mensajes: { rol: 'user' | 'bot', contenido: string }[] = [];
  userName = localStorage.getItem('userName') || 'Usuario';
  showHelp = false;
  enviando = false;
  
  // Nueva propiedad para controlar secciones
  activeSection = 'chat';

  constructor(private http: HttpClient, private router: Router) {}

  // Método para cambiar secciones
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  // Método para obtener iniciales del usuario
  getInitials(): string {
    return this.userName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Método para obtener hora actual
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // TrackBy para optimizar el ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Toggle para notificaciones
  toggleNotificaciones(): void {
    alert('🔔 Tienes 2 nuevas notificaciones:\n\n• Tu requerimiento "App Móvil" tiene una propuesta\n• Nuevo mensaje del vendedor Juan Pérez');
  }

  toggleHelp() { 
    this.showHelp = !this.showHelp; 
  }

  logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      this.router.navigate(['/login']);
    }
  }

  enviarMensaje() {
    const mensaje = this.nuevoMensaje?.trim();
    if (!mensaje || this.enviando) return;

    // Pinta mensaje en el chat
    this.mensajes.push({ rol: 'user', contenido: mensaje });
    this.nuevoMensaje = '';
    this.enviando = true;
    this.autoScroll();

    // Simula respuesta del bot (puedes cambiar por tu API real)
    setTimeout(() => {
      const respuestas = [
        '¡Perfecto! Entiendo que necesitas ' + mensaje.toLowerCase() + '. Te voy a conectar con vendedores especializados.',
        'Excelente requerimiento. ¿Podrías decirme qué presupuesto tienes en mente y cuándo necesitas tenerlo listo?',
        'Muy interesante. He encontrado 3 vendedores que pueden ayudarte con este tipo de proyecto. ¿Te gustaría ver sus perfiles?',
        'Genial, ya registré tu requerimiento. Los vendedores especializados podrán ver tu solicitud y enviarte propuestas.'
      ];
      
      const respuestaAleatoria = respuestas[Math.floor(Math.random() * respuestas.length)];
      this.mensajes.push({ rol: 'bot', contenido: respuestaAleatoria });
      this.enviando = false;
      this.autoScroll();
    }, 1500);

    // Envía al backend (descomenta cuando tengas la API)
    /*
    this.http.post<{ idRequerimiento?: number; respuesta: string }>('http://localhost:8000/api/chat', { mensaje })
      .subscribe({
        next: (resp) => {
          this.mensajes.push({ rol: 'bot', contenido: resp?.respuesta ?? '...' });
          this.enviando = false;
          this.autoScroll();
        },
        error: () => {
          this.mensajes.push({ rol: 'bot', contenido: 'Ocurrió un error al comunicarse con el asistente.' });
          this.enviando = false;
          this.autoScroll();
        }
      });
    */
  }

  private autoScroll() {
    setTimeout(() => {
      const box = document.querySelector('.chat-mensajes') as HTMLElement | null;
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
  }
}