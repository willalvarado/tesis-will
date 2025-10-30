import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component'; // Asegúrate de importar AppComponent
import { LoginComponent } from './features/login/login.component';
import { RegistroClienteComponent } from './features/registro-cliente/registro-cliente.component';
import { RegistroVendedorComponent } from './features/registro-vendedor/registro-vendedor.component';
import { ChatbotComponent } from './features/chatbot/chatbot.component';

@NgModule({
  declarations: [
    AppComponent, // Añade AppComponent aquí
    LoginComponent,
    RegistroClienteComponent,
    RegistroVendedorComponent,
    ChatbotComponent




  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent] // Especifica AppComponent como componente de arranque
})
export class AppModule { }
