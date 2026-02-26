import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BitacorasPage } from './bitacoras.page';

describe('BitacorasPage', () => {
  let component: BitacorasPage;
  let fixture: ComponentFixture<BitacorasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BitacorasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
