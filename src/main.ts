import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/race';
import 'rxjs/add/operator/audit';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/delayWhen';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/observeOn';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/publish';
import 'rxjs/add/operator/publishBehavior';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/repeat';
import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/zip';

import './env';

import * as logger from 'logger';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

import {hmrBootstrap} from './hmr';

import {_preload} from './app/preload';

if (environment.production) {
  enableProdMode();
}

_preload()
  .then(async () => {
    await waitCordovaFrameworkReady();

    if (environment.hmr && module['hot']) {
      await hmrBootstrap(module, bootstrap);
    } else {
      await bootstrap();
    }

    function bootstrap() {
      return platformBrowserDynamic().bootstrapModule(AppModule, []);
    }

    function waitCordovaFrameworkReady(): Promise<void> {
      if (!window.cordova) {
        return Promise.resolve();
      }

      return new Promise<void>(resolve => {
        document.addEventListener(
          'deviceready',
          () => {
            document.body.classList.add(window.cordova!.platformId);
            resolve();
          },
          false,
        );
      });
    }
  })
  .catch(logger.error);
