import {trigger} from '@angular/animations';
import {Component, HostBinding, ViewChild} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as $ from 'jquery';

import * as logger from 'logger';

import {PressDelegateEvent} from 'app/lib/touch-delegate';

import {DialogService} from 'app/ui';

import {PageComponent, pageTransitions} from 'app/core/ui';

const recycleBinTransition = trigger('recycleBinTransition', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.recycle-bin-view',
  templateUrl: './recycle-bin.view.html',
  styleUrls: ['./recycle-bin.view.less'],
  animations: [recycleBinTransition],
})
export class RecycleBinView {
  @ViewChild('page') page: PageComponent;

  @HostBinding('@recycleBinTransition') recycleBinTransition = '';

  recentWords$ = new BehaviorSubject<string[] | undefined>(undefined);
  moreWords$ = new BehaviorSubject<string[] | undefined>(undefined);

  constructor(private dialogService: DialogService) {
    this.recentWords$.next(['amount', 'whenever', 'Sweden', 'tennis']);

    this.moreWords$.next(['gradually', 'run away', 'safari', 'house']);
  }

  get isEmpty(): boolean {
    let recentWords = this.recentWords$.value;

    return !recentWords || recentWords.length === 0;
  }

  get hasMore(): boolean {
    let moreWords = this.moreWords$.value;

    return !!moreWords && moreWords.length > 0;
  }

  async recoveryAll(): Promise<void> {
    let confirmed = await this.dialogService.confirm('您确定要恢复回收站中的全部词条吗?');

    if (!confirmed) {
      return;
    }

    this.page.toggleHeaderExtension(false);

    // TODO: recovery all

    this.moreWords$.next(undefined);
    this.recentWords$.next(undefined);

    setTimeout(() => this.page.back(), 600);
  }

  async recoveryWord(word: string): Promise<void> {
    if (this.isEmpty) {
      return;
    }

    let confirmed = await this.dialogService.confirm(`您确定要恢复词条 ${word} 吗?`);

    if (!confirmed) {
      return;
    }

    let {recentWords$, moreWords$} = this;

    if (recentWords$.value!.indexOf(word) > -1) {
      recentWords$.next(this.removeArrayItem(recentWords$.value!, word));
    }

    if (this.hasMore && moreWords$.value!.indexOf(word) > -1) {
      moreWords$.next(this.removeArrayItem(moreWords$.value!, word));
    }
  }

  onContentAreaPressed(event: PressDelegateEvent): void {
    let $target = $(event.detail.originalEvent.target);

    let $wordButton = $target.closest('.word-button');

    if ($wordButton.length) {
      let word = $wordButton.text();

      this.recoveryWord(word).catch(logger.error);
    }
  }

  private removeArrayItem(list: string[], target: string): string[] {
    let listCopy = list.slice();

    listCopy.splice(list.indexOf(target), 1);

    return listCopy;
  }
}
