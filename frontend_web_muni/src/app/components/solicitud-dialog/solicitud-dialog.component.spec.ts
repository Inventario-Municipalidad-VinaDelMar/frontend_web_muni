import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudDialogComponent } from './solicitud-dialog.component';

describe('SolicitudDialogComponent', () => {
  let component: SolicitudDialogComponent;
  let fixture: ComponentFixture<SolicitudDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SolicitudDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
