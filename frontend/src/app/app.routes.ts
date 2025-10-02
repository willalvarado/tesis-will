import { Routes } from '@angular/router';

export const routes: Routes = [
  // Página principal (shared)
  { 
    path: '', 
    loadComponent: () => import('./features/shared/inicio.component').then(m => m.InicioComponent) 
  },

  // Autenticación
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

  // Dashboard genérico (mantener por compatibilidad)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },

  // === RUTAS CLIENTE ===
// === RUTAS CLIENTE ===
{ 
  path: 'cliente/bienvenida', 
  loadComponent: () => import('./features/cliente/dashboard/bienvenida-cliente.component').then(m => m.BienvenidaClienteComponent) 
},
{ 
  path: 'cliente/chat-asistente', 
  loadComponent: () => import('./features/cliente/chat-asistente/chat-asistente.component').then(m => m.ChatAsistenteComponent) 
},
{ 
  path: 'cliente/requerimientos', 
  loadComponent: () => import('./features/cliente/requerimientos/requerimientos-list.component').then(m => m.RequerimientosListComponent) 
},
{ 
  path: 'cliente/estado-proyectos', 
  loadComponent: () => import('./features/cliente/estado-proyectos/estado-proyectos.component').then(m => m.EstadoProyectosComponent) 
},
{ 
  path: 'cliente/ayuda', 
  loadComponent: () => import('./features/cliente/ayuda/ayuda.component').then(m => m.AyudaComponent) 
},
{ 
  path: 'cliente/mi-perfil', 
  loadComponent: () => import('./features/cliente/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent) 
},

  // === RUTAS VENDEDOR ===
{ 
  path: 'vendedor/bienvenida', 
  loadComponent: () => import('./features/vendedor/dashboard/bienvenida-vendedor.component').then(m => m.BienvenidaVendedorComponent) 
},
{ 
  path: 'vendedor/requerimientos', 
  loadComponent: () => import('./features/vendedor/requerimientos/requerimientos.component').then(m => m.RequerimientoComponent) 
},
{ 
  path: 'vendedor/mis-proyectos', 
  loadComponent: () => import('./features/vendedor/mis-proyectos/estado-proyectos.component').then(m => m.EstadoProyectosComponent) 
},
{ 
  path: 'vendedor/mi-perfil', 
  loadComponent: () => import('./features/vendedor/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent) 
},

// Redirección para rutas no encontradas
 { path: '**', redirectTo: '' }
];
