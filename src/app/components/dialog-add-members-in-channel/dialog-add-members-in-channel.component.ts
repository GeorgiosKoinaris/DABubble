import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
  Inject,
  OnDestroy,
} from '@angular/core';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import { Channel } from 'src/app/models/channel';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog-add-members-in-channel',
  templateUrl: './dialog-add-members-in-channel.component.html',
  styleUrls: ['./dialog-add-members-in-channel.component.scss'],
})
export class DialogAddMembersInChannelComponent implements OnInit, OnDestroy {
  showUserDropdown: boolean = false;
  foundUsers: User[] = [];
  channel: Channel = new Channel();
  @ViewChild('input') input!: ElementRef;
  userAlreadyExists: boolean = false;
  selectedUsers: User[] = [];
  addOnBlur = true;

  private usersSubscription: Subscription | undefined;

  constructor(
    public channelService: ChannelService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      channelId: string;
    }
  ) {}

  ngOnInit(): void {
    this.filterUsers();
    this.channel = this.channelService.channel;
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  filterUsers(query?: string): void {
    this.usersSubscription = this.authService
      .getUsers(query)
      .subscribe((users) => {
        this.foundUsers = users;
      });
  }

  selectUser(user: User): void {
    this.showUserDropdown = false;

    const userExists = this.channel.users.some(
      (existingUser: { uid: string }) => existingUser.uid === user.uid
    );

    const userAlreadySelected = this.selectedUsers.some(
      (selectedUser: { uid: string }) => selectedUser.uid === user.uid
    );

    if (!userExists && !userAlreadySelected) {
      // this.channel.users.push(user);
      this.selectedUsers.push(user);
    } else {
      // Der Benutzer existiert bereits, setzen Sie die Variable userAlreadyExists auf true
      this.userAlreadyExists = true;
      setTimeout(() => {
        this.userAlreadyExists = false; // Popup ausblenden
      }, 1500);
    }
  }

  removeUserFromSelectedUser(user: User): void {
    const index = this.selectedUsers.indexOf(user);

    if (index >= 0) {
      this.selectedUsers.splice(index, 1);

      console.log('removed', user);
    }
  }

  addMembersToChannel() {
    this.channelService.updateChannelMembersService(
      this.data.channelId,
      this.selectedUsers
    );
    this.channelService.channel.users.push(this.selectedUsers);
  }

  checkForDropdown(event: any): void {
    const value = event.target.value;
    if (value) {
      this.showUserDropdown = true;
      this.filterUsers(value);
    } else if (value == 0) {
      this.showUserDropdown = true;
      this.filterUsers();
    } else {
      this.showUserDropdown = false;
      this.filterUsers();
    }
  }

  preventEnterKey(event: any) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.input.nativeElement.contains(event.target)) {
      this.showUserDropdown = false;
    }
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }
}
