import {
  AfterViewInit,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';

import * as $ from 'jquery';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {
  PressDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
} from 'app/lib/touch-delegate';

import {SelectionListItemComponent} from '../selection-list-item/selection-list-item.component';

@Component({
  selector: 'wb-selection-list',
  templateUrl: './selection-list.component.html',
  styleUrls: ['./selection-list.component.less'],
})
export class SelectionListComponent<T>
  implements OnInit, AfterViewInit, OnDestroy {
  @ContentChildren(SelectionListItemComponent)
  listItemQueryList: QueryList<SelectionListItemComponent<T>>;

  element: HTMLElement;

  @Input('multiple') multiple = false;

  @Output('change') selectedChangeEvent = new EventEmitter<(T | undefined)[]>();

  @Input('preventSelected') preventSelected = false;

  private selectedChange$ = new Subject<void>();

  private touchDelegate: TouchDelegate;
  private listItemComponentMap = new Map<
    Element,
    SelectionListItemComponent<T>
  >();

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;

    Observable.from(this.selectedChange$)
      .debounceTime(100)
      .subscribe(() => this.selectedChangeEvent.emit(this.values));
  }

  get values(): (T | undefined)[] {
    let values: (T | undefined)[] = [];

    for (let [, component] of this.listItemComponentMap) {
      if (component.selected) {
        values.push(component.value);
      }
    }

    return values;
  }

  @HostListener('td-press', ['$event'])
  onTap(event: PressDelegateEvent): void {
    let {originalEvent} = event.detail;

    // TODO: unreliable
    if (originalEvent.type === 'mouseup') {
      return;
    }

    let $target = $(originalEvent.target);
    let $selectionListItem = $target.closest('wb-selection-list-item');

    if (!$selectionListItem.length) {
      return;
    }

    let listItemComponent = this.listItemComponentMap.get(
      $selectionListItem[0],
    );

    if (!listItemComponent) {
      return;
    }

    this.toggleSelected(listItemComponent);
  }

  ngOnInit(): void {
    this.touchDelegate = new TouchDelegate(this.element);
    this.touchDelegate.bind(TouchIdentifier.press);
  }

  ngAfterViewInit(): void {
    let {listItemQueryList, listItemComponentMap, selectedChange$} = this;
    listItemQueryList.changes.subscribe(refreshListItemComponent);
    refreshListItemComponent();

    function refreshListItemComponent() {
      let listItems = listItemQueryList.toArray();

      listItemComponentMap.clear();

      for (let item of listItems) {
        listItemComponentMap.set(item.element, item);

        item.selectedChangeEvent.subscribe(() => selectedChange$.next());
      }
    }
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }

  private toggleSelected(
    listItemComponent: SelectionListItemComponent<T>,
    force?: boolean,
  ): void {
    if (this.preventSelected) {
      return;
    }

    if (this.multiple) {
      this.toggleMultipleSelected(listItemComponent, force);
    } else {
      this.toggleSingleSelected(listItemComponent, force);
    }
  }

  private toggleSingleSelected(
    listItemComponent: SelectionListItemComponent<T>,
    _force?: boolean,
  ): void {
    for (let [, item] of this.listItemComponentMap) {
      if (item !== listItemComponent) {
        item.toggleSelect(false);
      } else {
        item.toggleSelect(true);
      }
    }
  }

  private toggleMultipleSelected(
    listItemComponent: SelectionListItemComponent<T>,
    force?: boolean,
  ): void {
    listItemComponent.toggleSelect(force);
  }
}
