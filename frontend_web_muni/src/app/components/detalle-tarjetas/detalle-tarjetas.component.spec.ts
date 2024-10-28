import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleTarjetasComponent } from './detalle-tarjetas.component';

describe('DetalleTarjetasComponent', () => {
  let component: DetalleTarjetasComponent;
  let fixture: ComponentFixture<DetalleTarjetasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTarjetasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleTarjetasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
