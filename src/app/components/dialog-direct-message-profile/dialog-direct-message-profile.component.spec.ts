import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDirectMessageProfileComponent } from './dialog-direct-message-profile.component';

describe('DialogDirectMessageProfileComponent', () => {
  let component: DialogDirectMessageProfileComponent;
  let fixture: ComponentFixture<DialogDirectMessageProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogDirectMessageProfileComponent]
    });
    fixture = TestBed.createComponent(DialogDirectMessageProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
