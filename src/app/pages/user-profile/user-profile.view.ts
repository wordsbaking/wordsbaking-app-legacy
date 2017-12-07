import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as ImageCompressor from '@xkeshi/image-compressor';

import {LoadingService, ToastService} from 'app/ui';

import {APIService} from 'app/core/common';
import {NavigationService} from 'app/core/navigation';
import {pageTransitions} from 'app/core/ui';

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

  private saving = false;

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
    private loadingService: LoadingService,
    private navigationService: NavigationService,
    private toastService: ToastService,
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
    if (this.saving) {
      return;
    }

    this.saving = true;

    try {
      await this._save();
    } catch (err) {}

    this.saving = false;
  }

  private async _save(): Promise<void> {
    let form = this.form;

    if (form.invalid) {
      let displayNameControl = form.get('displayName')!;
      let taglineControl = form.get('tagline')!;

      if (displayNameControl.hasError('required')) {
        this.toastService.show('昵称不能为空!');
      } else if (displayNameControl.hasError('maxlength')) {
        this.toastService.show('昵称不超过10个字符!');
      } else if (taglineControl.errors) {
        this.toastService.show('标签行内容不超过20个字符!');
      } else {
        this.toastService.show('请按要求填写完表单项目!');
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
      this.loadingService.show('上传头像中...');

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
        let avatar = await this.apiService.uploadAvatar(avatarData);

        syncPromises.push(this.userConfigService.set('avatar', avatar));
      } catch (e) {
        this.toastService.show('上传头像失败!');
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
      this.toastService.show('保存失败!');
      return;
    }

    this.toastService.show('保存成功.');

    this.navigationService.back();
  }
}
