import {
  Directive,
  ElementRef,
  HostListener,
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
    public ref: ElementRef,
    public navigation: NavigationService,
    public zone: NgZone,
  ) {}

  @HostListener('td-tap', ['$event'])
  onTap() {
    this.navigation.navigate([this.url]).catch(logger.error);
  }

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(this.ref.nativeElement, true);
    this.touchDelegate.bind(TouchIdentifier.tap);
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
