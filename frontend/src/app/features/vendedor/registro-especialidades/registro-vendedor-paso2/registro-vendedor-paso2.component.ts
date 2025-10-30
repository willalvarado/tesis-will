import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-vendedor-paso2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-vendedor-paso2.component.html',
  styleUrls: ['./registro-vendedor-paso2.component.css']
})
export class RegistroVendedorPaso2Component {
  
  /**
   * Array de categorías internacionales (CPC) para especialidades TI
   * Cada categoría contiene un título y una lista de opciones específicas
   */
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

  /**
   * Array que almacena los códigos de las especialidades seleccionadas por el usuario
   */
  especialidadesSeleccionadas: string[] = [];

  /**
   * Constructor - Inicializa el componente
   * @param router - Servicio de navegación de Angular
   */
  constructor(private router: Router) {}

  /**
   * Método para alternar la selección de una especialidad
   * Añade o quita una especialidad de la lista de seleccionadas
   * @param codigo - Código CPC de la especialidad a alternar
   */
  toggleSeleccion(codigo: string) {
    // Verificar si la especialidad ya está seleccionada
    const yaSeleccionada = this.especialidadesSeleccionadas.includes(codigo);
    
    if (yaSeleccionada) {
      // Si ya está seleccionada, la removemos de la lista
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(c => c !== codigo);
    } else {
      // Si no está seleccionada, la agregamos a la lista
      this.especialidadesSeleccionadas.push(codigo);
    }

    // Obtener los nombres completos de las especialidades seleccionadas
    // para mostrar en el formulario principal
    const seleccionados = this.categorias
      .flatMap(cat => cat.opciones)  // Aplanar todas las opciones de todas las categorías
      .filter(e => this.especialidadesSeleccionadas.includes(e.codigo))  // Filtrar solo las seleccionadas
      .map(e => e.nombre);  // Extraer solo los nombres

    // Guardar tanto los nombres como los códigos en localStorage
    // para que estén disponibles cuando el usuario regrese al formulario principal
    localStorage.setItem('especialidadesNombres', JSON.stringify(seleccionados));
    localStorage.setItem('especialidadesSeleccionadas', JSON.stringify(this.especialidadesSeleccionadas));
  }

  /**
   * Método para finalizar la selección y regresar al formulario principal
   * Guarda las selecciones en localStorage y navega de vuelta
   */
  finalizarRegistro() {
    // Guardar las especialidades seleccionadas en localStorage
    localStorage.setItem('especialidadesSeleccionadas', JSON.stringify(this.especialidadesSeleccionadas));
    
    // Navegar de vuelta al formulario principal de registro de vendedor
    this.router.navigate(['/registro-vendedor']);
  }
}