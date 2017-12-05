import {Component, HostBinding} from '@angular/core';
import {Router} from '@angular/router';

import {AuthConfigService} from 'app/core/config/auth';

import * as logger from 'logger';

import {splashScreenTransitions} from './splash-screen.animations';

@Component({
  selector: 'wb-view.splash-screen-view',
  templateUrl: './splash-screen.view.html',
  styleUrls: ['./splash-screen.view.less'],
  animations: [splashScreenTransitions],
})
export class SplashScreenView {
  @HostBinding('@splashScreenTransitions')
  splashScreenTransitionsState = navigator.splashscreen ? 'disable' : 'enable';

  @HostBinding('class.hidden')
  get hiddenSplashScreen(): boolean {
    return !!navigator.splashscreen;
  }

  constructor(
    private authConfigService: AuthConfigService,
    private router: Router,
  ) {
    this.initialize().catch(logger.error);
  }

  async initialize(): Promise<void> {
    let [apiKey, account] = await Promise.all([
      this.authConfigService.apiKey$.first().toPromise(),
      this.authConfigService.account$.first().toPromise(),
    ]);

    await new Promise<void>(resolve => setTimeout(resolve, 200));
    await this.router.navigate(
      apiKey
        ? ['/glance']
        : [
            localStorage.getItem('MET_CIBEI') || account
              ? '/sign-in'
              : '/welcome',
          ],
    );
  }
}
