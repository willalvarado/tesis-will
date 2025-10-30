import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { BienvenidaVendedorComponent } from './pages/bienvenida-vendedor/bienvenida-vendedor.component';
import { BienvenidaClienteComponent } from './pages/bienvenida-cliente/bienvenida-cliente.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'bienvenida-vendedor', component: BienvenidaVendedorComponent },
  { path: 'cliente/bienvenida', component: BienvenidaClienteComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
