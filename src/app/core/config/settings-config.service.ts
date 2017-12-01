import {Injectable, OnDestroy} from '@angular/core';

import {PronunciationType, SyncService} from 'app/core/data';
import {SentenceTtsSpeed, StudyOrder, StudyScope} from 'app/core/engine';

import {ConfigGroup} from './config-group';

export interface SettingsRawConfig {
  collectionIDs?: string[];
  studyScopes?: StudyScope[];
  dailyStudyPlan?: number;
  newWordsPriority?: number;
  studyOrder?: StudyOrder;
  sentenceTtsSpeed?: SentenceTtsSpeed;
  pronunciation?: PronunciationType;
  notification?: boolean;
  obstinateEnhance?: boolean;
  fixedStack?: boolean;
  showGuide?: boolean;
}

export interface SettingsConfig {
  collectionIDSet: Set<string>;
  studyScopeSet: Set<StudyScope>;
  dailyStudyPlan: number;
  newWordsPriority: number;
  studyOrder: StudyOrder;
  sentenceTtsSpeed: SentenceTtsSpeed;
  pronunciation: PronunciationType;
  notification: boolean;
  obstinateEnhance: boolean;
  fixedStack: boolean;
  showGuide: boolean;
}

@Injectable()
export class SettingsConfigService extends ConfigGroup<
  SettingsConfig,
  SettingsRawConfig
> implements OnDestroy {
  readonly collectionIDSet$ = this.getObservable('collectionIDSet');
  readonly studyScopeSet$ = this.getObservable('studyScopeSet');
  readonly dailyStudyPlan$ = this.getObservable('dailyStudyPlan');
  readonly newWordsPriority$ = this.getObservable('newWordsPriority');
  readonly studyOrder$ = this.getObservable('studyOrder');
  readonly sentenceTtsSpeed$ = this.getObservable('sentenceTtsSpeed');
  readonly pronunciation$ = this.getObservable('pronunciation');
  readonly notification$ = this.getObservable('notification');
  readonly obstinateEnhance$ = this.getObservable('obstinateEnhance');
  readonly fixedStack$ = this.getObservable('fixedStack');
  readonly showGuide$ = this.getObservable('showGuide');

  constructor(syncService: SyncService) {
    super('settings', syncService, syncService.settings);

    this.subscription.add(
      this.collectionIDSet$
        .switchMap(async idSet => {
          let hasNew = false;

          for (let id of idSet) {
            let added = await syncService.addPassive(
              syncService.collections,
              id,
            );

            if (added && !hasNew) {
              hasNew = added;
            }
          }

          if (hasNew) {
            await syncService.sync();
          }
        })
        .subscribe(),
    );
  }

  transformRaw({
    collectionIDs,
    studyScopes = [StudyScope.selected, StudyScope.wordsbook, StudyScope.other],
    dailyStudyPlan = 50,
    newWordsPriority = 0,
    studyOrder = StudyOrder.random,
    pronunciation = 'us',
    sentenceTtsSpeed = SentenceTtsSpeed.default,
    notification = true,
    obstinateEnhance = true,
    fixedStack = true,
    showGuide = true,
  }: SettingsRawConfig): SettingsConfig {
    return {
      collectionIDSet: new Set(collectionIDs),
      studyScopeSet: new Set(studyScopes),
      dailyStudyPlan,
      newWordsPriority,
      studyOrder,
      pronunciation,
      sentenceTtsSpeed,
      notification,
      obstinateEnhance,
      fixedStack,
      showGuide,
    };
  }
}
