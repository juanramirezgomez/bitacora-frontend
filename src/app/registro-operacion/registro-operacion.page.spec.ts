import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroOperacionPage } from './registro-operacion.page';

describe('RegistroOperacionPage', () => {
  let component: RegistroOperacionPage;
  let fixture: ComponentFixture<RegistroOperacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroOperacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
