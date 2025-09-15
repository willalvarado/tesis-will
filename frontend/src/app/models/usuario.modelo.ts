export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  tipo: string;
  especialidades?: string[];  // Agregar esta línea si los vendedores tienen especialidades
}