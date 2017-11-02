import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {TouchDelegate, TouchIdentifier} from 'app/lib/touch-delegate';

import {NavigationService} from 'app/core/navigation';

import * as logger from 'logger';

@Directive({
  selector: '[wbTapLink]',
})
export class TapLinkDirective implements OnInit, OnDestroy {
  @Input('wbTapLink') url: string;
  @Input('wbTapStop') stop = true;
  @Input('wbTapPreventDefault') preventDefault = true;

  touchDelegate: TouchDelegate;

  constructor(
    private ref: ElementRef,
    private navigation: NavigationService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(this.ref.nativeElement, true);
    this.touchDelegate.on(TouchIdentifier.tap, event => {
      if (this.stop) {
        event.stopPropagation();
      }

      this.navigation
        .navigate([this.url])
        .then(() => this.zone.run(() => {}))
        .catch(logger.error);
    });
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
