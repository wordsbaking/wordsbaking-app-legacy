import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {DialogService} from 'app/ui';

import {APIService} from 'app/core/common';
import {pageTransitions} from 'app/core/ui';

const signInViewTransition = trigger('signInViewTransition', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.sign-in-view',
  templateUrl: './sign-in.view.html',
  styleUrls: ['./sign-in.view.less'],
  animations: [signInViewTransition],
})
export class SignInView implements OnInit {
  form: FormGroup;

  @HostBinding('@signInViewTransition') signInViewTransition = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: APIService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async signIn(): Promise<void> {
    let errors = this.form.errors;

    if (errors) {
      if (errors.email) {
        await this.dialogService.alert('邮箱格式不正确.');
      } else if (errors.password) {
        await this.dialogService.alert('请填写账号密码.');
      }

      return;
    }

    let {
      email: {value: email},
      password: {value: password},
    } = this.form.controls;

    try {
      await this.apiService.signIn(email, password);
    } catch (error) {
      switch (error.code) {
        case 'UserNotExistsError':
          await this.dialogService.alert(`用户 ${email} 不存在.`);
          break;
        case 'PasswordMismatchError':
          await this.dialogService.alert(`密码错误, 请重试或找回密码.`);
          break;
        default:
          await this.dialogService.alert(`未知错误 ${error.code}.`);
          break;
      }

      return;
    }

    await this.router.navigate(['/glance']);
  }
}
