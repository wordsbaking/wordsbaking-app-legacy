import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {SentenceTtsSpeed, StudyOrder, StudyScope} from 'app/core/engine';

import {SettingsItemName, SettingsService} from 'app/core/settings';

import {PronunciationType} from 'app/core/data';

import {SelectionListPopupService, pageTransitions} from 'app/core/ui';

import * as settingConfig from './settings.config';

const settingsViewTransition = trigger('settingsViewTransition', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.settings-view',
  templateUrl: './settings.view.html',
  styleUrls: ['./settings.view.less'],
  animations: [settingsViewTransition],
})
export class SettingsView {
  @HostBinding('@settingsViewTransition') settingsViewTransition = '';

  readonly pronunciationDescription$ = this.settingsService.pronunciation$.map(
    pron => settingConfig.Pronunciation.getDescription(pron),
  );

  readonly studyScopesDescription$ = this.settingsService.studyScopeSet$.map(
    studyScopeSet => settingConfig.StudyScopes.getDescription(studyScopeSet),
  );

  readonly dailyStudyPlansDescription$ = this.settingsService.dailyStudyPlan$.map(
    dailyStudyPlan =>
      settingConfig.DailyStudyPlan.getDescription(dailyStudyPlan),
  );

  readonly newWordsPriorityDescription$ = this.settingsService.newWordsPriority$.map(
    newWordsPriority =>
      settingConfig.NewWordsPriority.getDescription(newWordsPriority),
  );

  readonly studyOrderDescription$ = this.settingsService.studyOrder$.map(
    studyOrder => settingConfig.StudyOrder.getDescription(studyOrder),
  );

  readonly sentenceTtsSpeedDescription$ = this.settingsService.sentenceTtsSpeed$.map(
    sentenceTtsSpeed =>
      settingConfig.SentenceTtsSpeed.getDescription(sentenceTtsSpeed),
  );

  constructor(
    public settingsService: SettingsService,
    private selectionListPopupService: SelectionListPopupService,
  ) {}

  selectPronunciation(): Promise<PronunciationType | undefined> {
    return this.selectSettingItemValue<
      PronunciationType | undefined
    >(
      'pronunciation',
      this.settingsService.pronunciation$,
      settingConfig.Pronunciation as typeof settingConfig.SettingItem,
    );
  }

  selectStudyScopes(): Promise<Set<StudyScope>> {
    return this.selectSettingItemValue<Set<StudyScope>>(
      'studyScopes',
      this.settingsService.studyScopeSet$,
      settingConfig.StudyScopes as typeof settingConfig.SettingItem,
    );
  }

  selectDailyStudyPlan(): Promise<number> {
    return this.selectSettingItemValue<number>(
      'dailyStudyPlan',
      this.settingsService.dailyStudyPlan$,
      settingConfig.DailyStudyPlan as typeof settingConfig.SettingItem,
    );
  }

  selectNewWordsPriority(): Promise<number> {
    return this.selectSettingItemValue<number>(
      'newWordsPriority',
      this.settingsService.newWordsPriority$,
      settingConfig.NewWordsPriority as typeof settingConfig.SettingItem,
    );
  }

  selectStudyOrder(): Promise<StudyOrder> {
    return this.selectSettingItemValue<StudyOrder>(
      'studyOrder',
      this.settingsService.studyOrder$,
      settingConfig.StudyOrder as typeof settingConfig.SettingItem,
    );
  }

  selectSentenceTtsSpeed(): Promise<SentenceTtsSpeed> {
    return this.selectSettingItemValue<SentenceTtsSpeed>(
      'sentenceTtsSpeed',
      this.settingsService.sentenceTtsSpeed$,
      settingConfig.SentenceTtsSpeed as typeof settingConfig.SettingItem,
    );
  }

  private async selectSettingItemValue<T>(
    key: SettingsItemName,
    value$: Observable<T>,
    settingItem: typeof settingConfig.SettingItem,
  ): Promise<T> {
    let value = await new Promise<T>(resolve => value$.subscribe(resolve));

    let selectedValues = await this.selectionListPopupService.show(
      settingItem.getSelectionListItems(value),
    );

    if (!selectedValues) {
      return value;
    }

    let selectedValue = selectedValues[0];

    if (selectedValue === value) {
      return value;
    }

    let newValue =
      selectedValue instanceof Set ? Array.from(selectedValue) : selectedValue;

    await this.settingsService.set(key, newValue);

    return selectedValue;
  }
}
