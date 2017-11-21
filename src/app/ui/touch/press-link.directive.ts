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
  PressDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

import {NavigationService} from 'app/core/navigation';

import * as logger from 'logger';

@Directive({
  selector: '[wbPressLink]',
})
export class PressLinkDirective implements OnInit, OnDestroy {
  @Input('wbPressLink') url: string;
  @Input('wbPressLinkStop') stop = true;
  @Input('wbPressLinkPreventDefault') preventDefault = false;

  touchDelegate: TouchDelegate;

  constructor(
    public ref: ElementRef,
    public navigation: NavigationService,
    public zone: NgZone,
  ) {}

  @HostListener('td-press', ['$event'])
  onPress(event: PressDelegateEvent) {
    if (this.ref.nativeElement.disabled) {
      return;
    }

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
    this.touchDelegate.bind(TouchIdentifier.press);
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
