import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {StudyOrder, StudyScope} from 'app/core/engine';
import {DBStorage} from 'app/core/storage';

// @Injectable()
// export class SettingsService {
//   readonly selectedCollectionIDs$: Observable<string[]>;
//   readonly studyScopeSet$: Observable<Set<StudyScope>>;

//   readonly dailyStudyPlan$: Observable<number>;

//   constructor() {}
// }

const SETTINGS_KEY = 'default';

export interface SettingsItemExtension {
  collectionIDs?: string[];
  studyScopes?: StudyScope[];
  dailyStudyPlan?: number;
  newWordsPriority?: number;
  studyOrder?: StudyOrder;
}

export interface ExposedSettings {
  collectionIDSet: Set<string>;
  studyScopeSet: Set<StudyScope>;
  dailyStudyPlan: number;
  newWordsPriority: number;
  studyOrder: StudyOrder;
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
        studyScopes,
        dailyStudyPlan = 40,
        newWordsPriority = 0,
        studyOrder = StudyOrder.random,
      } =
        (await storage.get(SETTINGS_KEY)) || ({} as SettingsItem);

      return {
        collectionIDSet: new Set(collectionIDs),
        studyScopeSet: new Set(studyScopes),
        dailyStudyPlan,
        newWordsPriority,
        studyOrder,
      };
    })
    .repeatWhen(() => this.storage$.map(storage => storage.change$))
    .publishReplay(1)
    .refCount();

  // readonly syncAt$ = this.settings$
  //   .map(settings => settings.syncAt)
  //   .distinctUntilChanged()
  //   .publishReplay(1)
  //   .refCount();

  async set(name: SettingsItemName, value: any): Promise<void> {
    let storage = await this.storage$.toPromise();
    let settings = (await storage.get(SETTINGS_KEY)) || ({} as SettingsItem);

    settings[name] = value;

    await storage.set(settings);
  }

  async reset(): Promise<void> {
    let storage = await this.storage$.toPromise();

    await storage.remove(SETTINGS_KEY);
  }
}
