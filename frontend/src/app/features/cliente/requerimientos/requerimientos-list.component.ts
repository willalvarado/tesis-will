import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Update the import path to the correct relative location
import { RequerimientosService, Requerimiento } from '../../../core/services/requerimientos.service';

@Component({
  selector: 'app-requerimientos-list',
  templateUrl: './requerimientos-list.component.html',
  styleUrls: ['./requerimientos-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class RequerimientosListComponent implements OnInit {
  datos: Requerimiento[] = []; // aquí se guardan los requerimientos

  constructor(private req: RequerimientosService) {}

  ngOnInit(): void {
    const clienteId = 1; // 🔹 luego lo reemplazas por el ID real del cliente logueado
    this.req.listar(clienteId).subscribe(d => this.datos = d);
  }
}
