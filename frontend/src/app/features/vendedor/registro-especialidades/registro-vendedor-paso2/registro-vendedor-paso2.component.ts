import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-vendedor-paso2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-vendedor-paso2.component.html',
  styleUrls: ['./registro-vendedor-paso2.component.css']
})
export class RegistroVendedorPaso2Component implements OnInit {
  
  categorias = [
    {
      titulo: "Consultoría en TI",
      opciones: [
        { codigo: "83111", nombre: "Consultoría en desarrollo de sistemas" },
        { codigo: "83112", nombre: "Consultoría en hardware" },
        { codigo: "83113", nombre: "Consultoría en software" }
      ]
    },
    {
      titulo: "Desarrollo de software",
      opciones: [
        { codigo: "83131", nombre: "Desarrollo de software a medida" },
        { codigo: "83132", nombre: "Desarrollo y producción de software empaquetado" },
        { codigo: "83133", nombre: "Actualización y adaptación de software" }
      ]
    },
    {
      titulo: "Tratamiento de datos, alojamiento y nube",
      opciones: [
        { codigo: "83141", nombre: "Servicios de alojamiento de datos (hosting)" },
        { codigo: "83142", nombre: "Servicios de procesamiento de datos" },
        { codigo: "83143", nombre: "Servicios en la nube (cloud computing)" }
      ]
    },
    {
      titulo: "Otros servicios de TI",
      opciones: [
        { codigo: "83161", nombre: "Servicios de recuperación ante desastres" },
        { codigo: "83162", nombre: "Servicios de ciberseguridad" },
        { codigo: "83163", nombre: "Capacitación en TI" }
      ]
    }
  ];

  especialidadesSeleccionadas: string[] = [];

  constructor(private router: Router) {}

  // 🔥 NUEVO: Recuperar especialidades ya seleccionadas al cargar
  ngOnInit(): void {
    const guardadas = localStorage.getItem('especialidadesSeleccionadas');
    if (guardadas) {
      this.especialidadesSeleccionadas = JSON.parse(guardadas);
    }
  }

  toggleSeleccion(codigo: string) {
    const yaSeleccionada = this.especialidadesSeleccionadas.includes(codigo);
    
    if (yaSeleccionada) {
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(c => c !== codigo);
    } else {
      this.especialidadesSeleccionadas.push(codigo);
    }

    const seleccionados = this.categorias
      .flatMap(cat => cat.opciones)
      .filter(e => this.especialidadesSeleccionadas.includes(e.codigo))
      .map(e => e.nombre);

    localStorage.setItem('especialidadesNombres', JSON.stringify(seleccionados));
    localStorage.setItem('especialidadesSeleccionadas', JSON.stringify(this.especialidadesSeleccionadas));
  }

  finalizarRegistro() {
    localStorage.setItem('especialidadesSeleccionadas', JSON.stringify(this.especialidadesSeleccionadas));
    this.router.navigate(['/registro-vendedor']);
  }
}