import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as logger from 'logger';

import {APIService} from 'app/core/common';

const TICK_INTERVAL = 60 * 1000;

@Injectable()
export class AppVersionCheckerService {
  readonly latestVersion$ = new BehaviorSubject<AppVersionProfile>(
    APP_PROFILE.version,
  );

  private checking = false;
  private tickTimerHandle: number | undefined;

  constructor(private apiService: APIService) {}

  open(): void {
    if (this.tickTimerHandle) {
      clearTimeout(this.tickTimerHandle);
    }

    this.checking = true;
    this.tick().catch(logger.error);
  }

  close(): void {
    if (!this.checking) {
      return;
    }

    if (this.tickTimerHandle) {
      clearTimeout(this.tickTimerHandle);
    }

    this.checking = false;
  }

  async tick(polling = true): Promise<void> {
    if (polling && !this.checking) {
      return;
    }

    let appVersionEntry = await this.apiService.getAppLatestVersionInfo(
      APP_PROFILE.platform,
    );

    if (appVersionEntry) {
      this.latestVersion$.next({
        name: appVersionEntry.version,
        code: resolveVersion(appVersionEntry.version).code,
        beta: appVersionEntry.beta,
        description: appVersionEntry.description,
        downloadUrl: appVersionEntry.downloadUrl,
      });
    }

    if (polling) {
      this.tickTimerHandle = setTimeout(() => this.tick(), TICK_INTERVAL);
    }
  }
}

function resolveVersion(version: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid version');
  }

  let [major, minor, patch] = version.split('.').map(Number);

  return {
    name: version,
    code: major * 10000 + minor * 100 + patch,
  };
}
