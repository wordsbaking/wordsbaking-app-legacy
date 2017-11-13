import {Component, Input, ViewChild} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {PopupComponent} from 'app/ui';

import {CollectionInfo} from 'app/core/engine';

@Component({
  selector: 'wb-glance-view-collection-selector',
  templateUrl: './collection-selector.component.html',
  styleUrls: ['./collection-selector.component.less'],
})
export class CollectionSelectorComponent {
  @Input() selected: CollectionInfo | undefined;

  collections$ = new BehaviorSubject<CollectionInfo[]>([]);

  @ViewChild('selectionListPopup') private popup: PopupComponent;

  constructor() {
    this.collections$.next([
      {
        id: '1',
        name: '大学英语四级',
      },
      {
        id: '2',
        name: '大学英语四级救命词汇',
      },
      {
        id: '3',
        name: '大学英语六级',
      },
      {
        id: '4',
        name: 'GRE考试必备',
      },
      {
        id: '5',
        name: '新GRE核心词汇',
      },
      {
        id: '6',
        name: '雅思必备',
      },
      {
        id: '7',
        name: '托福必备',
      },
    ]);
  }

  showPopup(): void {
    this.popup.showAsLocation({
      width: 'match-parent',
      background: true,
      positions: ['bottom'],
      animation: 'fadeInDown',
      clearOnOutsideClick: true,
    });
  }

  onSelectionListChange(values: string[]) {
    let selectedId = values[0];

    if (!selectedId) {
      return;
    }

    for (let item of this.collections$.value) {
      if (selectedId === item.id) {
        this.selected = item;
      }
    }

    this.popup.clear();
  }

  trackById(_index: number, item: CollectionInfo): string {
    return item.id;
  }
}
