import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Estados que coinciden EXACTAMENTE con el backend
export type EstadoReq =
  | 'pendiente'
  | 'asignado'
  | 'en_proceso'
  | 'completado'
  | 'cancelado'
  | 'aceptado'
  | 'Pendiente de revisión por vendedor especializado';

// Interfaz para requerimientos viejos
export interface Requerimiento {
  id: number;
  cliente_id: number;
  cliente_nombre?: string;
  vendedor_id: number | null;
  vendedor_nombre?: string;
  titulo: string;
  mensaje: string;
  descripcion: string | null;
  especialidad: string;
  estado: string;
  fecha_creacion: string;
}

// 🆕 Interfaz para proyectos en análisis/publicado (nuevo sistema con IA)
export interface ProyectoRequerimiento {
  id: number;
  titulo: string;
  descripcion: string | null;
  fase: string;
  total_subtareas: number;
  subtareas_completadas: number;
  historia_usuario: string | null;
  criterios_aceptacion: string[];
  diagrama_flujo: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequerimientosService {
  private api = 'http://localhost:8000/requerimientos';

  constructor(private http: HttpClient) {}

  // Obtener requerimientos del cliente (sistema viejo)
  obtenerRequerimientosCliente(clienteId: number): Observable<Requerimiento[]> {
    return this.http.get<Requerimiento[]>(`${this.api}/cliente/${clienteId}`);
  }

  // 🆕 Obtener proyectos en análisis/publicado (nuevo sistema con IA)
  obtenerProyectosEnAnalisis(clienteId: number): Observable<ProyectoRequerimiento[]> {
    return this.http.get<ProyectoRequerimiento[]>(`${this.api}/proyectos-cliente/${clienteId}`);
  }

  // Crear nuevo requerimiento
  crearRequerimiento(clienteId: number, mensaje: string): Observable<Requerimiento> {
    return this.http.post<Requerimiento>(`${this.api}/crear`, {
      cliente_id: clienteId,
      mensaje: mensaje
    });
  }

  // Obtener requerimientos disponibles para vendedor
  obtenerRequerimientosDisponibles(especialidad?: string): Observable<Requerimiento[]> {
    const url = especialidad 
      ? `${this.api}/vendedor/disponibles?especialidad=${especialidad}`
      : `${this.api}/vendedor/disponibles`;
    return this.http.get<Requerimiento[]>(url);
  }

  // Obtener requerimientos asignados a vendedor
  obtenerRequerimientosVendedor(vendedorId: number): Observable<Requerimiento[]> {
    return this.http.get<Requerimiento[]>(`${this.api}/vendedor/${vendedorId}`);
  }

  // Asignar requerimiento a vendedor
  asignarRequerimiento(requerimientoId: number, vendedorId: number): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${requerimientoId}/asignar?vendedor_id=${vendedorId}`,
      {}
    );
  }

  // Cambiar estado del requerimiento
  cambiarEstado(requerimientoId: number, nuevoEstado: EstadoReq): Observable<Requerimiento> {
    return this.http.put<Requerimiento>(
      `${this.api}/${requerimientoId}/estado?nuevo_estado=${nuevoEstado}`,
      {}
    );
  }
}