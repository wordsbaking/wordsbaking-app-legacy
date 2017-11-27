import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {DialogService} from 'app/ui';

import {APIService} from 'app/core/common';
import {pageTransitions} from 'app/core/ui';

const signUpViewTransitions = trigger('signUpViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.sign-up-view',
  templateUrl: './sign-up.view.html',
  styleUrls: ['./sign-up.view.less'],
  animations: [signUpViewTransitions],
})
export class SignUpView implements OnInit {
  form: FormGroup;

  email: string;
  password: string;

  @HostBinding('@signUpViewTransitions') signUpViewTransitions = '';

  whyAccountDescriptionVisible = false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: APIService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.email]],
      password: ['', [Validators.minLength(6), Validators.maxLength(32)]],
    });
  }

  async signUp(): Promise<void> {
    if (this.form.invalid) {
      alert('error');
      return;
    }

    let {
      email: {value: email},
      password: {value: password},
    } = this.form.controls;

    try {
      await this.apiService.signUp(email, password);
    } catch (error) {
      switch (error.code) {
        case 'UserExistsError':
          await this.dialogService.alert(`用户 ${email} 已存在.`);
          break;
        default:
          await this.dialogService.alert(`未知错误 ${error.code}.`);
          break;
      }

      return;
    }

    await this.router.navigate(['/glance']);
  }

  toggleWhyAccountDescriptionDisplay(): void {
    this.whyAccountDescriptionVisible = !this.whyAccountDescriptionVisible;
  }
}
