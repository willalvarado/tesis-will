import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const usuario = localStorage.getItem('usuario');
  
  // Si NO hay usuario en localStorage, redirigir a login
  if (!usuario) {
    console.warn('⚠️ No hay sesión activa. Redirigiendo a login...');
    router.navigate(['/login']);
    return false;
  }
  
  try {
    // Verificar que el tipo de usuario coincida con la ruta
    const user = JSON.parse(usuario);
    const tipoRequerido = route.data['tipoUsuario'];
    
    if (tipoRequerido && user.tipo !== tipoRequerido) {
      console.warn(`⚠️ Usuario tipo "${user.tipo}" intentó acceder a ruta de "${tipoRequerido}"`);
      router.navigate(['/login']);
      return false;
    }
    
    console.log(`✅ Acceso permitido a ${state.url}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error al verificar sesión:', error);
    router.navigate(['/login']);
    return false;
  }
};