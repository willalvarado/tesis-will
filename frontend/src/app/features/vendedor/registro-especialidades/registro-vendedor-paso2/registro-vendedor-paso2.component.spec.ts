import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroVendedorPaso2Component } from './registro-vendedor-paso2.component';

describe('RegistroVendedorPaso2Component', () => {
  let component: RegistroVendedorPaso2Component;
  let fixture: ComponentFixture<RegistroVendedorPaso2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroVendedorPaso2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroVendedorPaso2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
