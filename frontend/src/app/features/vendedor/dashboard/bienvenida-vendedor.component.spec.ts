import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BienvenidaVendedorComponent } from './bienvenida-vendedor.component';

describe('BienvenidaVendedorComponent', () => {
  let component: BienvenidaVendedorComponent;
  let fixture: ComponentFixture<BienvenidaVendedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BienvenidaVendedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BienvenidaVendedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
