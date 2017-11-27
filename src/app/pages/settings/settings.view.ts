import {trigger} from '@angular/animations';
import {Component, HostBinding, ViewChild} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {PopupComponent} from 'app/ui';

import {SentenceTtsSpeed, StudyOrder, StudyScope} from 'app/core/engine';

import {SettingsItemName, SettingsService} from 'app/core/settings';

import {PronunciationType} from 'app/core/data';

import {SelectionListPopupService, pageTransitions} from 'app/core/ui';

import * as SettingsConfig from './settings.config';

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
  @ViewChild(PopupComponent) userManagerMenuPopupComponent: PopupComponent;

  @HostBinding('@settingsViewTransition') settingsViewTransition = '';

  readonly pronunciationDescription$ = this.settingsService.pronunciation$.map(
    pron => SettingsConfig.Pronunciation.getDescription(pron),
  );

  readonly studyScopesDescription$ = this.settingsService.studyScopeSet$.map(
    studyScopeSet => SettingsConfig.StudyScopes.getDescription(studyScopeSet),
  );

  readonly dailyStudyPlansDescription$ = this.settingsService.dailyStudyPlan$.map(
    dailyStudyPlan =>
      SettingsConfig.DailyStudyPlan.getDescription(dailyStudyPlan),
  );

  readonly newWordsPriorityDescription$ = this.settingsService.newWordsPriority$.map(
    newWordsPriority =>
      SettingsConfig.NewWordsPriority.getDescription(newWordsPriority),
  );

  readonly studyOrderDescription$ = this.settingsService.studyOrder$.map(
    studyOrder => SettingsConfig.StudyOrder.getDescription(studyOrder),
  );

  readonly sentenceTtsSpeedDescription$ = this.settingsService.sentenceTtsSpeed$.map(
    sentenceTtsSpeed =>
      SettingsConfig.SentenceTtsSpeed.getDescription(sentenceTtsSpeed),
  );

  readonly notificationDescription$ = this.settingsService.notification$.map(
    notification => SettingsConfig.Notification.getDescription(notification),
  );

  readonly obstinateEnhanceDescription$ = this.settingsService.obstinateEnhance$.map(
    obstinateEnhance =>
      SettingsConfig.ObstinateEnhance.getDescription(obstinateEnhance),
  );

  readonly fixedStackDescription$ = this.settingsService.fixedStack$.map(
    fixedStack => SettingsConfig.FixedStack.getDescription(fixedStack),
  );

  readonly showGuideDescription$ = this.settingsService.showGuide$.map(
    showGuide => SettingsConfig.ShowGuide.getDescription(showGuide),
  );

  constructor(
    public settingsService: SettingsService,
    private selectionListPopupService: SelectionListPopupService,
  ) {}

  showUserManagerMenuPopup(): void {
    this.userManagerMenuPopupComponent.showAsLocation({
      width: 'match-parent',
      positions: ['bottom'],
      animation: 'fadeInDown',
      background: true,
      margin: 0,
      clearOnClick: true,
    });
  }

  togglePronunciation(): Promise<PronunciationType | undefined> {
    return this.toggleSettingItemValue<
      PronunciationType | undefined
    >(
      'pronunciation',
      this.settingsService.pronunciation$,
      SettingsConfig.Pronunciation as typeof SettingsConfig.SettingItem,
    );
  }

  toggleStudyScopes(): Promise<Set<StudyScope>> {
    return this.toggleSettingItemValue<Set<StudyScope>>(
      'studyScopes',
      this.settingsService.studyScopeSet$,
      SettingsConfig.StudyScopes as typeof SettingsConfig.SettingItem,
    );
  }

  toggleDailyStudyPlan(): Promise<number> {
    return this.toggleSettingItemValue<number>(
      'dailyStudyPlan',
      this.settingsService.dailyStudyPlan$,
      SettingsConfig.DailyStudyPlan as typeof SettingsConfig.SettingItem,
    );
  }

  toggleNewWordsPriority(): Promise<number> {
    return this.toggleSettingItemValue<number>(
      'newWordsPriority',
      this.settingsService.newWordsPriority$,
      SettingsConfig.NewWordsPriority as typeof SettingsConfig.SettingItem,
    );
  }

  toggleStudyOrder(): Promise<StudyOrder> {
    return this.toggleSettingItemValue<StudyOrder>(
      'studyOrder',
      this.settingsService.studyOrder$,
      SettingsConfig.StudyOrder as typeof SettingsConfig.SettingItem,
    );
  }

  toggleSentenceTtsSpeed(): Promise<SentenceTtsSpeed> {
    return this.toggleSettingItemValue<SentenceTtsSpeed>(
      'sentenceTtsSpeed',
      this.settingsService.sentenceTtsSpeed$,
      SettingsConfig.SentenceTtsSpeed as typeof SettingsConfig.SettingItem,
    );
  }

  toggleNotification(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'notification',
      this.settingsService.notification$,
      SettingsConfig.Notification as typeof SettingsConfig.SettingItem,
      force,
    );
  }

  toggleObstinateEnhance(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'obstinateEnhance',
      this.settingsService.obstinateEnhance$,
      SettingsConfig.ObstinateEnhance as typeof SettingsConfig.SettingItem,
      force,
    );
  }

  toggleFixedStack(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'fixedStack',
      this.settingsService.fixedStack$,
      SettingsConfig.FixedStack as typeof SettingsConfig.SettingItem,
      force,
    );
  }

  toggleShowGuide(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'showGuide',
      this.settingsService.showGuide$,
      SettingsConfig.ShowGuide as typeof SettingsConfig.SettingItem,
      force,
    );
  }

  private async toggleSettingItemValue<T>(
    key: SettingsItemName,
    value$: Observable<T>,
    settingItem: typeof SettingsConfig.SettingItem,
    force?: T,
  ): Promise<T> {
    let currentValue = await new Promise<T>(resolve =>
      value$.subscribe(resolve),
    );

    let nextValue: T;

    if (typeof currentValue !== 'boolean') {
      if (force === undefined) {
        let selectedValues = await this.selectionListPopupService.show(
          settingItem.getSelectionListItems(currentValue),
        );

        if (!selectedValues) {
          return currentValue;
        }

        nextValue = selectedValues[0];
      } else {
        nextValue = force;
      }
    } else {
      nextValue = (force === undefined ? !currentValue : force) as T;
    }

    if (nextValue === currentValue) {
      return currentValue;
    }

    await this.settingsService.set(key, settingItem.convertValue(nextValue));

    return nextValue;
  }
}
