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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private servicioAuth: ServicioAuth,
    private router: Router
  ) {
    this.formularioRegistro = this.fb.group({
      nombreEmpresa: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      especialidades: [[], Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.validarContrasenas });
  }

  ngOnInit() {
    // Recuperar especialidades desde localStorage
    const recuperadas = localStorage.getItem('especialidadesSeleccionadas');
    const nombres = localStorage.getItem('especialidadesNombres');

    if (recuperadas) {
      this.formularioRegistro.get('especialidades')?.setValue(JSON.parse(nombres || '[]'));
    }

    // 🔥 NUEVO: Recuperar datos del formulario si existen
    this.recuperarDatosTemporales();
  }

  get nombreEmpresa() { return this.formularioRegistro.get('nombreEmpresa'); }
  get correo() { return this.formularioRegistro.get('correo'); }
  get especialidades() { return this.formularioRegistro.get('especialidades'); }
  get contrasena() { return this.formularioRegistro.get('contrasena'); }
  get confirmarContrasena() { return this.formularioRegistro.get('confirmarContrasena'); }

  validarContrasenas(form: FormGroup) {
    const password = form.get('contrasena')?.value;
    const confirmPassword = form.get('confirmarContrasena')?.value;
    return password === confirmPassword ? null : { noCoinciden: true };
  }

  // 🔥 NUEVO: Guardar datos temporales antes de ir a especialidades
  guardarDatosTemporales(): void {
    const datosTemporales = {
      nombreEmpresa: this.nombreEmpresa?.value || '',
      correo: this.correo?.value || '',
      contrasena: this.contrasena?.value || '',
      confirmarContrasena: this.confirmarContrasena?.value || ''
    };
    
    localStorage.setItem('datosRegistroTemporal', JSON.stringify(datosTemporales));
  }

  // 🔥 NUEVO: Recuperar datos temporales al volver de especialidades
  recuperarDatosTemporales(): void {
    const datosGuardados = localStorage.getItem('datosRegistroTemporal');
    
    if (datosGuardados) {
      const datos = JSON.parse(datosGuardados);
      
      this.formularioRegistro.patchValue({
        nombreEmpresa: datos.nombreEmpresa,
        correo: datos.correo,
        contrasena: datos.contrasena,
        confirmarContrasena: datos.confirmarContrasena
      });
    }
  }

  enviarRegistro() {
    if (this.formularioRegistro.invalid) return;

    const datos = {
      nombreEmpresa: this.nombreEmpresa?.value,
      correo: this.correo?.value,
      contrasena: this.contrasena?.value,
      especialidades: this.especialidades?.value
    };

    this.servicioAuth.registrarVendedor(datos).subscribe({
      next: () => {
        this.registroExitoso = '¡Registro exitoso! Redirigiendo al login...';
        this.errorRegistro = null;
        
        // 🔥 NUEVO: Limpiar localStorage después de registro exitoso
        localStorage.removeItem('datosRegistroTemporal');
        localStorage.removeItem('especialidadesSeleccionadas');
        localStorage.removeItem('especialidadesNombres');
        
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.errorRegistro = err.error?.detail || 'Error al registrar vendedor.';
        this.registroExitoso = null;
      }
    });
  }

  actualizarEspecialidades(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValues: string[] = [];

    for (let i = 0; i < selectElement.options.length; i++) {
      const option = selectElement.options[i];
      if (option.selected) {
        selectedValues.push(option.value);
      }
    }

    this.formularioRegistro.get('especialidades')?.setValue(selectedValues);
  }

  toggleEspecialidad(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const valor = checkbox.value;

    if (checkbox.checked) {
      this.especialidadesSeleccionadas.push(valor);
    } else {
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(item => item !== valor);
    }

    this.formularioRegistro.get('especialidades')?.setValue(this.especialidadesSeleccionadas);
  }
}