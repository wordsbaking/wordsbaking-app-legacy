import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, ElementRef} from '@angular/core';

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
  element: HTMLElement;

  constructor(ref: ElementRef, private location: Location) {
    this.element = ref.nativeElement;
  }

  toggleHeaderExtension(force?: boolean): void {
    let rendered = this.headerExtensionRendered$.value;

    this.headerExtensionRendered$.next(force === undefined ? !rendered : force);
  }

  back(): void {
    this.location.back();
  }
}
