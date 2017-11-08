import {Component, Input, ViewChild} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {PopupComponent} from 'app/ui';

export interface CollectionItem {
  label: string;
  id: string;
}

@Component({
  selector: 'wb-glance-view-collection-selector',
  templateUrl: './collection-selector.component.html',
  styleUrls: ['./collection-selector.component.less'],
})
export class CollectionSelectorComponent {
  @Input() selected: string;

  collections$ = new BehaviorSubject<CollectionItem[]>([]);

  @ViewChild('selectionListPopup') private popup: PopupComponent;

  constructor() {
    this.collections$.next([
      {
        id: '1',
        label: '大学英语四级',
      },
      {
        id: '2',
        label: '大学英语四级救命词汇',
      },
      {
        id: '3',
        label: '大学英语六级',
      },
      {
        id: '4',
        label: 'GRE考试必备',
      },
      {
        id: '5',
        label: '新GRE核心词汇',
      },
      {
        id: '6',
        label: '雅思必备',
      },
      {
        id: '7',
        label: '托福必备',
      },
    ]);
  }

  showPopup(): void {
    this.popup.showAsLocation({
      width: 'match-parent',
      background: true,
      positions: ['bottom'],
      animation: 'fadeInDown',
      // clearOnClick: false,
      clearOnOutsideClick: true,
    });
  }
}
