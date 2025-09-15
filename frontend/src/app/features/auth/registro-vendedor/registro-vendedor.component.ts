import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServicioAuth } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-registro-vendedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro-vendedor.component.html',
  styleUrls: ['./registro-vendedor.component.css']
})
export class RegistroVendedorComponent implements OnInit {
  
  formularioRegistro: FormGroup;
  errorRegistro: string | null = null;
  registroExitoso: string | null = null;

  // Arrays para manejar especialidades
  opcionesEspecialidades: string[] = [
    'Tecnología',
    'Ropa y Accesorios', 
    'Hogar y Decoración',
    'Alimentos y Bebidas',
    'Servicios Profesionales',
    'Otros'
  ];

  especialidadesSeleccionadas: string[] = [];

  /**
   * Constructor - Inicializa el componente y configura el formulario reactivo
   * @param fb - FormBuilder para crear formularios reactivos
   * @param http - HttpClient para realizar peticiones HTTP al backend
   * @param servicioAuth - Servicio de autenticación personalizado
   * @param router - Router para navegación entre páginas
   */
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private servicioAuth: ServicioAuth,
    private router: Router
  ) {
    // Crear formulario con validaciones específicas para vendedor
    this.formularioRegistro = this.fb.group({
      nombreEmpresa: ['', Validators.required], // Nombre de empresa o personal
      correo: ['', [Validators.required, Validators.email]], // Email con validación
      especialidades: [[], Validators.required], // Array de especialidades requerido
      contrasena: ['', [Validators.required, Validators.minLength(6)]], // Contraseña mínimo 6 caracteres
      confirmarContrasena: ['', Validators.required] // Confirmación de contraseña
    }, { validators: this.validarContrasenas }); // Validador personalizado para contraseñas
  }

  /**
   * Método ngOnInit - Se ejecuta al inicializar el componente
   * Recupera las especialidades seleccionadas del localStorage si existen
   */
  ngOnInit() {
    // Recuperar especialidades desde localStorage (viene de página de selección)
    const recuperadas = localStorage.getItem('especialidadesSeleccionadas');
    const nombres = localStorage.getItem('especialidadesNombres');

    // Si hay especialidades guardadas, cargarlas en el formulario
    if (recuperadas) {
      this.formularioRegistro.get('especialidades')?.setValue(JSON.parse(nombres || '[]'));
    }
  }

  /**
   * Getters - Facilitan el acceso a los controles del formulario en el HTML
   */
  get nombreEmpresa() { return this.formularioRegistro.get('nombreEmpresa'); }
  get correo() { return this.formularioRegistro.get('correo'); }
  get especialidades() { return this.formularioRegistro.get('especialidades'); }
  get contrasena() { return this.formularioRegistro.get('contrasena'); }
  get confirmarContrasena() { return this.formularioRegistro.get('confirmarContrasena'); }

  /**
   * Validador personalizado - Verifica que las contraseñas coincidan
   * @param form - FormGroup que contiene los campos del formulario
   * @returns null si las contraseñas coinciden, objeto con error si no coinciden
   */
  validarContrasenas(form: FormGroup) {
    const password = form.get('contrasena')?.value;
    const confirmPassword = form.get('confirmarContrasena')?.value;
    return password === confirmPassword ? null : { noCoinciden: true };
  }

  /**
   * Método principal - Procesa el envío del formulario de registro
   * Envía datos al backend usando el servicio de autenticación
   */
  enviarRegistro() {
    // Verificar si el formulario es válido antes de enviar
    if (this.formularioRegistro.invalid) return;

    // Preparar datos para enviar al backend
    const datos = {
      nombreEmpresa: this.nombreEmpresa?.value,
      correo: this.correo?.value,
      contrasena: this.contrasena?.value,
      especialidades: this.especialidades?.value
    };

    // Usar el servicio de autenticación para registrar vendedor
    this.servicioAuth.registrarVendedor(datos).subscribe({
      next: () => {
        // Caso exitoso: mostrar mensaje y redirigir al login
        this.registroExitoso = '¡Registro exitoso! Redirigiendo al login...';
        this.errorRegistro = null;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        // Caso de error: mostrar mensaje de error al usuario
        this.errorRegistro = err.error?.detail || 'Error al registrar vendedor.';
        this.registroExitoso = null;
      }
    });
  }

  /**
   * Método para actualizar especialidades - Maneja select múltiple
   * @param event - Evento del elemento select
   */
  actualizarEspecialidades(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValues: string[] = [];

    // Recorrer todas las opciones del select y obtener las seleccionadas
    for (let i = 0; i < selectElement.options.length; i++) {
      const option = selectElement.options[i];
      if (option.selected) {
        selectedValues.push(option.value);
      }
    }

    // Actualizar el valor en el formulario
    this.formularioRegistro.get('especialidades')?.setValue(selectedValues);
  }

  /**
   * Método para manejar checkboxes - Alterna especialidades seleccionadas
   * @param event - Evento del checkbox
   */
  toggleEspecialidad(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const valor = checkbox.value;

    if (checkbox.checked) {
      // Agregar especialidad si se marca el checkbox
      this.especialidadesSeleccionadas.push(valor);
    } else {
      // Quitar especialidad si se desmarca el checkbox
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(item => item !== valor);
    }

    // Actualizar el formulario con las especialidades seleccionadas
    this.formularioRegistro.get('especialidades')?.setValue(this.especialidadesSeleccionadas);
  }
}