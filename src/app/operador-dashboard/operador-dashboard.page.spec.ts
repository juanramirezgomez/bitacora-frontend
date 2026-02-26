import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperadorDashboardPage } from './operador-dashboard.page';

describe('OperadorDashboardPage', () => {
  let component: OperadorDashboardPage;
  let fixture: ComponentFixture<OperadorDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OperadorDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
