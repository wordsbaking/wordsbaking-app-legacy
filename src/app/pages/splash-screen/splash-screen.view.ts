import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {ConfigService} from 'app/core/config';

import * as logger from 'logger';

@Component({
  selector: 'wb-view.splash-screen-view',
  templateUrl: './splash-screen.view.html',
  styleUrls: ['./splash-screen.view.less'],
})
export class SplashScreenView {
  constructor(private configService: ConfigService, private router: Router) {
    this.initialize().catch(logger.error);
  }

  async initialize(): Promise<void> {
    let apiKey = await this.configService.apiKey$.first().toPromise();
    await this.router.navigate(apiKey ? ['/glance'] : ['/sign-up']);
  }
}
