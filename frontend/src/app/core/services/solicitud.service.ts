import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface SolicitudCreate {
  subtarea_id: number;
  vendedor_id: number;
  mensaje?: string;
}

interface SolicitudResponse {
  id: number;
  subtarea_id: number;
  vendedor_id: number;
  estado: string;
  mensaje?: string;
  motivo_rechazo?: string;
  fecha_solicitud: string;
  fecha_respuesta?: string;
  subtarea_codigo?: string;
  subtarea_titulo?: string;
  vendedor_nombre?: string;
  vendedor_email?: string;
}

interface ResponderSolicitud {
  accion: 'ACEPTAR' | 'RECHAZAR';
  motivo_rechazo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl = 'http://localhost:8000/solicitudes';

  constructor(private http: HttpClient) {}

  // 🔥 VENDEDOR: Enviar solicitud
  enviarSolicitud(solicitud: SolicitudCreate): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(`${this.apiUrl}/enviar`, solicitud);
  }

  // 🔥 VENDEDOR: Ver mis solicitudes
  obtenerMisSolicitudes(vendedorId: number): Observable<SolicitudResponse[]> {
    return this.http.get<SolicitudResponse[]>(`${this.apiUrl}/vendedor/${vendedorId}`);
  }

  // 🔥 CLIENTE: Ver solicitudes de un proyecto
  obtenerSolicitudesProyecto(proyectoId: number): Observable<SolicitudResponse[]> {
    return this.http.get<SolicitudResponse[]>(`${this.apiUrl}/proyecto/${proyectoId}`);
  }

  // 🔥 CLIENTE: Aceptar o rechazar solicitud
  responderSolicitud(solicitudId: number, respuesta: ResponderSolicitud): Observable<any> {
    return this.http.put(`${this.apiUrl}/${solicitudId}/responder`, respuesta);
  }
}