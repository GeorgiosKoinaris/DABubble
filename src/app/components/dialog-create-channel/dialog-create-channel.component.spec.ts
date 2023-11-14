import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCreateChannelComponent } from './dialog-create-channel.component';

describe('DialogCreateChannelComponent', () => {
  let component: DialogCreateChannelComponent;
  let fixture: ComponentFixture<DialogCreateChannelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogCreateChannelComponent]
    });
    fixture = TestBed.createComponent(DialogCreateChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
