import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {NavigationExtras, Router} from '@angular/router';

@Injectable()
export class NavigationService {
  private promise: Promise<boolean> | undefined;

  constructor(private router: Router, private location: Location) {}

  get navigating(): boolean {
    return !!this.promise;
  }

  async navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    this.promise = this.promise
      ? this.promise.then(() => this.router.navigate(commands, extras))
      : this.router.navigate(commands, extras);

    return this.promise;
  }

  back(): void {
    this.location.back();
  }
}
