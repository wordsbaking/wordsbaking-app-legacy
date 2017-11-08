import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
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
  @Input('wbTapStop') stop = true;
  @Input('wbTapPreventDefault') preventDefault = false;

  @Output('wbTap') tapEvent = new EventEmitter<TapDelegateEvent>();

  touchDelegate: TouchDelegate;

  constructor(private ref: ElementRef) {}

  @HostListener('td-tap', ['$event'])
  onTap(event: TapDelegateEvent) {
    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    this.tapEvent.emit(event);

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
