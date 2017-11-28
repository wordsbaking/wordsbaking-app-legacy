import {Injectable} from '@angular/core';

import {ConfigGroup} from './config-group';

interface AuthConfig {
  apiKey: string | undefined;
}

@Injectable()
export class AuthConfigService extends ConfigGroup<AuthConfig> {
  readonly apiKey$ = this.getObservable('apiKey');

  constructor() {
    super('auth');
  }

  protected transformRaw({apiKey}: Partial<AuthConfig>): AuthConfig {
    return {apiKey};
  }
}
