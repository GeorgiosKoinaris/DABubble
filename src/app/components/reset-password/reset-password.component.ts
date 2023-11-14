import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  newPasswordForm!: FormGroup;
  passwordResetSuccess: boolean = false;
  oobCode: string | null = null;
  newPassword = '';
  repeatedPassword = '';
  inputBlurred: { [key: string]: boolean } = {
    password: false
  };

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');
  }


  ngOnInit() {
    this.newPasswordForm = new FormGroup({
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required)
    });
    this.newPasswordForm.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswordsMatch();
    });

    this.newPasswordForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordsMatch();
    });
  }


  onSubmit() {
    if (this.newPasswordForm.valid && this.oobCode) {
        const newPassword = this.newPasswordForm.get('password')?.value;
        this.authService.confirmReset(this.oobCode, newPassword).then(() => {
            this.passwordResetSuccess = true;
            setTimeout(() => {
                this.router.navigate(['/login']);
                this.passwordResetSuccess = true;
            }, 3000);
        }).catch((error) => {
            this.newPasswordForm.get('confirmPassword')?.setErrors({ notMatching: true });
        });
    }
}




  checkPasswordsMatch() {
    const password = this.newPasswordForm.get('password')?.value;
    const confirmPassword = this.newPasswordForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.newPasswordForm.get('confirmPassword')?.setErrors({ notMatching: true });
    } else {
      this.newPasswordForm.get('confirmPassword')?.setErrors(null);
    }
  }
}
