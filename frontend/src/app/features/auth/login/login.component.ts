import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServicioAuth } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: ServicioAuth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

onSubmit() {
  if (this.loginForm.invalid) return;

  const { email, password } = this.loginForm.value;

  this.authService.iniciarSesion(email, password).subscribe({
    next: (res) => {
      // Normalizamos la respuesta
      const userData = res.usuario || res; 

      const tipoUsuario = userData.tipo?.toLowerCase();
      console.log('✅ Tipo de usuario:', tipoUsuario);

      // AÑADIR ESTAS LÍNEAS para guardar en localStorage:
      localStorage.setItem('userName', userData.nombre);
      localStorage.setItem('userEmail', userData.correo);

      this.authService.setUsuarioActual({
        id: userData.id,
        nombre: userData.nombre,
        correo: userData.correo,
        tipo: tipoUsuario
      });

      if (tipoUsuario === 'cliente') {
        this.router.navigate(['/cliente/bienvenida']);
      } else if (tipoUsuario === 'vendedor') {
        this.router.navigate(['/vendedor/bienvenida']);
      } else {
        this.loginError = 'Tipo de usuario desconocido.';
      }
    },
    error: () => {
      this.loginError = 'Credenciales incorrectas.';
    }
  });
}
}