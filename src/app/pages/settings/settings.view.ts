import {trigger} from '@angular/animations';
import {Component, HostBinding, ViewChild} from '@angular/core';
import * as moment from 'moment';

import {Observable} from 'rxjs/Observable';

import {DialogService, PopupComponent} from 'app/ui';

import {
  SettingsConfigService,
  SettingsRawConfig,
  UserConfigService,
} from 'app/core/config';
import {AuthConfigService} from 'app/core/config/auth';
import {PronunciationType, SyncService} from 'app/core/data';
import {SentenceTtsSpeed, StudyOrder, StudyScope} from 'app/core/engine';
import {SelectionListPopupService, pageTransitions} from 'app/core/ui';
import {UserService} from 'app/core/user';

import * as SettingsConfig from './settings-config';

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

  readonly lastSyncTimeDescription$ = this.syncService.lastSyncTime$.map(
    time => {
      if (time) {
        return moment(time).format('YYYY年MM月DD日 HH:mm:ss');
      } else {
        return '等待同步中...';
      }
    },
  );

  readonly pronunciationDescription$ = this.settingsConfigService.pronunciation$.map(
    pron => SettingsConfig.Pronunciation.getDescription(pron),
  );

  readonly studyScopesDescription$ = this.settingsConfigService.studyScopeSet$.map(
    studyScopeSet => SettingsConfig.StudyScopes.getDescription(studyScopeSet),
  );

  readonly dailyStudyPlansDescription$ = this.settingsConfigService.dailyStudyPlan$.map(
    dailyStudyPlan =>
      SettingsConfig.DailyStudyPlan.getDescription(dailyStudyPlan),
  );

  readonly newWordsPriorityDescription$ = this.settingsConfigService.newWordsPriority$.map(
    newWordsPriority =>
      SettingsConfig.NewWordsPriority.getDescription(newWordsPriority),
  );

  readonly studyOrderDescription$ = this.settingsConfigService.studyOrder$.map(
    studyOrder => SettingsConfig.StudyOrder.getDescription(studyOrder),
  );

  readonly sentenceTtsSpeedDescription$ = this.settingsConfigService.sentenceTtsSpeed$.map(
    sentenceTtsSpeed =>
      SettingsConfig.SentenceTtsSpeed.getDescription(sentenceTtsSpeed),
  );

  readonly notificationDescription$ = this.settingsConfigService.notification$.map(
    notification => SettingsConfig.Notification.getDescription(notification),
  );

  readonly obstinateEnhanceDescription$ = this.settingsConfigService.obstinateEnhance$.map(
    obstinateEnhance =>
      SettingsConfig.ObstinateEnhance.getDescription(obstinateEnhance),
  );

  readonly fixedStackDescription$ = this.settingsConfigService.fixedStack$.map(
    fixedStack => SettingsConfig.FixedStack.getDescription(fixedStack),
  );

  readonly showGuideDescription$ = this.settingsConfigService.showGuide$.map(
    showGuide => SettingsConfig.ShowGuide.getDescription(showGuide),
  );

  get appVersion(): string {
    return `${APP_PROFILE.version.name}${APP_PROFILE.version.beta
      ? ' (beta)'
      : ''}`;
  }

  constructor(
    private selectionListPopupService: SelectionListPopupService,
    private dialogService: DialogService,
    private userService: UserService,
    private syncService: SyncService,
    public settingsConfigService: SettingsConfigService,
    public authConfigService: AuthConfigService,
    public userConfigService: UserConfigService,
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
    return this.toggleSettingItemValue<PronunciationType | undefined>(
      'pronunciation',
      this.settingsConfigService.pronunciation$,
      SettingsConfig.Pronunciation,
    );
  }

  toggleStudyScopes(): Promise<Set<StudyScope>> {
    return this.toggleSettingItemValue<Set<StudyScope>>(
      'studyScopes',
      this.settingsConfigService.studyScopeSet$,
      SettingsConfig.StudyScopes,
    );
  }

  toggleDailyStudyPlan(): Promise<number> {
    return this.toggleSettingItemValue<number>(
      'dailyStudyPlan',
      this.settingsConfigService.dailyStudyPlan$,
      SettingsConfig.DailyStudyPlan,
    );
  }

  toggleNewWordsPriority(): Promise<number> {
    return this.toggleSettingItemValue<number>(
      'newWordsPriority',
      this.settingsConfigService.newWordsPriority$,
      SettingsConfig.NewWordsPriority,
    );
  }

  toggleStudyOrder(): Promise<StudyOrder> {
    return this.toggleSettingItemValue<StudyOrder>(
      'studyOrder',
      this.settingsConfigService.studyOrder$,
      SettingsConfig.StudyOrder,
    );
  }

  toggleSentenceTtsSpeed(): Promise<SentenceTtsSpeed> {
    return this.toggleSettingItemValue<SentenceTtsSpeed>(
      'sentenceTtsSpeed',
      this.settingsConfigService.sentenceTtsSpeed$,
      SettingsConfig.SentenceTtsSpeed,
    );
  }

  toggleNotification(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'notification',
      this.settingsConfigService.notification$,
      SettingsConfig.Notification,
      force,
    );
  }

  toggleObstinateEnhance(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'obstinateEnhance',
      this.settingsConfigService.obstinateEnhance$,
      SettingsConfig.ObstinateEnhance,
      force,
    );
  }

  toggleFixedStack(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'fixedStack',
      this.settingsConfigService.fixedStack$,
      SettingsConfig.FixedStack,
      force,
    );
  }

  toggleShowGuide(force?: boolean): Promise<boolean> {
    return this.toggleSettingItemValue(
      'showGuide',
      this.settingsConfigService.showGuide$,
      SettingsConfig.ShowGuide,
      force,
    );
  }

  async signOut(): Promise<void> {
    this.userManagerMenuPopupComponent.clear();

    let confirmed = await this.dialogService.confirm('确定退出登录吗?');

    if (confirmed) {
      await this.userService.signOut();
    }
  }

  private async toggleSettingItemValue<T>(
    key: keyof SettingsRawConfig,
    value$: Observable<T>,
    settingItem: SettingsConfig.SettingItemStatic,
    force?: T,
  ): Promise<T> {
    let currentValue = await value$.first().toPromise();

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

    await this.settingsConfigService.set(
      key,
      settingItem.convertValue(nextValue),
    );

    return nextValue;
  }
}
