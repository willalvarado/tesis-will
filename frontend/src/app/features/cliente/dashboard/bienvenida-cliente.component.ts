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

interface SubTarea {
  id: number;
  proyecto_id: number;
  estado: string;
  presupuesto: number;
  vendedor_id: number | null;
}

interface EstadisticasCliente {
  en_progreso: number;
  completados: number;
  total_invertido: number;
  subtareas_pendientes: number;
  subtareas_asignadas: number;
  subtareas_en_progreso: number;
  subtareas_completadas: number;
  total_subtareas: number;
  solicitudes_pendientes: number; // 🔥 NUEVO
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
  
  misProyectos: Proyecto[] = [];
  todasSubtareas: SubTarea[] = [];
  loading = false;
  
  estadisticas: EstadisticasCliente = {
    en_progreso: 0,
    completados: 0,
    total_invertido: 0,
    subtareas_pendientes: 0,
    subtareas_asignadas: 0,
    subtareas_en_progreso: 0,
    subtareas_completadas: 0,
    total_subtareas: 0,
    solicitudes_pendientes: 0 // 🔥 NUEVO
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
    
    this.http.get<any>(`${this.apiUrl}/proyectos/cliente/${this.cliente.id}`)
      .subscribe({
        next: (response) => {
          console.log('✅ Proyectos del cliente:', response);
          
          if (Array.isArray(response)) {
            this.misProyectos = response;
          } else {
            this.misProyectos = response.proyectos || [];
          }
          
          console.log('📋 Total proyectos cargados:', this.misProyectos.length);
          
          this.cargarSubtareas();
        },
        error: (err) => {
          console.error('❌ Error al cargar proyectos:', err);
          this.loading = false;
        }
      });
  }

  cargarSubtareas(): void {
    const idsProyectos = this.misProyectos.map(p => p.id);
    
    if (idsProyectos.length === 0) {
      this.calcularEstadisticas();
      this.cargarSolicitudes(); // 🔥 NUEVO
      this.loading = false;
      return;
    }

    const peticiones = idsProyectos.map(id => 
      this.http.get<any>(`${this.apiUrl}/subtareas/proyecto/${id}`)
    );

    Promise.all(peticiones.map(p => p.toPromise()))
      .then(responses => {
        this.todasSubtareas = [];
        
        responses.forEach(response => {
          if (response && response.subtareas) {
            this.todasSubtareas.push(...response.subtareas);
          }
        });

        console.log('📋 Total sub-tareas cargadas:', this.todasSubtareas.length);
        this.calcularEstadisticas();
        this.cargarSolicitudes(); // 🔥 NUEVO
        this.loading = false;
      })
      .catch(err => {
        console.error('❌ Error al cargar sub-tareas:', err);
        this.calcularEstadisticas();
        this.cargarSolicitudes(); // 🔥 NUEVO
        this.loading = false;
      });
  }

  // 🔥 NUEVO: Cargar contador de solicitudes pendientes
  cargarSolicitudes(): void {
    const idsProyectos = this.misProyectos.map(p => p.id);
    
    if (idsProyectos.length === 0) return;

    const peticiones = idsProyectos.map(id => 
      this.http.get<any>(`${this.apiUrl}/solicitudes/proyecto/${id}`)
    );

    Promise.all(peticiones.map(p => p.toPromise()))
      .then(responses => {
        let totalSolicitudes = 0;
        
        responses.forEach(solicitudes => {
          if (Array.isArray(solicitudes)) {
            totalSolicitudes += solicitudes.length;
          }
        });

        this.estadisticas.solicitudes_pendientes = totalSolicitudes;
        console.log('📬 Solicitudes pendientes:', totalSolicitudes);
      })
      .catch(err => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.estadisticas.solicitudes_pendientes = 0;
      });
  }

  calcularEstadisticas(): void {
    console.log('🔍 Calculando estadísticas...');
    
    this.estadisticas.en_progreso = this.misProyectos.filter(
      p => p.fase === 'EN_PROGRESO' || p.fase === 'PUBLICADO'
    ).length;

    this.estadisticas.completados = this.misProyectos.filter(
      p => p.fase === 'COMPLETADO'
    ).length;

    this.estadisticas.total_invertido = this.misProyectos
      .filter(p => p.fase === 'COMPLETADO')
      .reduce((sum, p) => sum + (p.presupuesto || 0), 0);

    this.estadisticas.subtareas_pendientes = this.todasSubtareas.filter(
      st => st.estado === 'PENDIENTE' || st.estado === 'SOLICITADA'
    ).length;

    this.estadisticas.subtareas_asignadas = this.todasSubtareas.filter(
      st => st.estado === 'ASIGNADA'
    ).length;

    this.estadisticas.subtareas_en_progreso = this.todasSubtareas.filter(
      st => st.estado === 'EN_PROGRESO'
    ).length;

    this.estadisticas.subtareas_completadas = this.todasSubtareas.filter(
      st => st.estado === 'COMPLETADO'
    ).length;

    this.estadisticas.total_subtareas = this.todasSubtareas.length;

    console.log('📊 Estadísticas calculadas:', this.estadisticas);
  }

  contarProyectosActivos(): number {
    return this.estadisticas.en_progreso;
  }

  contarProyectosCompletados(): number {
    return this.estadisticas.completados;
  }

  getTotalProyectos(): number {
    return this.estadisticas.en_progreso + this.estadisticas.completados;
  }

  obtenerIniciales(): string {
    if (!this.cliente?.nombre) return 'C';
    
    return this.cliente.nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // 🔥 NUEVO: Navegar a solicitudes
  irASolicitudes(): void {
    this.router.navigate(['/cliente/solicitudes']);
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }
}