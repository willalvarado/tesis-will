import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ServicioAuth } from '../../core/services/auth.service';

// Asegúrate de que la ruta de importación sea correcta
import { RegistroClienteComponent } from './registro-cliente.component';

describe('RegistroClienteComponent', () => {
  let component: RegistroClienteComponent;
  let fixture: ComponentFixture<RegistroClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistroClienteComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        ServicioAuth
        // Otros servicios que necesites
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});