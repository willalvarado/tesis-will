import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Archivo {
  nombre: string;
  fechaSubida: Date;
  tamaño?: string;
}

export interface Proyecto {
  id: number;
  requerimiento_id?: number;
  cliente_id: number;
  vendedor_id?: number;
  titulo: string;
  descripcion: string | null;
  especialidad: string;
  estado: 'asignado' | 'en_proceso' | 'pausado' | 'completado' | 'cancelado';
  progreso: number;
  presupuesto: number;
  pagado: number;
  fecha_inicio: string;
  fecha_estimada: string | null;
  fecha_completado: string | null;
  created_at: string;
  updated_at: string;
  
  // 🆕 CAMPOS NUEVOS DEL SISTEMA CON IA
  total_subtareas?: number;
  subtareas_completadas?: number;
  fase?: string; // ANÁLISIS, PUBLICADO, EN_PROGRESO, COMPLETADO, CANCELADO
  historia_usuario?: string;
  criterios_aceptacion?: string[];
  diagrama_flujo?: string;
  
  // Para el frontend agregamos estos campos que se calcularán localmente
  archivos?: Archivo[];
  vendedor?: {
    id: number;
    nombre: string;
    email: string;
    avatar?: string;
  };
  ultimaActividad?: Date;
}

export interface ProyectoUpdate {
  estado?: string;
  progreso?: number;
  pagado?: number;
  fecha_estimada?: string;
  presupuesto?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private apiUrl = 'http://localhost:8000/proyectos';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los proyectos de un cliente
   */
  obtenerProyectosCliente(clienteId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  /**
   * Obtiene todos los proyectos de un vendedor
   */
  obtenerProyectosVendedor(vendedorId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/vendedor/${vendedorId}`);
  }

  /**
   * Obtiene el detalle de un proyecto específico
   */
  obtenerProyecto(proyectoId: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${proyectoId}`);
  }

  /**
   * Actualiza los datos de un proyecto (progreso, pagado, estado, etc.)
   */
  actualizarProyecto(proyectoId: number, datos: ProyectoUpdate): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${proyectoId}`, datos);
  }

  /**
   * Elimina un proyecto (normalmente no se usa, mejor cambiar estado a cancelado)
   */
  eliminarProyecto(proyectoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${proyectoId}`);
  }

  /**
   * Método auxiliar para convertir fechas string a Date
   */
  private convertirFechas(proyecto: any): Proyecto {
    return {
      ...proyecto,
      fecha_inicio: new Date(proyecto.fecha_inicio),
      fecha_estimada: proyecto.fecha_estimada ? new Date(proyecto.fecha_estimada) : null,
      fecha_completado: proyecto.fecha_completado ? new Date(proyecto.fecha_completado) : null,
      created_at: new Date(proyecto.created_at),
      updated_at: new Date(proyecto.updated_at),
      ultimaActividad: new Date(proyecto.updated_at),
      archivos: [] // Por ahora vacío, se implementará después
    };
  }
}