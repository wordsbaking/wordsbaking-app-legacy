import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import * as v from 'villa';

import {LoadingService, ToastService} from 'app/ui';

import {APIService, MigrationStatus} from 'app/core/common';
import {AuthConfigService} from 'app/core/config/auth';
import {SelectionListPopupService, pageTransitions} from 'app/core/ui';
import {RoutingService} from 'app/platform/common';

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

  @HostBinding('@signInViewTransition')
  get signInViewTransition(): string {
    return this.routingService.histories.length > 1 ? 'all' : 'no-enter';
  }

  signedAccount$ = this.authConfigService.account$.map(
    account => account || '',
  );

  constructor(
    private formBuilder: FormBuilder,
    private apiService: APIService,
    private authConfigService: AuthConfigService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private router: Router,
    private selectionListPopupService: SelectionListPopupService,
    private routingService: RoutingService,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.email]],
      password: ['', [Validators.required]],
    });

    this.authConfigService.account$.subscribe(account => {
      if (!this.form.controls.email.value) {
        this.form.controls.email.setValue(account);
      }
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

    let {email: {value: email}, password: {value: password}} = form.controls;

    let loadingHandler = this.loadingService.show('登录中...');

    try {
      let {
        apiKey,
        accountStatus,
        availableDataSourceVersions,
      } = await this.apiService.signIn(email, password);

      if (accountStatus === 'need-upgrade') {
        loadingHandler.setText('数据迁移中...');
        await this.upgrade(email, password, availableDataSourceVersions);
        accountStatus = 'upgrading';
      }

      if (accountStatus === 'upgrading') {
        loadingHandler.setText('数据迁移中...');
        await this.waitingToUpgrade();
      }

      if (!apiKey) {
        let {apiKey} = await this.apiService.signIn(email, password);

        if (!apiKey) {
          throw new Error('Sign in failed');
        }
      }
    } catch (error) {
      if (error.type === 'migration') {
        this.toastService.show('数据迁移失败!');
        return;
      }

      switch (error.code) {
        case 'UserNotExistsError':
          this.toastService.show(`用户 ${email} 不存在!`);
          break;
        case 'PasswordMismatchError':
          this.toastService.show(`密码错误, 请重试或找回密码!`);
          break;
        default:
          this.toastService.show(`未知错误 ${error.code || ''}.`);
          break;
      }

      return;
    } finally {
      loadingHandler.clear();
    }

    await this.router.navigate(['/glance']);
  }

  private async upgrade(
    email: string,
    password: string,
    availableDataSourceVersions: string[] | undefined,
  ): Promise<void> {
    let selectedDataSourceVersion: string | undefined;

    if (availableDataSourceVersions && availableDataSourceVersions.length) {
      if (availableDataSourceVersions.length === 1) {
        selectedDataSourceVersion = availableDataSourceVersions[0];
      } else {
        let result = await this.selectionListPopupService.show<
          string
        >(
          '尊敬的词焙老用户，您希望将哪个词焙APP版本的的学习数据迁移到现在使用的新版词焙APP中?',
          availableDataSourceVersions.map(dataSourceVersion => {
            return {
              text: `使用版本${dataSourceVersion} 的数据`,
              value: dataSourceVersion,
            };
          }),
          {
            background: false,
            // clearOnOutsideClick: false,
          },
        );

        if (!result || !result.length) {
          throw new MigrationException('Unexpected data source version');
        }

        selectedDataSourceVersion = result[0];
      }
    }

    await this.apiService.migrateUserData(
      email,
      password,
      selectedDataSourceVersion,
    );
  }

  private async waitingToUpgrade(): Promise<void> {
    let {form} = this;

    if (form.get('email')!.errors) {
      throw new MigrationException('Unexpected email');
    }

    let {email: {value: email}} = this.form.controls;

    while (true) {
      let migrationStatus = await this.apiService.getUserDataMigrationStatus(
        email,
      );

      if (migrationStatus === undefined) {
        throw new MigrationException('No migration task');
      }

      if (migrationStatus === MigrationStatus.failed) {
        throw new MigrationException('Migration failed');
      }

      if (migrationStatus === MigrationStatus.finished) {
        return;
      }

      await v.sleep(1000);
    }
  }
}

class MigrationException extends Error {
  type = 'migration';
}
