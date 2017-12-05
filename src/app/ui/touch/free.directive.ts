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
  FreeDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

@Directive({
  selector: '[wbFree]',
})
export class FreeDirective implements OnInit, OnDestroy {
  @Input('wbFreeStop') stop = true;
  @Input('wbFreePreventDefault') preventDefault = false;

  @Output('wbFree') freeEvent = new EventEmitter<FreeDelegateEvent>();

  touchDelegate: TouchDelegate;

  constructor(private ref: ElementRef) {}

  @HostListener('td-free', ['$event'])
  onTap(event: FreeDelegateEvent) {
    if (this.ref.nativeElement.disabled) {
      return;
    }

    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    this.freeEvent.emit(event);

    if (this.stop) {
      event.detail.stopPropagation();
    }
  }

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(
      this.ref.nativeElement,
      this.preventDefault,
    );

    this.touchDelegate.bind(TouchIdentifier.free);
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }
}
