import {Injectable, NgZone} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {PronunciationType} from 'app/core/data';
import {SentenceTtsSpeed, StudyOrder, StudyScope} from 'app/core/engine';
import {DBStorage} from 'app/core/storage';

const SETTINGS_KEY = 'default';

export interface SettingsItemExtension {
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

export interface ExposedSettings {
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

export type SettingsItemName = keyof SettingsItemExtension;

export interface SettingsItem extends SettingsItemExtension {
  id: string;
}

@Injectable()
export class SettingsService {
  readonly storage$ = Observable.from(
    DBStorage.create<string, SettingsItem>({
      name: 'default',
      tableName: 'settings',
      primaryKeyType: 'text',
    }),
  );

  readonly settings$: Observable<ExposedSettings> = this.storage$
    .switchMap(async storage => {
      let {
        collectionIDs,
        studyScopes = [
          StudyScope.selected,
          StudyScope.wordsbook,
          StudyScope.other,
        ],
        dailyStudyPlan = 50,
        newWordsPriority = 0,
        studyOrder = StudyOrder.random,
        pronunciation = 'us',
        sentenceTtsSpeed = SentenceTtsSpeed.default,
        notification = true,
        obstinateEnhance = true,
        fixedStack = true,
        showGuide = true,
      } =
        (await storage.get(SETTINGS_KEY)) || ({} as SettingsItem);

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
    })
    .repeatWhen(() => this.storage$.switchMap(storage => storage.change$))
    .publishReplay(1)
    .refCount();

  readonly pronunciation$ = this.settings$
    .map(settings => settings.pronunciation)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly studyScopeSet$ = this.settings$
    .map(settings => settings.studyScopeSet)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly dailyStudyPlan$ = this.settings$
    .map(settings => settings.dailyStudyPlan)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly newWordsPriority$ = this.settings$
    .map(settings => settings.newWordsPriority)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly studyOrder$ = this.settings$
    .map(settings => settings.studyOrder)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly sentenceTtsSpeed$ = this.settings$
    .map(settings => settings.sentenceTtsSpeed)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly notification$ = this.settings$
    .map(settings => settings.notification)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly obstinateEnhance$ = this.settings$
    .map(settings => settings.obstinateEnhance)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly fixedStack$ = this.settings$
    .map(settings => settings.fixedStack)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly showGuide$ = this.settings$
    .map(settings => settings.showGuide)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  constructor(private zone: NgZone) {}

  async set(name: SettingsItemName, value: any): Promise<void> {
    let storage = await this.storage$.toPromise();
    let settings =
      (await storage.get(SETTINGS_KEY)) || ({id: SETTINGS_KEY} as SettingsItem);

    settings[name] = value;

    await storage.set(settings);

    setTimeout(() => this.zone.run(() => undefined), 10);
  }

  async reset(): Promise<void> {
    let storage = await this.storage$.toPromise();

    await storage.remove(SETTINGS_KEY);
  }
}
