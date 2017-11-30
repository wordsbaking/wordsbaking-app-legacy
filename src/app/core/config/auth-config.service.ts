import {Injectable} from '@angular/core';

import {ConfigGroup} from './config-group';

interface AuthConfig {
  apiKey: string | undefined;
  userId: string | undefined;
  account: string | undefined;
}

@Injectable()
export class AuthConfigService extends ConfigGroup<AuthConfig> {
  readonly apiKey$ = this.getObservable('apiKey');
  readonly userId$ = this.getObservable('userId');
  readonly account$ = this.getObservable('account');

  readonly nonEmptyAPIKey$ = this.apiKey$.filter(
    <T>(apiKey: T | undefined): apiKey is T => !!apiKey,
  );

  constructor() {
    super('auth');
  }

  protected transformRaw({
    apiKey,
    userId,
    account,
  }: Partial<AuthConfig>): AuthConfig {
    return {apiKey, userId, account};
  }
}
