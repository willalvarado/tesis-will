import { Routes } from '@angular/router';
import { authGuard } from './core/services/guards/auth.guard';

export const routes: Routes = [
  // ========================================
  // RUTAS PÚBLICAS (sin protección)
  // ========================================
  { 
    path: '', 
    loadComponent: () => import('./features/shared/inicio.component').then(m => m.InicioComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'registro-cliente', 
    loadComponent: () => import('./features/auth/registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent) 
  },
  { 
    path: 'registro-vendedor', 
    loadComponent: () => import('./features/auth/registro-vendedor/registro-vendedor.component').then(m => m.RegistroVendedorComponent) 
  },
  { 
    path: 'registro-especialidades', 
    loadComponent: () => import('./features/vendedor/registro-especialidades/registro-vendedor-paso2/registro-vendedor-paso2.component').then(m => m.RegistroVendedorPaso2Component) 
  },

  // ========================================
  // 🔒 RUTAS PROTEGIDAS - CLIENTE
  // ========================================
  { 
    path: 'cliente/bienvenida', 
    loadComponent: () => import('./features/cliente/dashboard/bienvenida-cliente.component').then(m => m.BienvenidaClienteComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/chat-asistente', 
    loadComponent: () => import('./features/cliente/chat-asistente/chat-asistente.component').then(m => m.ChatAsistenteComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/requerimientos', 
    loadComponent: () => import('./features/cliente/requerimientos/requerimientos-list.component').then(m => m.RequerimientosListComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/ayuda', 
    loadComponent: () => import('./features/cliente/ayuda/ayuda.component').then(m => m.AyudaComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/mi-perfil', 
    loadComponent: () => import('./features/cliente/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/chat/:id', 
    loadComponent: () => import('./features/cliente/chat-proyecto/chat-proyecto.component').then(m => m.ChatProyectoComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/proyecto/:id', 
    loadComponent: () => import('./features/cliente/detalle-proyecto/detalle-proyecto.component').then(m => m.DetalleProyectoComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },
  { 
    path: 'cliente/subtarea/:id', 
    loadComponent: () => import('./features/cliente/chat-subtarea/chat-subtarea.component').then(m => m.ChatSubtareaComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'cliente' }
  },

  // ========================================
  // 🔒 RUTAS PROTEGIDAS - VENDEDOR
  // ========================================
  { 
    path: 'vendedor/bienvenida', 
    loadComponent: () => import('./features/vendedor/dashboard/bienvenida-vendedor.component').then(m => m.BienvenidaVendedorComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  { 
    path: 'vendedor/requerimientos', 
    loadComponent: () => import('./features/vendedor/requerimientos/requerimientos.component').then(m => m.RequerimientoComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  { 
    path: 'vendedor/mis-proyectos', 
    loadComponent: () => import('./features/vendedor/mis-proyectos/estado-proyectos.component').then(m => m.EstadoProyectosComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  { 
    path: 'vendedor/mi-perfil', 
    loadComponent: () => import('./features/vendedor/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  {
    path: 'vendedor/proyecto/:id',
    loadComponent: () => import('./features/vendedor/detalle-proyecto/detalle-proyecto-vendedor.component').then(m => m.DetalleProyectoVendedorComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  {
    path: 'vendedor/subtarea/:id',
    loadComponent: () => import('./features/vendedor/chat-subtarea-vendedor/chat-subtarea-vendedor.component').then(m => m.ChatSubtareaVendedorComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },
  { 
    path: 'vendedor/historial', 
    loadComponent: () => import('./features/vendedor/historial/historial.component').then(m => m.HistorialVendedorComponent),
    canActivate: [authGuard],
    data: { tipoUsuario: 'vendedor' }
  },

  // ========================================
  // Dashboard genérico (opcional - puede ser protegido o público)
  // ========================================
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // ========================================
  // Redirección para rutas no encontradas
  // ========================================
  { path: '**', redirectTo: '' }
];