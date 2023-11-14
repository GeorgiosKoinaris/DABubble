import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProfileComponent } from './dialog-profile.component';

describe('DialogProfileComponent', () => {
  let component: DialogProfileComponent;
  let fixture: ComponentFixture<DialogProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogProfileComponent]
    });
    fixture = TestBed.createComponent(DialogProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
