import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-dialog-edit-profile',
  templateUrl: './dialog-edit-profile.component.html',
  styleUrls: ['./dialog-edit-profile.component.scss']
})
export class DialogEditProfileComponent implements OnInit, OnDestroy {
  user?: User | null;
  userForm!: FormGroup;
  user_images_default = 'assets/img/avatar1.svg';
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    public router: Router,
    private dialogRef: MatDialogRef<DialogEditProfileComponent>) { }


  user_images: string[] = [
    'assets/img/avatar1.svg',
    'assets/img/avatar2.svg',
    'assets/img/avatar3.svg',
    'assets/img/avatar4.svg',
    'assets/img/avatar5.svg',
    'assets/img/avatar6.svg',
  ]


  changeImage(selectedImageUrl: string) {
    if (this.user) {
      const updatedUserData = {
        ...this.user,
        photoURL: selectedImageUrl
      };
      this.authService.updateUser(this.user.uid, updatedUserData);
    }
  }


  ngOnInit() {
    this.initForm();
    this.checkUser();
  }


  checkUser() {
    const firebaseUser = this.authService.currentUserValue;

    if (firebaseUser) {
      this.userSubscription = this.authService.getUserData(firebaseUser.uid).subscribe(userData => {
        if (userData) {
          this.user = userData;
          this.userForm.patchValue(userData);
        } else {
          this.user = null;
        }
      });
    }
  }


  private initForm() {
    this.userForm = this.fb.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }


  async onSubmit() {
    if (this.userForm.valid && this.user) {
      const updatedUserData = {
        displayName: this.userForm.value.displayName,
        email: this.user.email
      };

      const newEmail = this.userForm.value.email;

      if (this.user.email !== newEmail) {
        try {
          await this.authService.changeEmail(newEmail);
          updatedUserData.email = newEmail;
        } catch (error) {
          console.error("Error updating email: ", error);
        }
      }

      try {
        await this.authService.updateUser(this.user.uid, updatedUserData);
      } catch (error) {
        console.error("Error updating user data in component: ", error);
      }
    }
    this.dialogRef.close();
  }
  


  retryLoadImage() {
    if (this.user) {
      this.user.photoURL = this.user_images_default;
    }
  }


  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

}
