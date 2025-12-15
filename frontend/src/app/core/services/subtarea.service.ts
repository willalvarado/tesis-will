import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SubTarea {
  id: number;
  proyecto_id: number;
  proyecto_titulo?: string;
  cliente_nombre?: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  especialidad: string;
  vendedor_id?: number;
  vendedor_nombre?: string;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  presupuesto: number;
  pagado: number;
  estimacion_horas: number;
  fecha_asignacion?: string;
  fecha_inicio?: string;
  fecha_completado?: string;
}

export interface EstadisticasProyecto {
  total_subtareas: number;
  pendientes: number;
  asignadas: number;
  en_progreso: number;
  completadas: number;
  progreso_porcentaje: number;
  subtareas: SubTarea[];
}

// 🔥 NUEVA INTERFAZ para respuesta de sub-tareas disponibles
export interface RespuestaSubtareasDisponibles {
  subtareas: SubTarea[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubtareaService {
  private apiUrl = 'http://localhost:8000/subtareas';

  constructor(private http: HttpClient) {}

  // Cliente - Ver sub-tareas de su proyecto
  obtenerSubtareasProyecto(proyectoId: number): Observable<EstadisticasProyecto> {
    return this.http.get<EstadisticasProyecto>(`${this.apiUrl}/proyecto/${proyectoId}`);
  }

  // 🔥 ACTUALIZADO: Vendedor - Ver sub-tareas disponibles
  obtenerSubtareasDisponibles(especialidad?: string, prioridad?: string): Observable<RespuestaSubtareasDisponibles> {
    let url = `${this.apiUrl}/disponibles`;
    const params: string[] = [];
    
    if (especialidad) params.push(`especialidad=${especialidad}`);
    if (prioridad) params.push(`prioridad=${prioridad}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<SubTarea[]>(url).pipe(
      map(subtareas => ({
        subtareas: subtareas,
        total: subtareas.length
      }))
    );
  }

  // Vendedor - Ver mis sub-tareas
  obtenerMisSubtareas(vendedorId: number, estado?: string): Observable<SubTarea[]> {
    let url = `${this.apiUrl}/mis-subtareas/${vendedorId}`;
    if (estado) {
      url += `?estado=${estado}`;
    }
    return this.http.get<SubTarea[]>(url);
  }

  // Vendedor - Aceptar sub-tarea
  aceptarSubtarea(subtareaId: number, vendedorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/aceptar`, {
      subtarea_id: subtareaId,
      vendedor_id: vendedorId
    });
  }

  // Vendedor - Actualizar progreso
actualizarProgreso(subtareaId: number, nuevoEstado: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/actualizar-progreso`, {
    subtarea_id: subtareaId,
    estado: nuevoEstado  // 🔥 CAMBIO: nuevo_estado → estado
  });
}

  // Vendedor - Estadísticas
  obtenerEstadisticasVendedor(vendedorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/vendedor/${vendedorId}`);
  }

  // 🔥 NUEVO: Obtener detalle completo de una sub-tarea
  obtenerDetalleSubtarea(subtareaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${subtareaId}`);
  }
}