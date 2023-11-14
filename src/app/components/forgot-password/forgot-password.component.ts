import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  sendMailForm!: FormGroup;
  emailSent = false;
  emailSendFailed = false;
  errorMessage!: string;
  inputBlurred: { [key: string]: boolean } = {
    email: false,
    password: false
  };

  constructor(
    private authService: AuthService) { }


  ngOnInit() {
    this.sendMailForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
    });
  }


  onSubmit() {
    const email = this.sendMailForm.value.email;
    this.authService.forgotPassword(email)
      .then(() => {
        this.emailSent = true;
        setTimeout(() => {
          this.emailSent = false;
          this.sendMailForm.controls['email'].reset();
        }, 3000);
      })
      .catch((error: { message: string; }) => {
        console.log(error);
        this.emailSendFailed = true;
        setTimeout(() => {
          this.emailSendFailed = false;
          this.sendMailForm.controls['email'].reset();
        }, 3000);
      });
  }


  onBlur(controlName: string): void {
    this.inputBlurred[controlName] = true;
  }

  shouldShowError(controlName: string): boolean {
    const control = this.sendMailForm.get(controlName);
    return (control?.touched || this.inputBlurred[controlName] === true) && control?.invalid === true;
  }

}
