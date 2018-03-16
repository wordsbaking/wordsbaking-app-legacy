import {trigger} from '@angular/animations';
import {Component, HostBinding, OnDestroy, ViewChild} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';

import * as $ from 'jquery';

import * as logger from 'logger';

import {PressDelegateEvent} from 'app/lib/touch-delegate';

import {DialogService, LoadingService} from 'app/ui';

import {EngineService} from 'app/core/engine';
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
export class RecycleBinView implements OnDestroy {
  @ViewChild('page') page: PageComponent;

  @HostBinding('@recycleBinTransition') recycleBinTransition = 'all';

  recentWords$ = new BehaviorSubject<string[] | undefined>(undefined);
  moreWords$ = new BehaviorSubject<string[] | undefined>(undefined);

  private subscription = new Subscription();

  constructor(
    private dialogService: DialogService,
    private engineService: EngineService,
    private loadingService: LoadingService,
  ) {
    this.engineService.load$.first().subscribe(() => {
      let removedTermsInfo = this.engineService.getRemovedTermsInfo();

      this.recentWords$.next(Array.from(new Set(removedTermsInfo.recent)));
      this.moreWords$.next(Array.from(new Set(removedTermsInfo.more)));
    });
  }

  get isEmpty(): boolean {
    let recentWords = this.recentWords$.value;

    return !recentWords || recentWords.length === 0;
  }

  get hasMore(): boolean {
    let moreWords = this.moreWords$.value;

    return !!moreWords && moreWords.length > 0;
  }

  async restoreAll(): Promise<void> {
    let confirmed = await this.dialogService.confirm('您确定要恢复回收站中的全部词条吗?');

    if (!confirmed) {
      return;
    }

    this.page.toggleHeaderExtension(false);

    let handler = this.loadingService.show('恢复中...');

    await this.engineService.restoreAll();

    this.moreWords$.next(undefined);
    this.recentWords$.next(undefined);

    handler.clear();
    setTimeout(() => this.page.back(), 600);
  }

  async restoreWord(word: string): Promise<void> {
    if (this.isEmpty) {
      return;
    }

    let confirmed = await this.dialogService.confirm(`您确定要恢复词条 ${word} 吗?`);

    if (!confirmed) {
      return;
    }

    let {recentWords$, moreWords$} = this;
    let recentWords = recentWords$.value!.slice();
    let moreWords = moreWords$.value!.slice();

    if (recentWords.indexOf(word) > -1) {
      let newRecentWords = this.removeArrayItem(recentWords, word);

      if (moreWords.length) {
        newRecentWords.push(moreWords.shift()!);
        moreWords$.next(moreWords);
      }

      recentWords$.next(newRecentWords);
      moreWords$.next(moreWords);
    }

    if (moreWords.length && moreWords.indexOf(word) > -1) {
      moreWords$.next(this.removeArrayItem(moreWords, word));
    }

    await this.engineService.restore(word);
  }

  onContentAreaPressed(event: PressDelegateEvent): void {
    let $target = $(event.detail.originalEvent.target);

    let $wordButton = $target.closest('.word-button');

    if ($wordButton.length) {
      let word = $wordButton.text();

      this.restoreWord(word).catch(logger.error);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private removeArrayItem(list: string[], target: string): string[] {
    let listCopy = list.slice();

    listCopy.splice(list.indexOf(target), 1);

    return listCopy;
  }
}
