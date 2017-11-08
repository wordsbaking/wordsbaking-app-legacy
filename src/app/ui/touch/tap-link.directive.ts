import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  TapDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

import {NavigationService} from 'app/core/navigation';

import * as logger from 'logger';

@Directive({
  selector: '[wbTapLink]',
})
export class TapLinkDirective implements OnInit, OnDestroy {
  @Input('wbTapLink') url: string;
  @Input('wbTapLinkStop') stop = true;
  @Input('wbTapLinkPreventDefault') preventDefault = false;

  touchDelegate: TouchDelegate;

  constructor(
    public ref: ElementRef,
    public navigation: NavigationService,
    public zone: NgZone,
  ) {}

  @HostListener('td-tap', ['$event'])
  onTap(event: TapDelegateEvent) {
    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    this.navigation.navigate([this.url]).catch(logger.error);

    if (this.stop) {
      event.detail.stopPropagation();
    }
  }

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(
      this.ref.nativeElement,
      this.preventDefault,
    );
    this.touchDelegate.bind(TouchIdentifier.tap);
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
