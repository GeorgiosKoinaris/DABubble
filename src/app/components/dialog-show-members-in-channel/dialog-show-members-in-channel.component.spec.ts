import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogShowMembersInChannelComponent } from './dialog-show-members-in-channel.component';

describe('DialogAddMembersInCahnnelComponent', () => {
  let component: DialogShowMembersInChannelComponent;
  let fixture: ComponentFixture<DialogShowMembersInChannelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogShowMembersInChannelComponent]
    });
    fixture = TestBed.createComponent(DialogShowMembersInChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
