import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogEditProfileComponent } from '../dialog-edit-profile/dialog-edit-profile.component';
import { MessageService } from 'src/app/shared/services/message.service';

@Component({
  selector: 'app-dialog-profile',
  templateUrl: './dialog-profile.component.html',
  styleUrls: ['./dialog-profile.component.scss']
})
export class DialogProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isOnline?: boolean;
  userSubscription?: Subscription;
  user_images = 'assets/img/avatar1.svg';

  constructor(
    private authService: AuthService,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DialogProfileComponent>,
    public messageService: MessageService) { }


  ngOnInit() {
    this.initUser();
  }

  initUser() {
    this.userSubscription = this.authService.currentUser.subscribe(userData => {
      this.user = userData;
      this.isOnline = userData?.isOnline ?? undefined;
    });
  }


  retryLoadImage() {
    if (this.user) {
      this.user.photoURL = this.user_images;
    }
  }


  openDialog(): void {
    const dialogRef = this.dialog.open(DialogEditProfileComponent, {
      width: '600px',
      height: '650px',
      panelClass: 'custom-dialog-container'
    });
    this.dialogRef.close();
  }



  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
}