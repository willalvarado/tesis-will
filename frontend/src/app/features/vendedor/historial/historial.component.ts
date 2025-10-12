import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProyectosService } from '../../../core/services/proyectos.service';

@Component({
  selector: 'app-historial-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialVendedorComponent implements OnInit {
  proyectos: any[] = [];
  proyectosFiltrados: any[] = [];
  cargando: boolean = true;
  
  // Filtros
  filtroEstado: string = 'todos'; // todos, completado, cancelado
  filtroPago: string = 'todos'; // todos, pagado, pendiente
  filtroCliente: string = '';
  filtroFecha: string = '';
  
  // Estadísticas
  totalGanado: number = 0;
  proyectosCompletados: number = 0;
  pagosPendientes: number = 0;

  constructor(
    private proyectosService: ProyectosService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    const vendedorId = this.obtenerVendedorId();
    
    if (!vendedorId) {
      console.error('No se encontró el ID del vendedor');
      this.cargando = false;
      return;
    }

    this.proyectosService.obtenerProyectosVendedor(vendedorId).subscribe({
      next: (proyectos) => {
        // Filtrar solo completados y cancelados
        this.proyectos = proyectos
          .filter(p => p.estado === 'completado' || p.estado === 'cancelado')
          .map(proyecto => ({
            ...proyecto,
            fecha_inicio: new Date(proyecto.fecha_inicio),
            fecha_estimada: proyecto.fecha_estimada ? new Date(proyecto.fecha_estimada) : null,
            fecha_completado: proyecto.fecha_completado ? new Date(proyecto.fecha_completado) : null,
            pagoPendiente: proyecto.presupuesto - proyecto.pagado,
            estadoPago: (proyecto.presupuesto - proyecto.pagado) === 0 ? 'pagado' : 'pendiente'
          }))
          .sort((a, b) => {
            const fechaA = a.fecha_completado || a.updated_at;
            const fechaB = b.fecha_completado || b.updated_at;
            return new Date(fechaB).getTime() - new Date(fechaA).getTime();
          });

        this.calcularEstadisticas();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.cargando = false;
      }
    });
  }

  calcularEstadisticas(): void {
    this.proyectosCompletados = this.proyectos.filter(p => p.estado === 'completado').length;
    this.totalGanado = this.proyectos
      .filter(p => p.estado === 'completado')
      .reduce((sum, p) => sum + p.pagado, 0);
    this.pagosPendientes = this.proyectos
      .reduce((sum, p) => sum + p.pagoPendiente, 0);
  }

  aplicarFiltros(): void {
    this.proyectosFiltrados = this.proyectos.filter(proyecto => {
      // Filtro por estado
      if (this.filtroEstado !== 'todos' && proyecto.estado !== this.filtroEstado) {
        return false;
      }

      // Filtro por pago
      if (this.filtroPago !== 'todos' && proyecto.estadoPago !== this.filtroPago) {
        return false;
      }

      // Filtro por cliente
      if (this.filtroCliente && !proyecto.cliente?.nombre.toLowerCase().includes(this.filtroCliente.toLowerCase())) {
        return false;
      }

      // Filtro por fecha
      if (this.filtroFecha) {
        const fechaProyecto = proyecto.fecha_completado || new Date(proyecto.updated_at);
        const fechaFiltro = new Date(this.filtroFecha);
        if (fechaProyecto.toDateString() !== fechaFiltro.toDateString()) {
          return false;
        }
      }

      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'todos';
    this.filtroPago = 'todos';
    this.filtroCliente = '';
    this.filtroFecha = '';
    this.aplicarFiltros();
  }

  private obtenerVendedorId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      return JSON.parse(usuario).id;
    }
    console.warn('⚠️ localStorage vacío. Usando ID hardcodeado: 3');
    return 3;
  }

  formatearFecha(fecha: Date | string): string {
    const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(f);
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'completado': '#10b981',
      'cancelado': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const etiquetas: { [key: string]: string } = {
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return etiquetas[estado] || estado;
  }
}