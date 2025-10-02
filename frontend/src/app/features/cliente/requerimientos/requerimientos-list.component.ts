import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequerimientosService, Requerimiento } from '../../../core/services/requerimientos.service';

@Component({
  selector: 'app-requerimientos-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requerimientos-list.component.html',
  styleUrls: ['./requerimientos-list.component.css']
})
export class RequerimientosListComponent implements OnInit {
  datos: Requerimiento[] = [];
  cargando = true;

  constructor(private req: RequerimientosService) {}

  ngOnInit(): void {
    this.cargarRequerimientos();
  }

  cargarRequerimientos(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const clienteId = JSON.parse(usuario).id;
      
      this.req.obtenerRequerimientosCliente(clienteId).subscribe({
        next: (requerimientos) => {
          this.datos = requerimientos;
          this.cargando = false;
          console.log('Requerimientos del cliente:', requerimientos);
        },
        error: (error) => {
          console.error('Error al cargar requerimientos:', error);
          this.cargando = false;
        }
      });
    }
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'asignado': 'Asignado',
      'en_proceso': 'En Proceso', 
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  getEstadoIcon(estado: string): string {
    const iconos: { [key: string]: string } = {
      'pendiente': '⏳',
      'asignado': '✅',
      'en_proceso': '⚡',
      'completado': '🎉',
      'cancelado': '❌'
    };
    return iconos[estado] || '📄';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCountByEstado(estado: string): number {
    return this.datos.filter(req => req.estado === estado).length;
  }
}
