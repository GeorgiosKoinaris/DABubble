import { TestBed } from '@angular/core/testing';

import { ThreadService } from './thread.service';

describe('OpenThreadService', () => {
  let service: ThreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
