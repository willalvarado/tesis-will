import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface Mensaje {
  id?: number;
  proyecto_id: number;
  remitente_id: number;
  remitente_tipo: 'cliente' | 'vendedor';
  contenido: string;
  leido: boolean;
  created_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8000/chat';
  private ws: WebSocket | null = null;
  
  // Observable para recibir mensajes en tiempo real
  private mensajesSubject = new Subject<Mensaje>();
  public mensajes$ = this.mensajesSubject.asObservable();

  // Observable para estado de conexión
  private conexionSubject = new Subject<boolean>();
  public conexion$ = this.conexionSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Conectar al WebSocket de un proyecto específico
   */
  conectarChat(proyectoId: number): void {
    // Cerrar conexión anterior si existe
    if (this.ws) {
      this.ws.close();
    }

    // Crear nueva conexión WebSocket
    this.ws = new WebSocket(`ws://localhost:8000/chat/ws/${proyectoId}`);

    this.ws.onopen = () => {
      console.log('✅ Conectado al chat del proyecto', proyectoId);
      this.conexionSubject.next(true);
    };

    this.ws.onmessage = (event) => {
      const mensaje: Mensaje = JSON.parse(event.data);
      console.log('📩 Mensaje recibido:', mensaje);
      this.mensajesSubject.next(mensaje);
    };

    this.ws.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      this.conexionSubject.next(false);
    };

    this.ws.onclose = () => {
      console.log('❌ Desconectado del chat');
      this.conexionSubject.next(false);
    };
  }

  /**
   * Enviar mensaje por WebSocket (tiempo real)
   */
  enviarMensajeWS(mensaje: Mensaje): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(mensaje));
      console.log('📤 Mensaje enviado por WebSocket:', mensaje);
    } else {
      console.error('❌ WebSocket no está conectado');
    }
  }

  /**
   * Desconectar del chat
   */
  desconectarChat(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Obtener historial de mensajes de un proyecto (HTTP)
   */
  obtenerMensajes(proyectoId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/${proyectoId}`);
  }

  /**
   * Guardar mensaje en la base de datos (HTTP)
   */
  guardarMensaje(mensaje: Mensaje): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.baseUrl}/mensajes`, mensaje);
  }

  /**
   * Marcar mensajes como leídos
   */
  marcarMensajesLeidos(proyectoId: number, remitenteId: number, remitenteTipo: 'cliente' | 'vendedor'): Observable<any> {
    return this.http.put(`${this.baseUrl}/mensajes/${proyectoId}/marcar-leidos`, null, {
      params: { remitente_tipo: remitenteTipo }
    });
  }
}