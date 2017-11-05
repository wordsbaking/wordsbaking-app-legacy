import {Component, HostBinding, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {routerTransition} from './app-router.animations';

@Component({
  selector: 'wb-root',
  templateUrl: './app.view.html',
  styleUrls: ['./app.view.less'],
  animations: [routerTransition],
})
export class AppView {
  @ViewChild('outlet', {read: RouterOutlet})
  outlet: RouterOutlet;

  @HostBinding('@routerTransition')
  get routerTransitionState(): string {
    return this.outlet.activatedRouteData.target;
  }
}
