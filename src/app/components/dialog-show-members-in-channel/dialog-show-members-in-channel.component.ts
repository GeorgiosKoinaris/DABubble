import { Component, OnInit, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { DialogAddMembersInChannelComponent } from '../dialog-add-members-in-channel/dialog-add-members-in-channel.component';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { User } from 'src/app/shared/services/user';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-dialog-show-members-in-channel',
  templateUrl: './dialog-show-members-in-channel.component.html',
  styleUrls: ['./dialog-show-members-in-channel.component.scss'],
})
export class DialogShowMembersInChannelComponent implements OnInit {
  allUsers: User[] = [];

  constructor(
    public dialog: MatDialog,
    public channelService: ChannelService,
    public authService: AuthService,
    public dialogRef: MatDialogRef<DialogShowMembersInChannelComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      channelId: string;
    }
  ) {}

  ngOnInit(): void {
    this.getAllUsersFromChannel();
  }

  getAllUsersFromChannel(): void {
    this.authService.getUsers().subscribe((users) => {
      this.allUsers = users;
    });
  }

  openDialogToAddMembersToChannel() {
    this.dialog.open(DialogAddMembersInChannelComponent, {
      data: {
        channelId: this.data.channelId,
      },
    });
    this.dialogRef.close();
  }
}
