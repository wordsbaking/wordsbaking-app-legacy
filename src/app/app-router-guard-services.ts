import {Injectable} from '@angular/core';
import {CanActivate, CanActivateChild, CanLoad} from '@angular/router';

import {Observable} from 'rxjs/Observable';

import * as logger from 'logger';

import {AuthConfigService} from 'app/core/config/auth';

import {NavigationService} from 'app/core/navigation';

@Injectable()
export class AuthGuardService
  implements CanLoad, CanActivate, CanActivateChild {
  constructor(
    private authConfigService: AuthConfigService,
    private navigationService: NavigationService,
  ) {}

  canActivate(): Observable<boolean> {
    return this.checkSigned();
  }

  canLoad(): Observable<boolean> {
    return this.checkSigned();
  }

  canActivateChild(): Observable<boolean> {
    return this.checkSigned();
  }

  private checkSigned(): Observable<boolean> {
    return this.authConfigService.apiKey$
      .map(apiKey => {
        let signed = !!apiKey;

        if (!signed) {
          this.navigationService.navigate(['/sign-in']).catch(logger.error);
        }

        return signed;
      })
      .first();
  }
}

@Injectable()
export class WelcomePageGuardService implements CanLoad, CanActivate {
  constructor(
    private authConfigService: AuthConfigService,
    private navigationService: NavigationService,
  ) {}

  canActivate(): Observable<boolean> {
    return this.showWelcome();
  }

  canLoad(): Observable<boolean> {
    return this.showWelcome();
  }

  private showWelcome(): Observable<boolean> {
    if (localStorage.getItem('MET_CIBEI')) {
      this.navigationService.navigate(['/glance']).catch(logger.error);
      return Observable.of(false);
    }

    return this.authConfigService.account$
      .map(account => {
        if (account) {
          this.navigationService.navigate(['/sign-in']).catch(logger.error);
          return false;
        }

        return true;
      })
      .first();
  }
}
