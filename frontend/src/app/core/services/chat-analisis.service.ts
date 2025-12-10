// frontend/src/app/core/services/chat-analisis.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ========================================
// INTERFACES
// ========================================

export interface MensajeAnalisis {
  role: 'user' | 'assistant';
  content: string;
}

export interface IniciarAnalisisRequest {
  cliente_id: number;
  mensaje_inicial: string;
}

export interface IniciarAnalisisResponse {
  exito: boolean;
  proyecto_id: number;
  respuesta_ia: string;
  finalizado: boolean;
  tokens_usados: number;
}

export interface ContinuarAnalisisRequest {
  proyecto_id: number;
  mensaje: string;
}

export interface SubTarea {
  codigo: string;
  titulo: string;
  descripcion: string;
  especialidad: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estimacion_horas: number;
  dependencias: string[];
}

export interface ProyectoAnalizado {
  titulo: string;
  historia_usuario: string;
  descripcion_completa: string;
  criterios_aceptacion: string[];
  presupuesto_estimado: number;
  tiempo_estimado_dias: number;
  subtareas: SubTarea[];
  total_subtareas: number;
}

export interface ContinuarAnalisisResponse {
  exito: boolean;
  respuesta_ia: string;
  finalizado: boolean;
  proyecto_id?: number;
  proyecto?: ProyectoAnalizado;
  resumen?: string;
  tokens_usados: number;
}

export interface PublicarProyectoRequest {
  proyecto_id: number;
}

export interface PublicarProyectoResponse {
  exito: boolean;
  mensaje: string;
  proyecto_id: number;
  subtareas_publicadas: number;
}

export interface HistorialMensaje {
  id: number;
  emisor: 'CLIENTE' | 'VENDEDOR' | 'IA';
  mensaje: string;
  timestamp: string;
  metadatos?: any;
}

export interface HistorialResponse {
  exito: boolean;
  total_mensajes: number;
  mensajes: HistorialMensaje[];
}

export interface Especialidad {
  codigo: string;
  nombre: string;
}

export interface EspecialidadesResponse {
  exito: boolean;
  especialidades: Especialidad[];
}

// ========================================
// SERVICIO
// ========================================

@Injectable({
  providedIn: 'root'
})
export class ChatAnalisisService {
  private apiUrl = 'http://localhost:8000/chat-analisis';

  constructor(private http: HttpClient) {}

  /**
   * Inicia un nuevo análisis de proyecto con IA
   * @param data - cliente_id y mensaje_inicial
   * @returns Observable con proyecto_id y primera respuesta de IA
   */
  iniciarAnalisis(data: IniciarAnalisisRequest): Observable<IniciarAnalisisResponse> {
    return this.http.post<IniciarAnalisisResponse>(`${this.apiUrl}/iniciar`, data);
  }

  /**
   * Continúa el análisis de un proyecto existente
   * @param data - proyecto_id y nuevo mensaje
   * @returns Observable con respuesta de IA y posible proyecto finalizado
   */
  continuarAnalisis(data: ContinuarAnalisisRequest): Observable<ContinuarAnalisisResponse> {
    return this.http.post<ContinuarAnalisisResponse>(`${this.apiUrl}/continuar`, data);
  }

  /**
   * Publica un proyecto analizado para que vendedores vean sub-tareas
   * @param data - proyecto_id
   * @returns Observable con confirmación
   */
  publicarProyecto(data: PublicarProyectoRequest): Observable<PublicarProyectoResponse> {
    return this.http.post<PublicarProyectoResponse>(`${this.apiUrl}/publicar`, data);
  }

  /**
   * Obtiene el historial completo de conversación de un proyecto
   * @param proyectoId - ID del proyecto
   * @returns Observable con array de mensajes
   */
  obtenerHistorial(proyectoId: number): Observable<HistorialResponse> {
    return this.http.get<HistorialResponse>(`${this.apiUrl}/historial/${proyectoId}`);
  }

  /**
   * Lista todas las especialidades disponibles
   * @returns Observable con array de especialidades
   */
  listarEspecialidades(): Observable<EspecialidadesResponse> {
    return this.http.get<EspecialidadesResponse>(`${this.apiUrl}/especialidades`);
  }
}
