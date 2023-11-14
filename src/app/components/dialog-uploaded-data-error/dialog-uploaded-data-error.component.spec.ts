import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogUploadedDataErrorComponent } from './dialog-uploaded-data-error.component';

describe('DialogUploadedDataErrorComponent', () => {
  let component: DialogUploadedDataErrorComponent;
  let fixture: ComponentFixture<DialogUploadedDataErrorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogUploadedDataErrorComponent]
    });
    fixture = TestBed.createComponent(DialogUploadedDataErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
