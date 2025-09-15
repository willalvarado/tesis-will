import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators  } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mi-perfil-vendedor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="perfil-container">
      <div class="header">
        <h1>Mi Perfil de Vendedor</h1>
        <p>Gestiona tu información profesional y servicios</p>
      </div>

      <div class="content">
        <!-- Avatar y Info Básica -->
        <div class="perfil-card">
          <div class="avatar-section">
            <div class="avatar">
              <span>{{ getInitials() }}</span>
            </div>
            <div class="basic-info">
              <h2>{{ perfilForm.get('nombre')?.value || 'Vendedor' }}</h2>
              <p class="email">{{ perfilForm.get('correo')?.value }}</p>
              <p class="especialidad">{{ perfilForm.get('especialidad')?.value || 'Especialista' }}</p>
              <span class="badge-stars">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>

        <!-- Formulario de Edición -->
        <div class="form-card">
          <h3>Información Profesional</h3>
          
          <form [formGroup]="perfilForm" (ngSubmit)="guardarCambios()" class="perfil-form">
            
            <!-- Nombre -->
            <div class="form-group">
              <label for="nombre">Nombre Completo</label>
              <input 
                type="text" 
                id="nombre" 
                formControlName="nombre" 
                class="form-control"
                placeholder="Tu nombre completo"
              >
              <div *ngIf="perfilForm.get('nombre')?.invalid && perfilForm.get('nombre')?.touched" class="error-message">
                El nombre es obligatorio
              </div>
            </div>

            <!-- Correo (Solo lectura) -->
            <div class="form-group">
              <label for="correo">Correo Electrónico</label>
              <input 
                type="email" 
                id="correo" 
                formControlName="correo" 
                class="form-control readonly"
                readonly
              >
              <small class="form-help">El correo no se puede modificar</small>
            </div>

            <!-- Especialidad -->
            <div class="form-group">
              <label for="especialidad">Especialidad</label>
              <select 
                id="especialidad" 
                formControlName="especialidad" 
                class="form-control"
              >
                <option value="">Selecciona tu especialidad</option>
                <option value="Programación y Desarrollo">Programación y Desarrollo</option>
                <option value="Diseño Gráfico">Diseño Gráfico</option>
                <option value="Marketing Digital">Marketing Digital</option>
                <option value="Consultoría Empresarial">Consultoría Empresarial</option>
                <option value="Traducción">Traducción</option>
                <option value="Redacción y Copywriting">Redacción y Copywriting</option>
                <option value="Fotografía y Video">Fotografía y Video</option>
                <option value="Contabilidad">Contabilidad</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <!-- Teléfono -->
            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input 
                type="tel" 
                id="telefono" 
                formControlName="telefono" 
                class="form-control"
                placeholder="Ej: +593 99 123 4567"
              >
            </div>

            <!-- Dirección -->
            <div class="form-group">
              <label for="direccion">Dirección</label>
              <input 
                type="text" 
                id="direccion" 
                formControlName="direccion" 
                class="form-control"
                placeholder="Tu dirección completa"
              >
            </div>

            <!-- Ciudad -->
            <div class="form-group">
              <label for="ciudad">Ciudad</label>
              <input 
                type="text" 
                id="ciudad" 
                formControlName="ciudad" 
                class="form-control"
                placeholder="Tu ciudad"
              >
            </div>

            <!-- Años de Experiencia -->
            <div class="form-group">
              <label for="experiencia">Años de Experiencia</label>
              <select 
                id="experiencia" 
                formControlName="experiencia" 
                class="form-control"
              >
                <option value="">Selecciona tu experiencia</option>
                <option value="0-1">0-1 años</option>
                <option value="2-3">2-3 años</option>
                <option value="4-5">4-5 años</option>
                <option value="6-10">6-10 años</option>
                <option value="10+">Más de 10 años</option>
              </select>
            </div>

            <!-- Precio por Hora -->
            <div class="form-group">
              <label for="precioHora">Precio por Hora (USD)</label>
              <input 
                type="number" 
                id="precioHora" 
                formControlName="precioHora" 
                class="form-control"
                placeholder="Ej: 25"
                min="5"
              >
            </div>

            <!-- Biografía Profesional -->
            <div class="form-group">
              <label for="biografia">Biografía Profesional</label>
              <textarea 
                id="biografia" 
                formControlName="biografia" 
                class="form-control textarea"
                placeholder="Describe tu experiencia, habilidades y servicios que ofreces..."
                rows="4"
              ></textarea>
            </div>

            <!-- Habilidades -->
            <div class="form-group">
              <label for="habilidades">Habilidades Principales</label>
              <input 
                type="text" 
                id="habilidades" 
                formControlName="habilidades" 
                class="form-control"
                placeholder="Ej: JavaScript, React, Node.js, MongoDB"
              >
              <small class="form-help">Separa las habilidades con comas</small>
            </div>

            <!-- Disponibilidad -->
            <div class="form-group">
              <label for="disponibilidad">Disponibilidad</label>
              <select 
                id="disponibilidad" 
                formControlName="disponibilidad" 
                class="form-control"
              >
                <option value="">Selecciona tu disponibilidad</option>
                <option value="tiempo-completo">Tiempo Completo</option>
                <option value="medio-tiempo">Medio Tiempo</option>
                <option value="freelance">Freelance</option>
                <option value="fines-de-semana">Solo Fines de Semana</option>
              </select>
            </div>

            <!-- Botones -->
            <div class="form-actions">
              <button 
                type="submit" 
                [disabled]="perfilForm.invalid || guardando"
                class="btn btn-primary"
              >
                <span *ngIf="!guardando">Guardar Cambios</span>
                <span *ngIf="guardando">Guardando...</span>
              </button>
              
              <button 
                type="button" 
                (click)="cancelarCambios()"
                class="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>

            <!-- Mensaje de éxito/error -->
            <div *ngIf="mensajeExito" class="success-message">
              {{ mensajeExito }}
            </div>
            <div *ngIf="mensajeError" class="error-message">
              {{ mensajeError }}
            </div>
          </form>
        </div>

        <!-- Estadísticas del Vendedor -->
        <div class="stats-card">
          <h3>Estadísticas de Vendedor</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">15</div>
              <div class="stat-label">Proyectos Completados</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">4.8</div>
              <div class="stat-label">Calificación Promedio</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">92%</div>
              <div class="stat-label">Tasa de Éxito</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">$2,450</div>
              <div class="stat-label">Ingresos Este Mes</div>
            </div>
          </div>
        </div>

        <!-- Botón de regreso -->
        <div class="back-section">
          <button class="btn-back" [routerLink]="['/vendedor/bienvenida']">
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .especialidad {
      color: #667eea;
      font-weight: 600;
      margin: 5px 0;
      font-size: 1rem;
    }

    .badge-stars {
      background: linear-gradient(135deg, #f8f6f4ff, #0a0a0aff);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .perfil-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 40px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    /* Avatar Card */
    .perfil-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 25px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .basic-info h2 {
      color: #333;
      margin: 0 0 8px 0;
      font-size: 1.8rem;
    }

    .email {
      color: #666;
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }

    /* Form Card */
    .form-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .form-card h3 {
      color: #333;
      font-size: 1.5rem;
      margin-bottom: 25px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .perfil-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group:nth-child(9),
    .form-group:nth-child(10),
    .form-group:nth-child(11) {
      grid-column: 1 / -1;
    }

    .form-group label {
      color: #333;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .form-control {
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.readonly {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }

    .textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-help {
      color: #666;
      font-size: 0.85rem;
      margin-top: 5px;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 5px;
    }

    .success-message {
      background: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #c3e6cb;
      margin-top: 15px;
      grid-column: 1 / -1;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 15px;
      margin-top: 25px;
      grid-column: 1 / -1;
    }

    .btn {
      padding: 12px 25px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 140px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #6c757d;
      border: 2px solid #e0e0e0;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }

    /* Stats Card */
    .stats-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .stats-card h3 {
      color: #333;
      font-size: 1.5rem;
      margin-bottom: 20px;
      border-bottom: 2px solid #764ba2;
      padding-bottom: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 1px solid #e0e0e0;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 5px;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Back Button */
    .back-section {
      text-align: center;
      margin-top: 20px;
    }

    .btn-back {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-back:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .perfil-container {
        padding: 15px;
        max-width: 100%;
      }

      .perfil-form {
        grid-template-columns: 1fr;
      }

      .form-group:nth-child(9),
      .form-group:nth-child(10),
      .form-group:nth-child(11) {
        grid-column: 1;
      }

      .avatar-section {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }

      .form-actions {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header h1 {
        font-size: 2rem;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class MiPerfilComponent implements OnInit {
  perfilForm: FormGroup;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      especialidad: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      ciudad: [''],
      experiencia: [''],
      precioHora: ['', [Validators.min(5)]],
      biografia: [''],
      habilidades: [''],
      disponibilidad: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosVendedor();
  }

  cargarDatosVendedor(): void {
    // Obtener datos reales del localStorage o del servicio de auth
    const datosReales = {
      nombre: localStorage.getItem('vendorName') || 'Vendedor Demo',
      correo: localStorage.getItem('vendorEmail') || 'vendedor@empresa.com',
      especialidad: localStorage.getItem('vendorEspecialidad') || 'Programación y Desarrollo',
      telefono: localStorage.getItem('vendorPhone') || '',
      direccion: localStorage.getItem('vendorAddress') || '',
      ciudad: localStorage.getItem('vendorCity') || '',
      experiencia: localStorage.getItem('vendorExperiencia') || '',
      precioHora: localStorage.getItem('vendorPrecioHora') || '',
      biografia: localStorage.getItem('vendorBio') || '',
      habilidades: localStorage.getItem('vendorHabilidades') || '',
      disponibilidad: localStorage.getItem('vendorDisponibilidad') || ''
    };

    this.perfilForm.patchValue(datosReales);
  }

  getInitials(): string {
    const nombre = this.perfilForm.get('nombre')?.value || 'Vendedor';
    return nombre
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  guardarCambios(): void {
    if (this.perfilForm.invalid) return;

    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    // Simular llamada al backend
    setTimeout(() => {
      try {
        // Aquí harías la llamada real al backend:
        // this.http.put('/api/vendedor/perfil', this.perfilForm.value).subscribe(...)
        
        // Guardar solo los campos editables en localStorage
        const formData = this.perfilForm.value;
        const editableFields = ['telefono', 'direccion', 'ciudad', 'experiencia', 'precioHora', 'biografia', 'habilidades', 'disponibilidad'];
        
        editableFields.forEach(field => {
          localStorage.setItem(field, formData[field] || '');
        });
        
        // También actualizar el nombre en el usuario si cambió
        const userData = localStorage.getItem('usuario');
        if (userData) {
          const usuario = JSON.parse(userData);
          usuario.nombre = formData.nombre;
          localStorage.setItem('usuario', JSON.stringify(usuario));
        }
        
        this.mensajeExito = 'Perfil de vendedor actualizado correctamente';
        this.guardando = false;
      } catch (error) {
        this.mensajeError = 'Error al guardar los cambios';
        this.guardando = false;
      }
    }, 1500);
  }

  cancelarCambios(): void {
    this.cargarDatosVendedor();
    this.mensajeExito = '';
    this.mensajeError = '';
  }
}