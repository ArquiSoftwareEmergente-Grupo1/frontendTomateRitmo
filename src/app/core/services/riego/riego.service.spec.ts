import { TestBed } from '@angular/core/testing';

import { RiegoService } from './riego.service';

describe('RiegoService', () => {
  let service: RiegoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RiegoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
