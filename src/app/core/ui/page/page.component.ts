import {Location} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {pageHeaderExtensionTransitions} from './page.animations';

@Component({
  selector: 'wb-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less'],
  animations: [pageHeaderExtensionTransitions],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {
  headerExtensionRendered$ = new BehaviorSubject<boolean>(false);
  headerExtensionExpanded$ = new BehaviorSubject<boolean>(false);
  element: HTMLElement;

  constructor(
    ref: ElementRef,
    private location: Location,
    private zone: NgZone,
  ) {
    this.element = ref.nativeElement;
  }

  toggleHeaderExtension(force?: boolean): void {
    let rendered = this.headerExtensionRendered$.value;
    let expanded = this.headerExtensionExpanded$.value;

    if (force !== undefined) {
      if (!force && !expanded) {
        return;
      }

      if (!rendered) {
        this.headerExtensionRendered$.next(true);
      }

      expanded = force;
    } else {
      if (!rendered) {
        this.headerExtensionRendered$.next(true);
      }

      expanded = !expanded;
    }

    if (expanded === !!this.headerExtensionExpanded$.value) {
      return;
    }

    this.headerExtensionExpanded$.next(expanded);

    if (!expanded && !IS_IPHONE) {
      this.headerExtensionRendered$.next(false);
    }
  }

  back(): void {
    this.location.back();
  }
}
