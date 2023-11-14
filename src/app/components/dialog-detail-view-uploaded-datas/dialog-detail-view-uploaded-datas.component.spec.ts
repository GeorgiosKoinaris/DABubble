import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDetailViewUploadedDatasComponent } from './dialog-detail-view-uploaded-datas.component';

describe('DialogDetailViewUploadedDatasComponent', () => {
  let component: DialogDetailViewUploadedDatasComponent;
  let fixture: ComponentFixture<DialogDetailViewUploadedDatasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogDetailViewUploadedDatasComponent]
    });
    fixture = TestBed.createComponent(DialogDetailViewUploadedDatasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
