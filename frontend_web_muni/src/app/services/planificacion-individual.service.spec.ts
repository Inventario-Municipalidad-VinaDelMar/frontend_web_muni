import { TestBed } from '@angular/core/testing';

import { PlanificacionIndividualService } from './planificacion-individual.service';

describe('PlanificacionIndividualService', () => {
  let service: PlanificacionIndividualService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanificacionIndividualService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
