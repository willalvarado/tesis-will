import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo: string;
}

interface Proyecto {
  id: number;
  titulo: string;
  estado: string;
  fase: string;
  presupuesto: number;
  total_subtareas: number;
  subtareas_completadas: number;
}

interface EstadisticasCliente {
  en_analisis: number;
  publicados: number;
  en_progreso: number;
  completados: number;
  cancelados: number;
  total_invertido: number;
}

@Component({
  selector: 'app-bienvenida-cliente',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './bienvenida-cliente.component.html',
  styleUrls: ['./bienvenida-cliente.component.css']
})
export class BienvenidaClienteComponent implements OnInit {
  cliente: Usuario | null = null;
  
  // Datos reales
  misProyectos: Proyecto[] = [];
  loading = false;
  
  // Estadísticas
  estadisticas: EstadisticasCliente = {
    en_analisis: 0,
    publicados: 0,
    en_progreso: 0,
    completados: 0,
    cancelados: 0,
    total_invertido: 0
  };

  activeSection = 'dashboard';
  private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosCliente();
  }

  cargarDatosCliente(): void {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      this.cliente = JSON.parse(userData);
      if (this.cliente?.tipo !== 'cliente') {
        this.router.navigate(['/login']);
      } else {
        this.cargarMisProyectos();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarMisProyectos(): void {
    if (!this.cliente) return;

    this.loading = true;
    
    // 🔥 ENDPOINT: Obtener todos los proyectos del cliente
    this.http.get<any>(`${this.apiUrl}/proyectos/cliente/${this.cliente.id}`)
      .subscribe({
        next: (response) => {
          console.log('✅ Proyectos del cliente:', response);
          this.misProyectos = response.proyectos || [];
          this.calcularEstadisticas();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error al cargar proyectos:', err);
          this.loading = false;
          this.estadisticas = {
            en_analisis: 0,
            publicados: 0,
            en_progreso: 0,
            completados: 0,
            cancelados: 0,
            total_invertido: 0
          };
        }
      });
  }

  calcularEstadisticas(): void {
    // Contar por fase
    this.estadisticas.en_analisis = this.misProyectos.filter(
      p => p.fase === 'ANALISIS'
    ).length;

    this.estadisticas.publicados = this.misProyectos.filter(
      p => p.fase === 'PUBLICADO'
    ).length;

    this.estadisticas.en_progreso = this.misProyectos.filter(
      p => p.fase === 'EN_PROGRESO'
    ).length;

    this.estadisticas.completados = this.misProyectos.filter(
      p => p.fase === 'COMPLETADO'
    ).length;

    this.estadisticas.cancelados = this.misProyectos.filter(
      p => p.fase === 'CANCELADO'
    ).length;

    // Total invertido (presupuesto de proyectos completados)
    this.estadisticas.total_invertido = this.misProyectos
      .filter(p => p.fase === 'COMPLETADO')
      .reduce((sum, p) => sum + (p.presupuesto || 0), 0);

    console.log('📊 Estadísticas calculadas:', this.estadisticas);
  }

  contarProyectosActivos(): number {
    return this.estadisticas.publicados + this.estadisticas.en_progreso;
  }

  contarProyectosCompletados(): number {
    return this.estadisticas.completados;
  }

  getTotalProyectos(): number {
    return this.estadisticas.en_analisis + 
           this.estadisticas.publicados + 
           this.estadisticas.en_progreso + 
           this.estadisticas.completados;
  }

  obtenerIniciales(): string {
    if (!this.cliente?.nombre) return 'C';
    
    return this.cliente.nombre
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