import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {StudyScope} from 'app/core/engine';

import {SettingsService} from 'app/core/settings';

import {SelectionListPopupService, pageTransitions} from 'app/core/ui';

const settingsViewTransition = trigger('settingsViewTransition', [
  ...pageTransitions,
]);

const PRONUNCIATION_DESCRIPTION_MAP: Dict<string> = {
  us: '美音',
  gb: '英音',
};

@Component({
  selector: 'wb-view.settings-view',
  templateUrl: './settings.view.html',
  styleUrls: ['./settings.view.less'],
  animations: [settingsViewTransition],
})
export class SettingsView {
  @HostBinding('@settingsViewTransition') settingsViewTransition = '';

  readonly pronunciationDescription$ = this.settingsService.pronunciation$.map(
    pron => PRONUNCIATION_DESCRIPTION_MAP[pron || 'us'],
  );

  readonly studyScopesDescription$ = this.settingsService.studyScopeSet$.map(
    studyScopeSet => {
      if (
        studyScopeSet.has(StudyScope.selected) &&
        studyScopeSet.has(StudyScope.wordsbook) &&
        studyScopeSet.has(StudyScope.other)
      ) {
        return '已选词库、生词本和其他学过的单词';
      } else if (
        studyScopeSet.has(StudyScope.selected) &&
        studyScopeSet.has(StudyScope.wordsbook)
      ) {
        return '已选词库和生词本';
      } else if (studyScopeSet.has(StudyScope.wordsbook)) {
        return '仅已选词库';
      } else {
        return '其他学过的单词';
      }
    },
  );

  readonly dailyStudyPlansDescription$ = this.settingsService.dailyStudyPlan$.map(
    dailyStudyPlan => {
      if (dailyStudyPlan === 0) {
        return '自由学习';
      } else {
        return `第天学习${dailyStudyPlan}个新单词`;
      }
    },
  );

  readonly newWordsPriorityDescription$ = this.settingsService.newWordsPriority$.map(
    newWordsPriority => {
      if (newWordsPriority === 0) {
        return '新词优先';
      } else {
        return '复习优先';
      }
    },
  );

  constructor(
    public settingsService: SettingsService,
    private selectionListPopupService: SelectionListPopupService,
  ) {}

  async showPronSelectionListPopup(): Promise<void> {
    let pron = await new Promise<string>(resolve => {
      this.settingsService.pronunciation$.subscribe(resolve);
    });

    let values = await this.selectionListPopupService.show([
      {text: '美音', value: 'us', selected: pron === 'us'},
      {text: '英音', value: 'us', selected: pron === 'gb'},
    ]);

    if (!values) {
      return;
    }

    let selectedPron = values[0];

    if (selectedPron === pron) {
      return;
    }

    await this.settingsService.set('pronunciation', selectedPron);
  }

  async showStudyScopesSelectionListPopup(): Promise<void> {
    let studyScopeSet = await new Promise<Set<StudyScope>>(resolve => {
      this.settingsService.studyScopeSet$.subscribe(resolve);
    });

    let values = await this.selectionListPopupService.show([
      {
        text: '已选词库、生词本和其他学过的单词',
        value: [StudyScope.selected, StudyScope.wordsbook, StudyScope.other],
        selected:
          studyScopeSet.has(StudyScope.selected) &&
          studyScopeSet.has(StudyScope.wordsbook) &&
          studyScopeSet.has(StudyScope.other),
      },
      {
        text: '已选词库和生词本',
        value: [StudyScope.selected, StudyScope.wordsbook],
        selected:
          studyScopeSet.size === 2 &&
          studyScopeSet.has(StudyScope.selected) &&
          studyScopeSet.has(StudyScope.wordsbook),
      },
      {
        text: '仅已选词库',
        value: [StudyScope.selected],
        selected:
          studyScopeSet.size === 1 && studyScopeSet.has(StudyScope.selected),
      },
    ]);

    if (!values) {
      return;
    }

    let selectedStudyScopes = values[0];

    if (studyScopeSet.size === selectedStudyScopes.length) {
      return;
    }

    await this.settingsService.set('studyScopes', selectedStudyScopes);
  }

  async showDailyStudyPlanSelectionListPopup(): Promise<void> {
    let dailyStudyPlan = await new Promise<number>(resolve => {
      this.settingsService.dailyStudyPlan$.subscribe(resolve);
    });

    let values = await this.selectionListPopupService.show([
      {text: '自由学习', value: 0, selected: dailyStudyPlan === 0},
      {text: '20', value: 20, selected: dailyStudyPlan === 20},
      {text: '30', value: 30, selected: dailyStudyPlan === 30},
      {text: '50', value: 50, selected: dailyStudyPlan === 50},
      {text: '70', value: 70, selected: dailyStudyPlan === 70},
      {text: '100', value: 100, selected: dailyStudyPlan === 100},
      {text: '200', value: 200, selected: dailyStudyPlan === 200},
    ]);

    if (!values) {
      return;
    }

    let selectedDailyStudyPlan = values[0];

    if (selectedDailyStudyPlan === dailyStudyPlan) {
      return;
    }

    await this.settingsService.set('dailyStudyPlan', selectedDailyStudyPlan);
  }

  async showNewWordsPrioritySelectionListPopup(): Promise<void> {
    let newWordsPriority = await new Promise<number>(resolve => {
      this.settingsService.newWordsPriority$.subscribe(resolve);
    });

    let values = await this.selectionListPopupService.show([
      {text: '新词优先', value: 0, selected: newWordsPriority === 0},
      {text: '复习优先', value: 1, selected: newWordsPriority === 1},
    ]);

    if (!values) {
      return;
    }

    let selectedNewWordsPriority = values[0];

    if (selectedNewWordsPriority === newWordsPriority) {
      return;
    }

    await this.settingsService.set(
      'newWordsPriority',
      selectedNewWordsPriority,
    );
  }
}
