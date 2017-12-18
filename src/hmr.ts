import {ApplicationRef, NgModuleRef, NgZone} from '@angular/core';
import {createNewHosts} from '@angularclass/hmr';

type Bootstrap = () => Promise<NgModuleRef<any>>;

export async function hmrBootstrap(module: any, bootstrap: Bootstrap) {
  let ngModule: NgModuleRef<any>;

  module.hot.accept();

  module.hot.dispose(() => {
    let zone: NgZone = ngModule.injector.get(NgZone);
    let appRef: ApplicationRef = ngModule.injector.get(ApplicationRef);

    let elements = appRef.components.map(c => c.location.nativeElement);
    let makeVisible = createNewHosts(elements);

    ngModule.destroy();
    makeVisible();
  });

  ngModule = await bootstrap();
}
