import {Injectable} from '@angular/core';

import {ConfigGroup} from './config-group';

export interface AuthConfig {
  apiKey: string | undefined;
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

  protected transformRaw({apiKey}: Partial<AuthConfig>): AuthConfig {
    return {apiKey};
  }
}
