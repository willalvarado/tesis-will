import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Archivo {
  id: number;
  proyecto_id: number;
  nombre_original: string;
  nombre_guardado: string;
  tamanio: number;
  tipo_mime: string | null;
  subido_por_tipo: 'cliente' | 'vendedor';
  subido_por_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private baseUrl = 'http://localhost:8000/archivos';

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo al proyecto
   */
  subirArchivo(
    proyectoId: number,
    archivo: File,
    subidoPorTipo: 'cliente' | 'vendedor',
    subidoPorId: number
  ): Observable<Archivo> {
    const formData = new FormData();
    formData.append('proyecto_id', proyectoId.toString());
    formData.append('subido_por_tipo', subidoPorTipo);
    formData.append('subido_por_id', subidoPorId.toString());
    formData.append('file', archivo);

    return this.http.post<Archivo>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Obtiene todos los archivos de un proyecto
   */
  listarArchivos(proyectoId: number): Observable<Archivo[]> {
    return this.http.get<Archivo[]>(`${this.baseUrl}/proyecto/${proyectoId}`);
  }

  /**
   * Descarga un archivo
   */
  descargarArchivo(archivoId: number): void {
    window.open(`${this.baseUrl}/download/${archivoId}`, '_blank');
  }

  /**
   * Elimina un archivo
   */
  eliminarArchivo(archivoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${archivoId}`);
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatearTamanio(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtiene el icono según la extensión
   */
  obtenerIcono(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    const iconos: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
      zip: '📦', rar: '📦',
      txt: '📃',
      mp4: '🎥',
      mp3: '🎵'
    };
    return iconos[extension || ''] || '📄';
  }
}