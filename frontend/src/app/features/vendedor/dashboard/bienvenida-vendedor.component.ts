// pages/bienvenida-vendedor/bienvenida-vendedor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router} from '@angular/router'; // ⭐ AGREGAR RouterLink aquí

interface Requerimiento {
  id: number;
  cliente_id: number;
  vendedor_id: number | null;
  titulo: string;
  mensaje: string;
  descripcion: string;
  especialidad: string;
  estado: string;
  fecha_creacion: Date;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo: string;
}

interface ActividadReciente {
  icon: string;
  descripcion: string;
  tiempo: string;
}

@Component({
  selector: 'app-bienvenida-vendedor',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    FormsModule,
      // ⭐ AGREGAR RouterLink aquí en imports
  ],
  templateUrl: './bienvenida-vendedor.component.html',
  styleUrls: ['./bienvenida-vendedor.component.css']
})
export class BienvenidaVendedorComponent implements OnInit {
  vendedor: Usuario | null = null;
  vendedorEspecialidad = 'Desarrollo de software a medida';
  
  requerimientosDisponibles: Requerimiento[] = [];
  misRequerimientos: Requerimiento[] = [];
  loading = false;
  error = '';
  
  // NUEVA PROPIEDAD para controlar las secciones
  activeSection = 'dashboard';
  
  // NUEVA PROPIEDAD para actividades recientes
  actividadesRecientes: ActividadReciente[] = [
    {
      icon: '🔄',
      descripcion: 'Proyecto "App Móvil E-commerce" actualizado a En Proceso',
      tiempo: 'Hace 2 horas'
    },
    {
      icon: '✅',
      descripcion: 'Completaste el proyecto "Sistema de Inventario"',
      tiempo: 'Hace 1 día'
    },
    {
      icon: '📋',
      descripcion: 'Nuevo requerimiento disponible: "Portal Corporativo"',
      tiempo: 'Hace 2 días'
    }
  ];

  private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosVendedor();

    if (this.vendedor) {
      this.cargarRequerimientosDisponibles();
      this.cargarMisRequerimientos();
    }
  }

  cargarDatosVendedor(): void {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      this.vendedor = JSON.parse(userData);
      if (this.vendedor?.tipo !== 'vendedor') {
        this.router.navigate(['/login']);
      } else {
        // 🔥 solo aquí cargo los requerimientos cuando ya tengo vendedor
        this.cargarRequerimientosDisponibles();
        this.cargarMisRequerimientos();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // ⚡ MÉTODO MEJORADO para cambiar secciones Y navegar
  setActiveSection(section: string): void {
    console.log('Cambiando a sección:', section);
    this.activeSection = section;
    console.log('activeSection ahora es:', this.activeSection);
    
    // ⭐ NAVEGAR A LA RUTA CORRESPONDIENTE
    switch(section) {
      case 'requerimientos':
        this.router.navigate(['/vendedor/requerimientos']);
        break;
      case 'proyectos':
        this.router.navigate(['/vendedor/proyectos']);
        break;
      case 'perfil':
        this.router.navigate(['/vendedor/mi-perfil']);
        break;
      case 'dashboard':
      default:
        this.router.navigate(['/vendedor/bienvenida']);
        break;
    }
  }

  // ⚡ MÉTODO ALTERNATIVO usando RouterLink directamente (recomendado)
  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  cargarRequerimientosDisponibles(): void {
    this.loading = true;
    this.error = '';
    
    let url = `${this.apiUrl}/requerimientos/vendedor/disponibles`;
    
    if (this.vendedorEspecialidad) {
      url += `?especialidad=${encodeURIComponent(this.vendedorEspecialidad)}`;
    }
    
    this.http.get<Requerimiento[]>(url).subscribe({
      next: (data) => {
        this.requerimientosDisponibles = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar requerimientos disponibles';
        this.loading = false;
        console.error(err);
        
        // DATOS DE PRUEBA si falla la API
        this.requerimientosDisponibles = [
          {
            id: 1,
            cliente_id: 101,
            vendedor_id: null,
            titulo: 'Sistema de Gestión Empresarial',
            mensaje: 'Necesitamos desarrollar un sistema completo para gestión de inventario y ventas',
            descripcion: 'Sistema completo con módulos de inventario, ventas y reportes',
            especialidad: 'Desarrollo de software a medida',
            estado: 'pendiente',
            fecha_creacion: new Date()
          },
          {
            id: 2,
            cliente_id: 102,
            vendedor_id: null,
            titulo: 'App Móvil para E-commerce',
            mensaje: 'Aplicación móvil para tienda online con pasarela de pagos',
            descripcion: 'App nativa para iOS y Android',
            especialidad: 'Desarrollo de software a medida',
            estado: 'pendiente',
            fecha_creacion: new Date()
          }
        ];
      }
    });
  }

  cargarMisRequerimientos(): void {
    if (!this.vendedor) return;
    
    this.http.get<Requerimiento[]>(`${this.apiUrl}/requerimientos/vendedor/${this.vendedor.id}`)
      .subscribe({
        next: (data) => {
          this.misRequerimientos = data;
        },
        error: (err) => {
          console.error('Error al cargar mis requerimientos:', err);
          
          // DATOS DE PRUEBA si falla la API
          this.misRequerimientos = [
            {
              id: 3,
              cliente_id: 103,
              vendedor_id: this.vendedor?.id || 1,
              titulo: 'Portal Web Corporativo',
              mensaje: 'Desarrollo de portal web para empresa',
              descripcion: 'Portal con sistema de usuarios y dashboard',
              especialidad: 'Desarrollo de software a medida',
              estado: 'en_proceso',
              fecha_creacion: new Date()
            }
          ];
        }
      });
  }

  tomarRequerimiento(requerimientoId: number): void {
    if (!this.vendedor) return;
    
    if (!confirm('¿Deseas tomar este requerimiento?')) {
      return;
    }

    this.http.put(`${this.apiUrl}/requerimientos/${requerimientoId}/asignar`, 
      null, 
      { params: { vendedor_id: this.vendedor.id.toString() } }
    ).subscribe({
      next: () => {
        alert('¡Requerimiento asignado exitosamente!');
        this.cargarRequerimientosDisponibles();
        this.cargarMisRequerimientos();
      },
      error: (err) => {
        alert('Error al tomar el requerimiento');
        console.error(err);
      }
    });
  }

  cambiarEstado(requerimientoId: number, event: any): void {
    const nuevoEstado = event.target.value;
    
    this.http.put(`${this.apiUrl}/requerimientos/${requerimientoId}/estado`, 
      null,
      { params: { nuevo_estado: nuevoEstado } }
    ).subscribe({
      next: () => {
        alert('Estado actualizado exitosamente');
        this.cargarMisRequerimientos();
      },
      error: (err) => {
        alert('Error al actualizar el estado');
        console.error(err);
      }
    });
  }

  // NUEVOS MÉTODOS para funcionalidades
  contarProyectosActivos(): number {
    return this.misRequerimientos.filter(req => 
      req.estado === 'asignado' || req.estado === 'en_proceso'
    ).length;
  }

  contarProyectosCompletados(): number {
    return this.misRequerimientos.filter(req => req.estado === 'completado').length;
  }

  obtenerIniciales(): string {
    if (!this.vendedor?.nombre) return 'V';
    
    return this.vendedor.nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  toggleNotificaciones(): void {
    alert('🔔 Tienes 3 nuevas notificaciones:\n\n• Nuevo proyecto disponible\n• Mensaje del cliente\n• Actualización de estado');
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'badge-warning',
      'asignado': 'badge-info',
      'en_proceso': 'badge-primary',
      'completado': 'badge-success',
      'cancelado': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }

  formatDate(fecha: Date | string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }
}