import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type EstadoReq = 'Enviado' | 'En proceso' | 'En espera' | 'Asignado';

export interface Requerimiento {
  id: number;
  cliente_id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoReq;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class RequerimientosService {
  private api = `${environment.apiUrl}/requerimientos`;

  constructor(private http: HttpClient) {}

  listar(clienteId: number): Observable<Requerimiento[]> {
    return this.http.get<Requerimiento[]>(`${this.api}?cliente_id=${clienteId}`);
  }

  crear(body: { cliente_id: number; titulo: string; descripcion: string }): Observable<Requerimiento> {
    return this.http.post<Requerimiento>(this.api, body);
  }

  cambiarEstado(id: number, estado: EstadoReq): Observable<Requerimiento> {
    return this.http.patch<Requerimiento>(`${this.api}/${id}/estado`, { estado });
  }
}
