import {environment} from './environments/environment';

if (ENV) {
  for (let key of Object.keys(ENV)) {
    (environment as any)[key] = (ENV as any)[key];
  }
}
