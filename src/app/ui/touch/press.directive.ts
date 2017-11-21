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
  PressDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

@Directive({
  selector: '[wbPress]',
})
export class PressDirective implements OnInit, OnDestroy {
  @Input('wbPressStop') stop = true;
  @Input('wbPressPreventDefault') preventDefault = false;

  @Output('wbPress') pressEvent = new EventEmitter<PressDelegateEvent>();

  touchDelegate: TouchDelegate;

  constructor(private ref: ElementRef) {}

  @HostListener('td-press', ['$event'])
  onTap(event: PressDelegateEvent) {
    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    this.pressEvent.emit(event);

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
