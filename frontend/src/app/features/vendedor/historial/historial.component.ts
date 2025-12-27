import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface SubTarea {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  proyecto_titulo: string;
  cliente_nombre: string;
  estado: string;
  prioridad: string;
  presupuesto: number;
  pagado: number;
  estimacion_horas: number;
  fecha_asignacion: string;
  fecha_inicio: string;
  fecha_completado: string;
  created_at: string;
  pagoPendiente?: number;
  estadoPago?: string;
}

@Component({
  selector: 'app-historial-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialVendedorComponent implements OnInit {
  subtareas: SubTarea[] = [];
  subtareasFiltradas: SubTarea[] = [];
  cargando: boolean = true;
  
  // Filtros
  filtroEstado: string = 'todos'; // todos, COMPLETADO, CANCELADO
  filtroPago: string = 'todos'; // todos, pagado, pendiente
  filtroProyecto: string = '';
  filtroFecha: string = '';
  
  // Estadísticas
  totalGanado: number = 0;
  subtareasCompletadas: number = 0;
  pagosPendientes: number = 0;
  horasTotales: number = 0;

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

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

    // Obtener todas las sub-tareas del vendedor
    this.http.get<SubTarea[]>(`${this.apiUrl}/subtareas/vendedor/${vendedorId}`)
      .subscribe({
        next: (subtareas) => {
          console.log('✅ Sub-tareas del vendedor:', subtareas);
          
          // Filtrar solo completadas y canceladas
          this.subtareas = subtareas
            .filter(st => st.estado === 'COMPLETADO' || st.estado === 'CANCELADO')
            .map(st => ({
              ...st,
              pagoPendiente: st.presupuesto - st.pagado,
              estadoPago: (st.presupuesto - st.pagado) === 0 ? 'pagado' : 'pendiente'
            }))
            .sort((a, b) => {
              const fechaA = new Date(a.fecha_completado || a.created_at);
              const fechaB = new Date(b.fecha_completado || b.created_at);
              return fechaB.getTime() - fechaA.getTime();
            });

          this.calcularEstadisticas();
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar historial:', error);
          this.cargando = false;
        }
      });
  }

  calcularEstadisticas(): void {
    this.subtareasCompletadas = this.subtareas.filter(st => st.estado === 'COMPLETADO').length;
    
    this.totalGanado = this.subtareas
      .filter(st => st.estado === 'COMPLETADO')
      .reduce((sum, st) => sum + st.pagado, 0);
    
    this.pagosPendientes = this.subtareas
      .reduce((sum, st) => sum + (st.presupuesto - st.pagado), 0);
    
    this.horasTotales = this.subtareas
      .filter(st => st.estado === 'COMPLETADO')
      .reduce((sum, st) => sum + (st.estimacion_horas || 0), 0);
  }

  aplicarFiltros(): void {
    this.subtareasFiltradas = this.subtareas.filter(subtarea => {
      // Filtro por estado
      if (this.filtroEstado !== 'todos' && subtarea.estado !== this.filtroEstado) {
        return false;
      }

      // Filtro por pago
      if (this.filtroPago !== 'todos' && subtarea['estadoPago'] !== this.filtroPago) {
        return false;
      }

      // Filtro por proyecto
      if (this.filtroProyecto && !subtarea.proyecto_titulo?.toLowerCase().includes(this.filtroProyecto.toLowerCase())) {
        return false;
      }

      // Filtro por fecha
      if (this.filtroFecha) {
        const fechaSubtarea = new Date(subtarea.fecha_completado || subtarea.created_at);
        const fechaFiltro = new Date(this.filtroFecha);
        if (fechaSubtarea.toDateString() !== fechaFiltro.toDateString()) {
          return false;
        }
      }

      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'todos';
    this.filtroPago = 'todos';
    this.filtroProyecto = '';
    this.filtroFecha = '';
    this.aplicarFiltros();
  }

  private obtenerVendedorId(): number | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      return JSON.parse(usuario).id;
    }
    console.warn('⚠️ localStorage vacío. Usando ID hardcodeado: 2');
    return 2;
  }

  formatearFecha(fecha: Date | string | null): string {
    if (!fecha) return 'No definida';
    const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(f);
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'COMPLETADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const etiquetas: { [key: string]: string } = {
      'COMPLETADO': 'Completado',
      'CANCELADO': 'Cancelado'
    };
    return etiquetas[estado] || estado;
  }

  obtenerColorPrioridad(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': '#ef4444',
      'MEDIA': '#f59e0b',
      'BAJA': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  }
}