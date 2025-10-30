// frontend/src/app/core/services/openai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  exito: boolean;
  respuesta: string;
  finalizado: boolean;
  requerimiento: {
    titulo: string;
    descripcion: string;
    especialidad: string;
    presupuesto: string;
    mensaje: string;
  } | null;
  tokens_usados: number;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiUrl = 'http://localhost:8000/api/openai';

  constructor(private http: HttpClient) {}

  chatRequerimiento(mensajes: Mensaje[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat-requerimiento`, {
      mensajes: mensajes
    });
  }
}