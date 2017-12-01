import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {LoadingService, ToastService} from 'app/ui';

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
    private toastService: ToastService,
    private loadingService: LoadingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async signIn(): Promise<void> {
    let form = this.form;

    if (form.invalid) {
      if (form.get('email')!.errors) {
        await this.toastService.show('邮箱格式不正确!');
      } else if (form.get('password')!.errors) {
        await this.toastService.show('请填写账号密码!');
      }

      return;
    }

    let {
      email: {value: email},
      password: {value: password},
    } = this.form.controls;

    try {
      await this.loadingService.wait(
        this.apiService.signIn(email, password),
        '登录中...',
      ).result;
    } catch (error) {
      switch (error.code) {
        case 'UserNotExistsError':
          await this.toastService.show(`用户 ${email} 不存在!`);
          break;
        case 'PasswordMismatchError':
          await this.toastService.show(`密码错误, 请重试或找回密码!`);
          break;
        default:
          await this.toastService.show(`未知错误 ${error.code || ''}.`);
          break;
      }

      return;
    }

    await this.router.navigate(['/glance']);
  }
}
