import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Archivo {
  nombre: string;
  fechaSubida: Date;
  tamaño?: string;
}

export interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

export interface Proyecto {
  id: number;
  requerimiento_id: number;
  cliente_id: number;
  vendedor_id: number;
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
  vendedor?: Vendedor;
  cliente?: Cliente;
  archivos?: Archivo[];
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

  obtenerProyectosCliente(clienteId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  obtenerProyectosVendedor(vendedorId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/vendedor/${vendedorId}`);
  }

  obtenerProyecto(proyectoId: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${proyectoId}`);
  }

  actualizarProyecto(proyectoId: number, datos: ProyectoUpdate): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${proyectoId}`, datos);
  }

  eliminarProyecto(proyectoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${proyectoId}`);
  }
}