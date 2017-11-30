import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as ImageCompressor from '@xkeshi/image-compressor';

import {APIService} from 'app/core/common';
import {NavigationService} from 'app/core/navigation';
import {pageTransitions} from 'app/core/ui';
import {DialogService, LoadingService} from 'app/ui';

import {UserConfigService} from 'app/core/config';
import {Observable} from 'rxjs/Observable';

const userProfileViewTransitions = trigger('userProfileViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.user-profile-view',
  templateUrl: './user-profile.view.html',
  styleUrls: ['./user-profile.view.less'],
  animations: [userProfileViewTransitions],
})
export class UserProfileView implements OnInit {
  form: FormGroup;
  @HostBinding('@userProfileViewTransitions') userProfileViewTransitions = '';

  readonly avatarPreviewUrl$ = new BehaviorSubject<string | undefined>(
    undefined,
  );

  readonly avatarUrl$ = Observable.merge(
    this.avatarPreviewUrl$,
    this.userConfigService.avatarUrl$,
  )
    .filter(value => !!value)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly displayName$ = this.userConfigService.displayName$;
  readonly tagline$ = this.userConfigService.tagline$;

  private avatarFile: File | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private sanitization: DomSanitizer,
    private userConfigService: UserConfigService,
    private apiService: APIService,
    private dialogService: DialogService,
    private loadingService: LoadingService,
    private navigationService: NavigationService,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      avatar: ['', []],
      displayName: ['', [Validators.required, Validators.maxLength(10)]],
      tagline: ['', [Validators.maxLength(20)]],
    });

    this.displayName$.subscribe(value =>
      this.form.controls.displayName.setValue(value),
    );

    this.tagline$.subscribe(value =>
      this.form.controls.tagline.setValue(value),
    );
  }

  onAvatarFileChange(files: FileList) {
    this.avatarFile = files[0];

    if (this.avatarFile) {
      let localAvatarUrl = this.sanitization.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(this.avatarFile),
      ) as string;

      this.avatarPreviewUrl$.next(localAvatarUrl);
    }
  }

  async save(): Promise<void> {
    let form = this.form;

    if (form.invalid) {
      let nicknameControl = form.get('nickname')!;
      let taglineControl = form.get('tagline')!;

      if (nicknameControl.hasError('required')) {
        await this.dialogService.alert('昵称不能为空.');
      } else if (nicknameControl.hasError('maxLength')) {
        await this.dialogService.alert('昵称不超过10个字符.');
      } else if (taglineControl.errors) {
        await this.dialogService.alert('标签行内容不超过20个字符');
      } else {
        await this.dialogService.alert('请按要求填写完表单项目.');
      }

      return;
    }

    let avatarData: Blob | undefined;

    let syncPromises: Promise<any>[] = [];

    let {
      displayName: {value: displayName},
      tagline: {value: tagline},
    } = form.controls;

    if (this.avatarFile) {
      let imageCompressor = new ImageCompressor();

      avatarData = await imageCompressor.compress(this.avatarFile, {
        maxWidth: 120,
        maxHeight: 120,
        minWidth: 120,
        minHeight: 120,
        width: 120,
        height: 120,
        quality: 0.8,
      });

      try {
        let avatar = await this.loadingService.wait<string>(
          this.apiService.uploadAvatar(avatarData),
          '上传头像中...',
        ).result;

        syncPromises.push(this.userConfigService.set('avatar', avatar));
      } catch (e) {
        await this.dialogService.alert('上传头像失败');
        return;
      }
    }

    let oldDisplayName = await this.userConfigService.displayName$
      .first()
      .toPromise();

    if (oldDisplayName !== displayName) {
      syncPromises.push(this.userConfigService.set('displayName', displayName));
    }

    let oldTagline = await this.userConfigService.tagline$.first().toPromise();

    if (oldTagline !== tagline) {
      syncPromises.push(this.userConfigService.set('tagline', tagline));
    }

    try {
      await this.loadingService.wait(Promise.all(syncPromises), '保存中...')
        .result;
    } catch (e) {
      await this.dialogService.alert('保存失败失败');
    }

    this.navigationService.back();
  }
}
