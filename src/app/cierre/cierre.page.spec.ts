import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CierrePage } from './cierre.page';

describe('CierrePage', () => {
  let component: CierrePage;
  let fixture: ComponentFixture<CierrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CierrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
