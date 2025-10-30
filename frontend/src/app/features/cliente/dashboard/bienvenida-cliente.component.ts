import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { RequerimientosService } from '../../../core/services/requerimientos.service';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo: string;
}

interface ResumenEstados {
  sin_asignar: number;
  en_proceso: number;
  completados: number;
  cancelados: number;
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
  userName: string = 'Cliente'; // 🔥 AGREGADO para compatibilidad
  
  // Estadísticas
  requerimientosActivos: number = 0;
  proyectosEnProceso: number = 0;
  proyectosCompletados: number = 0;
  totalInvertido: number = 0;
  
  // Resumen por estados
  resumenEstados: ResumenEstados = {
    sin_asignar: 0,
    en_proceso: 0,
    completados: 0,
    cancelados: 0
  };

  activeSection = 'dashboard';

  constructor(
    private http: HttpClient,
    private router: Router,
    private proyectosService: ProyectosService,
    private requerimientosService: RequerimientosService
  ) {}

  ngOnInit(): void {
    this.cargarDatosCliente();
  }

  cargarDatosCliente(): void {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      this.cliente = JSON.parse(userData);
      this.userName = this.cliente?.nombre || 'Cliente'; // 🔥 ACTUALIZAR userName
      
      if (this.cliente?.tipo !== 'cliente') {
        this.router.navigate(['/login']);
      } else {
        this.cargarEstadisticas();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarEstadisticas(): void {
    if (!this.cliente) return;

    // Cargar proyectos del cliente
    this.proyectosService.obtenerProyectosCliente(this.cliente.id).subscribe({
      next: (proyectos) => {
        console.log('Proyectos del cliente:', proyectos);
        
        // Calcular estadísticas
        this.proyectosEnProceso = proyectos.filter(
          p => p.estado === 'asignado' || p.estado === 'en_proceso'
        ).length;

        this.proyectosCompletados = proyectos.filter(
          p => p.estado === 'completado'
        ).length;

        this.totalInvertido = proyectos
          .filter(p => p.estado === 'completado')
          .reduce((sum, p) => sum + (p.pagado || 0), 0);

        // Resumen por estados (SIN 'pendiente', solo estados de proyectos)
        this.resumenEstados = {
          sin_asignar: proyectos.filter(p => p.estado === 'asignado').length,
          en_proceso: proyectos.filter(p => p.estado === 'en_proceso').length,
          completados: proyectos.filter(p => p.estado === 'completado').length,
          cancelados: proyectos.filter(p => p.estado === 'cancelado').length
        };
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        // Datos por defecto si falla
        this.proyectosEnProceso = 0;
        this.proyectosCompletados = 0;
        this.totalInvertido = 0;
      }
    });

    // Cargar requerimientos activos (sin vendedor asignado)
    this.requerimientosService.obtenerRequerimientosCliente(this.cliente.id).subscribe({
      next: (requerimientos) => {
        console.log('Requerimientos del cliente:', requerimientos);
        this.requerimientosActivos = requerimientos.filter(
          r => !r.vendedor_id || r.estado === 'pendiente'
        ).length;
      },
      error: (err) => {
        console.error('Error al cargar requerimientos:', err);
        this.requerimientosActivos = 0;
      }
    });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  obtenerIniciales(): string {
    if (!this.cliente?.nombre) return 'C';
    
    return this.cliente.nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // 🔥 MÉTODO AGREGADO para compatibilidad
  getInitials(): string {
    return this.obtenerIniciales();
  }

  toggleNotificaciones(): void {
    alert('🔔 Tienes 2 nuevas notificaciones:\n\n• Tu requerimiento tiene una propuesta\n• Nuevo mensaje del vendedor');
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }

  // 🔥 MÉTODO AGREGADO para compatibilidad con el HTML viejo
  logout(): void {
    this.cerrarSesion();
  }
}