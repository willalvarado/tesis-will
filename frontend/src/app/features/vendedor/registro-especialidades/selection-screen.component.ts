import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-selection-screen',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Bienvenido al Sistema</h1>
        <p>Por favor seleccione una opción</p>
      </div>
      
      <div class="options">
        <a [routerLink]="['/register-client']" class="option client">
          <div class="icon">🔵</div>
          <h2>Registrarse como Cliente</h2>
          <p>Crea una cuenta para buscar servicios y productos</p>
        </a>
        
        <a [routerLink]="['/register-vendor']" class="option vendor">
          <div class="icon">🟠</div>
          <h2>Registrarse como Vendedor</h2>
          <p>Crea una cuenta para ofrecer tus servicios o productos</p>
        </a>
        
        <a [routerLink]="['/login']" class="option login">
          <div class="icon">🔐</div>
          <h2>Iniciar Sesión</h2>
          <p>Ingresa a tu cuenta existente</p>
        </a>
      </div>
    </div>
  `,
  styles: `
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: Arial, sans-serif;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .header h1 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .header p {
      font-size: 1.2rem;
      color: #666;
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      border-radius: 8px;
      background-color: #f5f5f5;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .option:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .option h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .option p {
      text-align: center;
      color: #666;
    }
    
    .client:hover {
      background-color: #e6f7ff;
    }
    
    .vendor:hover {
      background-color: #fff7e6;
    }
    
    .login:hover {
      background-color: #f0f0f0;
    }
    
    @media (min-width: 768px) {
      .options {
        flex-direction: row;
      }
      
      .option {
        flex: 1;
      }
    }
  `
})
export class SelectionScreenComponent {}

// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'vendor';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: any[] = [];
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  constructor() {
    // Cargar usuarios del localStorage si existen
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    }
    
    // Verificar si hay una sesión activa
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      this.currentUserSubject.next(JSON.parse(currentUser));
    }
  }
  
  registerClient(userData: any): boolean {
    // Verificar si el email ya existe
    if (this.users.some(user => user.email === userData.email)) {
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      type: 'client'
    };
    
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    return true;
  }
  
  registerVendor(userData: any): boolean {
    // Verificar si el email ya existe
    if (this.users.some(user => user.email === userData.email)) {
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      type: 'vendor'
    };
    
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    return true;
  }
  
  login(email: string, password: string): boolean {
    const user = this.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      this.currentUserSubject.next(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  }
  
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }
  
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}