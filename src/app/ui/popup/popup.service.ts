import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  NgZone,
} from '@angular/core';

import * as $ from 'jquery';

import {TouchDelegate, TouchIdentifier} from '../../lib/touch-delegate';

import {ViewContainerService} from '../util';

import {
  PopupContentType,
  PopupHandler,
  PopupShowOptions,
  PopupShowType,
} from './popup-types';

import {PopupBackgroundComponent} from './popup-background.component';
import {PopupContainerComponent} from './popup-container.component';

interface PopupInfo {
  ref: ComponentRef<PopupContainerComponent>;
  ticked: boolean;
  options: PopupShowOptions;
  onClear(): void;
}

@Injectable()
export class PopupService {
  private popupInfoSet = new Set<PopupInfo>();
  private backgroundComponentRef:
    | ComponentRef<PopupBackgroundComponent>
    | undefined;

  constructor(
    private resolver: ComponentFactoryResolver,
    private viewContainerService: ViewContainerService,
    private zone: NgZone,
  ) {
    this.mountPopupAutomaticCleaner();
  }

  get active(): boolean {
    return !!this.popupInfoSet.size;
  }

  showAsDropDown(
    content: PopupContentType,
    context: HTMLElement,
    options: PopupShowOptions = {},
  ): PopupHandler {
    return this.show('drop-down', content, context, options);
  }

  showAsLocation(
    content: PopupContentType,
    options?: PopupShowOptions,
  ): PopupHandler;
  showAsLocation(
    content: PopupContentType,
    context: HTMLElement,
    options?: PopupShowOptions,
  ): PopupHandler;
  showAsLocation(
    content: PopupContentType,
    arg2?: any,
    arg3?: any,
  ): PopupHandler {
    let context = arg2 instanceof HTMLElement ? arg2 : document.body;
    let options: PopupShowOptions =
      arg3 || (!(arg2 instanceof HTMLElement) && arg2) || {};

    return this.show('location', content, context, options);
  }

  clearAll(): void {
    for (let info of this.popupInfoSet) {
      this.clear(info);
    }
  }

  private show(
    showType: PopupShowType,
    content: PopupContentType,
    context: HTMLElement,
    options: PopupShowOptions,
  ) {
    let {
      background,
      clearOnWindowResize,
      clearOnWindowScroll,
      clearOnClick,
      clearOnOutsideClick,
      ...initOptions,
    } = options;
    let {viewContainerRef} = this.viewContainerService;

    if (!this.backgroundComponentRef && background) {
      let factory = this.resolver.resolveComponentFactory(
        PopupBackgroundComponent,
      );

      this.backgroundComponentRef = viewContainerRef.createComponent(factory);

      if (typeof background === 'string') {
        this.backgroundComponentRef.instance.background = background;
      }
    }

    let factory = this.resolver.resolveComponentFactory(
      PopupContainerComponent,
    );
    let componentRef = viewContainerRef.createComponent(factory);

    componentRef.instance.init({
      showType,
      componentRef,
      content,
      context,
      ...initOptions,
      staticContextOffset:
        (clearOnWindowResize || clearOnWindowResize === undefined) &&
        (clearOnWindowScroll || clearOnWindowScroll === undefined),
    });

    let info: PopupInfo;

    let result = new Promise<void>(resolve => {
      info = {
        ref: componentRef,
        ticked: false,
        options,
        onClear: () => {
          resolve();
        },
      };

      setTimeout(() => (info.ticked = true), 100);

      this.popupInfoSet.add(info);
    });

    return {
      result,
      clear: () => {
        this.clear(info);
      },
    };
  }

  private clear(info: PopupInfo): void {
    info.ref.destroy();

    let set = this.popupInfoSet;

    set.delete(info);

    if (this.backgroundComponentRef) {
      this.backgroundComponentRef.destroy();
      this.backgroundComponentRef = undefined;
    }

    info.onClear();

    this.zone.run(() => undefined);
  }

  private mountPopupAutomaticCleaner() {
    this.listenDocumentClick();
    this.listenDocumentScroll();
    this.listenWindowResize();
  }

  private listenDocumentScroll(): void {
    document.addEventListener(
      'scroll',
      event => {
        let $target = $(event.target);

        for (let popupInfo of this.popupInfoSet) {
          if ($target.closest(popupInfo.ref.instance.element).length) {
            return;
          }
        }

        for (let popupInfo of this.popupInfoSet) {
          let {options: {clearOnWindowScroll}, ticked} = popupInfo;

          if (
            (clearOnWindowScroll || clearOnWindowScroll === undefined) &&
            ticked
          ) {
            this.clear(popupInfo);
          }
        }
      },
      true,
    );
  }

  private listenDocumentClick(): void {
    let touchDelegate = new TouchDelegate(document);

    touchDelegate.on(TouchIdentifier.tap, (event): void => {
      if (event.originalEvent.type === 'mouseup') {
        return;
      }

      let $target = $(event.originalEvent.target);

      for (let popupInfo of this.popupInfoSet) {
        let {options: {clearOnOutsideClick, clearOnClick}, ticked} = popupInfo;
        if (
          clearOnOutsideClick &&
          $target.closest(popupInfo.ref.instance.element).length
        ) {
          continue;
        }

        if ((clearOnClick || clearOnClick === undefined) && ticked) {
          this.clear(popupInfo);
        }
      }
    });
  }

  private listenWindowResize(): void {
    window.addEventListener('resize', () => {
      for (let popupInfo of this.popupInfoSet) {
        let {options: {clearOnWindowResize}, ticked} = popupInfo;

        if (
          (clearOnWindowResize || clearOnWindowResize === undefined) &&
          ticked
        ) {
          this.clear(popupInfo);
        }
      }
    });
  }
}
