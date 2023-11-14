import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Channel } from 'src/app/models/channel';
import { MatDialog } from '@angular/material/dialog';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { MatRadioChange } from '@angular/material/radio';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';

@Component({
  selector: 'app-dialog-create-channel',
  templateUrl: './dialog-create-channel.component.html',
  styleUrls: ['./dialog-create-channel.component.scss'],
})
export class DialogCreateChannelComponent implements OnInit {
  channel: Channel = new Channel();
  showForm = true;
  radioSelected: boolean = false;
  isInputVisible: boolean = false;
  showUserDropdown: boolean = false;
  foundUsers: User[] = [];
  selectedUsers: User[] = [];
  inputValue: string = '';
  selectedRadioButtonValue!: string;
  @ViewChild('input', { static: false }) input!: ElementRef | undefined;
  userAlreadyExists: boolean = false;

  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.filterUsers();
  }

  toggleForms() {
    this.showForm = !this.showForm;
  }

  onRadioChange(event: MatRadioChange) {
    this.radioSelected = true;
    this.selectedRadioButtonValue = event.value;
    if (event.value === '2') {
      this.isInputVisible = true;
    } else {
      this.isInputVisible = false;
    }
  }

  async addAllMembers() {
    this.channel.users = this.foundUsers;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.input &&
      this.input.nativeElement &&
      !this.input.nativeElement.contains(event.target)
    ) {
      this.showUserDropdown = false;
    }
  }

  filterUsers(query?: string): void {
    this.authService.getUsers(query).subscribe((users) => {
      this.foundUsers = users;
    });
  }

  selectUser(user: User): void {
    this.showUserDropdown = false;

    if (!this.channel.users) {
      this.channel.users = []; // Initialisieren Sie das Array, wenn es noch nicht existiert
    }

    const userExists = this.channel.users.some(
      (existingUser: { uid: string }) => existingUser.uid === user.uid
    );

    if (!userExists) {
      this.channel.users.push(user);
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
    // Entfernen Sie den Benutzer aus selectedUsers
    const selectedUsersIndex = this.selectedUsers.indexOf(user);
    if (selectedUsersIndex >= 0) {
      this.selectedUsers.splice(selectedUsersIndex, 1);
    }

    // Entfernen Sie den Benutzer aus this.channel.users, wenn er vorhanden ist
    if (this.channel.users) {
      const channelUsersIndex = this.channel.users.findIndex(
        (channelUser: { uid: string }) => channelUser.uid === user.uid
      );
      if (channelUsersIndex >= 0) {
        this.channel.users.splice(channelUsersIndex, 1);
      }
    }
  }

  async onSubmitWithMembers(channel: any) {
    if (this.selectedRadioButtonValue == '1') {
      await this.addAllMembers();
      this.getValueForChannelNameAndConvertToLowerCase(channel.channelName);

      const currentUser = this.authService.currentUserValue;

      this.channel.channelCreatedBy = currentUser;
      this.channelService.addChannelService(this.channel);
    } else if (
      this.selectedRadioButtonValue == '2' &&
      this.channel.users.length > 0
    ) {
      this.getValueForChannelNameAndConvertToLowerCase(channel.channelName);

      const currentUser = this.authService.currentUserValue;

      this.channel.channelCreatedBy = currentUser;
      this.channelService.addChannelService(this.channel);
    }
  }

  // Used to convert channel names to lowercase to preserve alphabetical order.
  getValueForChannelNameAndConvertToLowerCase(channelName: string) {
    this.channel.channelName = channelName.toLowerCase();
  }

  getValueFromInput($event: any) {
    this.inputValue = $event;
  }
}
