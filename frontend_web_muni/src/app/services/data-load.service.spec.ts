import { TestBed } from '@angular/core/testing';

import { DataLoadService } from './data-load.service';

describe('DataLoadService', () => {
  let service: DataLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataLoadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
