import {Injectable} from '@angular/core';

import {SyncService} from 'app/core/data';

import {ConfigGroup} from './config-group';

import {environment} from '../../../environments/environment';

export interface UserConfig {
  today: TimeNumber;
  lastActiveAt: TimeNumber;
  displayName: string;
  avatar: string;
  tagline: string;
}

@Injectable()
export class UserConfigService extends ConfigGroup<UserConfig> {
  readonly today$ = this.getObservable('today');
  readonly lastActiveAt$ = this.getObservable('lastActiveAt');
  readonly displayName$ = this.getObservable('displayName');
  readonly avatarUrl$ = this.getObservable('avatar')
    .startWith('default')
    .distinctUntilChanged()
    .map(
      avatarId =>
        `${environment.aliyunOSSUserContentBaseUrl}/avatars/${avatarId}`,
    )
    .publishReplay(1)
    .refCount();

  readonly tagline$ = this.getObservable('tagline');

  constructor(syncService: SyncService) {
    super('user', syncService, syncService.user);
  }

  protected transformRaw({
    today = 0 as TimeNumber,
    lastActiveAt = 0 as TimeNumber,
    displayName = '',
    avatar = 'default',
    tagline = '好好学习，天天向上!',
  }: Partial<UserConfig>): UserConfig {
    return {today, lastActiveAt, displayName, avatar, tagline};
  }
}
