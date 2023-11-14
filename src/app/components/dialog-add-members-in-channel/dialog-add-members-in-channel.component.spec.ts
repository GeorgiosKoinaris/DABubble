import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddMembersInChannelComponent } from './dialog-add-members-in-channel.component';

describe('DialogAddMembersInChannelComponent', () => {
  let component: DialogAddMembersInChannelComponent;
  let fixture: ComponentFixture<DialogAddMembersInChannelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogAddMembersInChannelComponent]
    });
    fixture = TestBed.createComponent(DialogAddMembersInChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
