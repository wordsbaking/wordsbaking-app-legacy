import {Component, Input} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as logger from 'logger';

import {CollectionInfo} from 'app/core/engine';

import {SelectionListPopup, SelectionListPopupService} from 'app/core/ui';

@Component({
  selector: 'wb-glance-view-collection-selector',
  templateUrl: './collection-selector.component.html',
  styleUrls: ['./collection-selector.component.less'],
})
export class CollectionSelectorComponent {
  @Input() selected: CollectionInfo | undefined;

  collections$ = new BehaviorSubject<CollectionInfo[]>([]);

  constructor(private selectionListPopupService: SelectionListPopupService) {
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
    this.selectionListPopupService
      .show(
        this.collections$.value.map<
          SelectionListPopup.ListItem<string>
        >(item => ({
          text: item.name,
          value: item.id,
          selected: this.selected && this.selected.id === item.id,
        })),
      )
      .then(values => this.onSelectionListChange(values))
      .catch(logger.error);
  }

  onSelectionListChange(values: string[] | undefined) {
    if (!values) {
      return;
    }

    let selectedId = values[0];

    if (!selectedId) {
      return;
    }

    for (let item of this.collections$.value) {
      if (selectedId === item.id) {
        this.selected = item;
      }
    }
  }
}
