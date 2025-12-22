import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo: string;
}

interface SubTarea {
  id: number;
  codigo: string;
  titulo: string;
  estado: string;
  presupuesto: number;
  proyecto_titulo: string;
  mensajes_no_leidos: number;
}

interface EstadisticasVendedor {
  asignadas: number;
  en_progreso: number;
  completadas: number;
  canceladas: number;
  total_ganado: number;
  mensajes_no_leidos: number;
}

@Component({
  selector: 'app-bienvenida-vendedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bienvenida-vendedor.component.html',
  styleUrls: ['./bienvenida-vendedor.component.css']
})
export class BienvenidaVendedorComponent implements OnInit {
  vendedor: Usuario | null = null;
  
  // Datos reales
  misSubtareas: SubTarea[] = [];
  loading = false;
  
  // Estadísticas
  estadisticas: EstadisticasVendedor = {
    asignadas: 0,
    en_progreso: 0,
    completadas: 0,
    canceladas: 0,
    total_ganado: 0,
    mensajes_no_leidos: 0
  };

  activeSection = 'dashboard';
  private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosVendedor();
  }

  cargarDatosVendedor(): void {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      this.vendedor = JSON.parse(userData);
      if (this.vendedor?.tipo !== 'vendedor') {
        this.router.navigate(['/login']);
      } else {
        this.cargarMisSubtareas();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarMisSubtareas(): void {
    if (!this.vendedor) return;

    this.loading = true;
    
    // 🔥 ENDPOINT: Obtener todas las sub-tareas del vendedor
    this.http.get<SubTarea[]>(`${this.apiUrl}/subtareas/vendedor/${this.vendedor.id}`)
      .subscribe({
        next: (subtareas) => {
          console.log('✅ Sub-tareas del vendedor:', subtareas);
          this.misSubtareas = subtareas;
          this.calcularEstadisticas();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error al cargar sub-tareas:', err);
          this.loading = false;
          // Valores por defecto si falla
          this.estadisticas = {
            asignadas: 0,
            en_progreso: 0,
            completadas: 0,
            canceladas: 0,
            total_ganado: 0,
            mensajes_no_leidos: 0
          };
        }
      });
  }

  calcularEstadisticas(): void {
    // Contar por estado
    this.estadisticas.asignadas = this.misSubtareas.filter(
      st => st.estado === 'ASIGNADA'
    ).length;

    this.estadisticas.en_progreso = this.misSubtareas.filter(
      st => st.estado === 'EN_PROGRESO'
    ).length;

    this.estadisticas.completadas = this.misSubtareas.filter(
      st => st.estado === 'COMPLETADO'
    ).length;

    this.estadisticas.canceladas = 0; // Por ahora no hay canceladas

    // Total ganado (solo completadas)
    this.estadisticas.total_ganado = this.misSubtareas
      .filter(st => st.estado === 'COMPLETADO')
      .reduce((sum, st) => sum + (st.presupuesto || 0), 0);

    // Mensajes no leídos (suma de todas las sub-tareas)
    this.estadisticas.mensajes_no_leidos = this.misSubtareas
      .reduce((sum, st) => sum + (st.mensajes_no_leidos || 0), 0);

    console.log('📊 Estadísticas calculadas:', this.estadisticas);
  }

  contarProyectosActivos(): number {
    return this.estadisticas.asignadas + this.estadisticas.en_progreso;
  }

  contarProyectosCompletados(): number {
    return this.estadisticas.completadas;
  }

  getTotalSubtareas(): number {
    return this.estadisticas.asignadas + 
           this.estadisticas.en_progreso + 
           this.estadisticas.completadas;
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  verNotificaciones(): void {
    if (this.estadisticas.mensajes_no_leidos > 0) {
      this.router.navigate(['/vendedor/mis-proyectos']);
    } else {
      alert('📭 No tienes mensajes nuevos');
    }
  }

  obtenerIniciales(): string {
    if (!this.vendedor?.nombre) return 'V';
    
    return this.vendedor.nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }
}