import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDataUploadSuccessfulComponent } from './dialog-data-upload-successful.component';

describe('DialogDataUploadSuccessfulComponent', () => {
  let component: DialogDataUploadSuccessfulComponent;
  let fixture: ComponentFixture<DialogDataUploadSuccessfulComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogDataUploadSuccessfulComponent]
    });
    fixture = TestBed.createComponent(DialogDataUploadSuccessfulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
