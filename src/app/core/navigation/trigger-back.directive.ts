import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  PressDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

import {NavigationService} from './navigation.service';

@Directive({
  selector: '[wbTriggerBack]',
})
export class TriggerBackDirective implements OnInit, OnDestroy {
  @Input('wbTriggerBackStop') stop = true;
  @Input('wbTriggerBackPreventDefault') preventDefault = false;

  private touchDelegate: TouchDelegate;

  constructor(public ref: ElementRef, public navigation: NavigationService) {}

  @HostListener('td-press', ['$event'])
  onPress(event: PressDelegateEvent) {
    if (this.ref.nativeElement.disabled) {
      return;
    }

    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    this.navigation.back();

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
