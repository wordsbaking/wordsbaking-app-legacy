import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {AuthConfigService} from 'app/core/config/auth';

import * as logger from 'logger';

@Component({
  selector: 'wb-view.splash-screen-view',
  templateUrl: './splash-screen.view.html',
  styleUrls: ['./splash-screen.view.less'],
})
export class SplashScreenView {
  constructor(
    private authConfigService: AuthConfigService,
    private router: Router,
  ) {
    this.initialize().catch(logger.error);
  }

  async initialize(): Promise<void> {
    let apiKey = await this.authConfigService.apiKey$.first().toPromise();
    await this.router.navigate(apiKey ? ['/glance'] : ['/sign-up']);
  }
}
