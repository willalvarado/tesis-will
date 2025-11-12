import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Estados que coinciden EXACTAMENTE con el backend
// Estados que coinciden EXACTAMENTE con el backend
export type EstadoReq =
  | 'pendiente'
  | 'asignado'
  | 'en_proceso'
  | 'completado'
  | 'cancelado'
  | 'aceptado'
  | 'Pendiente de revisión por vendedor especializado';


export interface Requerimiento {
  id: number;
  cliente_id: number;
  cliente_nombre?: string;      // 🔥 NUEVO
  vendedor_id?: number;
  vendedor_nombre?: string;     // 🔥 NUEVO
  titulo: string;
  mensaje: string;
  descripcion?: string;
  especialidad: string;
  estado: string;
  fecha_creacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequerimientosService {
  private api = 'http://localhost:8000/requerimientos';

  constructor(private http: HttpClient) {}

  // Obtener requerimientos del cliente
  obtenerRequerimientosCliente(clienteId: number): Observable<Requerimiento[]> {
    return this.http.get<Requerimiento[]>(`${this.api}/cliente/${clienteId}`);
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
  asignarRequerimiento(requerimientoId: number, vendedorId: number): Observable<Requerimiento> {
    return this.http.put<Requerimiento>(
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