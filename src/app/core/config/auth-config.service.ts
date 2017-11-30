import {Injectable} from '@angular/core';

import {ConfigGroup} from './config-group';

interface AuthConfig {
  apiKey: string | undefined;
  userId: string | undefined;
}

@Injectable()
export class AuthConfigService extends ConfigGroup<AuthConfig> {
  readonly apiKey$ = this.getObservable('apiKey');

  readonly nonEmptyAPIKey$ = this.apiKey$.filter(
    <T>(apiKey: T | undefined): apiKey is T => !!apiKey,
  );

  constructor() {
    super('auth');
  }

  protected transformRaw({apiKey, userId}: Partial<AuthConfig>): AuthConfig {
    return {apiKey, userId};
  }
}
