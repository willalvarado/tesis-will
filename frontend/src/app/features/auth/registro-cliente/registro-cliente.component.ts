import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './registro-cliente.component.html',
  styleUrls: ['./registro-cliente.component.css']
})
export class RegistroClienteComponent {
  formularioRegistro: FormGroup;
  errorRegistro: string | null = null;
  registroExitoso: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.formularioRegistro = this.fb.group({
      nombres: ['', Validators.required],      // Nuevo campo
      apellidos: ['', Validators.required],    // Nuevo campo
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.validarContrasenas });
  }

  // Getters actualizados
  get nombres() { return this.formularioRegistro.get('nombres'); }
  get apellidos() { return this.formularioRegistro.get('apellidos'); }
  get correo() { return this.formularioRegistro.get('correo'); }
  get contrasena() { return this.formularioRegistro.get('contrasena'); }
  get confirmarContrasena() { return this.formularioRegistro.get('confirmarContrasena'); }

  validarContrasenas(form: FormGroup) {
    const password = form.get('contrasena')?.value;
    const confirmPassword = form.get('confirmarContrasena')?.value;
    return password === confirmPassword ? null : { noCoinciden: true };
  }

  enviarRegistro() {
  if (this.formularioRegistro.invalid) return;

  // Combinar nombres y apellidos para mantener compatibilidad con el backend
  const nombreCompleto = `${this.nombres?.value} ${this.apellidos?.value}`.trim();

  const datos = {
    nombre: nombreCompleto,  // El backend espera "nombre" completo
    correo: this.correo?.value,
    contrasena: this.contrasena?.value,
    tipo: 'cliente'
  };

  this.http.post('http://localhost:8000/usuarios/registro', datos).subscribe({
    next: () => {
      // AÑADIR ESTAS LÍNEAS para guardar en localStorage:
      localStorage.setItem('userName', nombreCompleto);
      localStorage.setItem('userEmail', this.correo?.value);
      
      this.registroExitoso = '¡Registro exitoso! Redirigiendo al login...';
      this.errorRegistro = null;
      setTimeout(() => this.router.navigate(['/login']), 2000);
    },
    error: (err) => {
      this.errorRegistro = err.error.detail || 'Error al registrar usuario.';
      this.registroExitoso = null;
    }
  });
}
}