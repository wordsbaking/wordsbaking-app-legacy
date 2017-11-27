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
    let errors = this.form.errors;

    if (errors) {
      if (errors.email) {
        await this.dialogService.alert('邮箱格式不正确.');
      } else if (errors.password) {
        await this.dialogService.alert('密码长度应在 6-32 位之间.');
      }

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
