import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import {
  TapDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

@Directive({
  selector: '[wbTap]',
})
export class TapDirective implements OnInit, OnDestroy {
  @Input('wbTapStop') stop = false;
  @Input('wbTapPreventDefault') preventDefault = true;

  @Output('wbTap') tapEvent = new EventEmitter<TapDelegateEvent>();

  touchDelegate: TouchDelegate;

  constructor(private ref: ElementRef, private zone: NgZone) {}

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(
      this.ref.nativeElement,
      this.preventDefault,
    );
    this.touchDelegate.on(TouchIdentifier.tap, event => {
      this.tapEvent.emit(event);

      if (this.stop) {
        event.stopPropagation();
      }

      this.zone.run(() => {});
    });
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
