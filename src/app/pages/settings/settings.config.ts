import {PronunciationType} from 'app/core/data';
import {
  SentenceTtsSpeed as SentenceTtsSpeedEnum,
  StudyOrder as StudyOrderEnum,
  StudyScope,
} from 'app/core/engine';
import {SelectionListPopup} from 'app/core/ui';

export interface SettingItemConfig<T> {
  getSelectionListItems(): SelectionListPopup.ListItem<T>[];
}

export abstract class SettingItem<T> {
  protected abstract list: SelectionListPopup.ListItem<T>[];

  protected constructor() {}

  protected getDescription(value: T): string {
    for (let item of this.list) {
      if (this.compare(item.value as T, value)) {
        return item.text;
      }
    }

    return '未知';
  }

  protected getSelectionListItems(
    selectedValue: T,
  ): SelectionListPopup.ListItem<T>[] {
    return this.list.map(item => ({
      ...item,
      selected: this.compare(item.value as T, selectedValue),
    }));
  }

  protected compare(a: T, b: T): boolean {
    return a === b;
  }

  static getDescription<T>(value: T): string {
    return this.getInstance<T>().getDescription(value);
  }

  static getSelectionListItems<T>(
    selectedValue: T,
  ): SelectionListPopup.ListItem<T>[] {
    return this.getInstance<T>().getSelectionListItems(selectedValue);
  }

  protected static instance: SettingItem<any>;

  protected static getInstance<T>(): SettingItem<T> {
    let constructor: any = this;

    if (!this.instance) {
      this.instance = new constructor();
    }

    return this.instance;
  }
}

export class Pronunciation extends SettingItem<PronunciationType> {
  protected list: SelectionListPopup.ListItem<PronunciationType>[] = [
    {text: '美音', value: 'us'},
    {text: '英音', value: 'gb'},
  ];
}

export class StudyScopes extends SettingItem<Set<StudyScope>> {
  protected list: SelectionListPopup.ListItem<Set<StudyScope>>[] = [
    {
      text: '已选词库、生词本和其他学过的单词',
      value: new Set([
        StudyScope.selected,
        StudyScope.wordsbook,
        StudyScope.other,
      ]),
    },
    {
      text: '已选词库和生词本',
      value: new Set([StudyScope.selected, StudyScope.wordsbook]),
    },
    {
      text: '仅已选词库',
      value: new Set([StudyScope.selected]),
    },
  ];

  protected compare(a: Set<StudyScope>, b: Set<StudyScope>): boolean {
    if (a.size !== b.size) {
      return false;
    }

    for (let item of a) {
      if (!b.has(item)) {
        return false;
      }
    }

    return true;
  }
}

export class DailyStudyPlan extends SettingItem<number> {
  protected list: SelectionListPopup.ListItem<number>[] = [
    {text: '自由学习', value: 0},
    {text: '20', value: 20},
    {text: '30', value: 30},
    {text: '50', value: 50},
    {text: '70', value: 70},
    {text: '100', value: 100},
    {text: '200', value: 200},
  ];

  protected getDescription(value: number): string {
    if (value === 0) {
      return '自由学习';
    } else {
      return `每天学习${value}个新单词`;
    }
  }
}

export class NewWordsPriority extends SettingItem<number> {
  protected list: SelectionListPopup.ListItem<number>[] = [
    {text: '新词优先', value: 0},
    {text: '复习优先', value: 1},
  ];
}

export class StudyOrder extends SettingItem<StudyOrderEnum> {
  protected list: SelectionListPopup.ListItem<StudyOrderEnum>[] = [
    {text: '随机排序', value: StudyOrderEnum.random},
    {text: '字母顺序', value: StudyOrderEnum.letterAscending},
    {text: '字母倒序', value: StudyOrderEnum.letterDescending},
  ];
}

export class SentenceTtsSpeed extends SettingItem<SentenceTtsSpeedEnum> {
  protected list: SelectionListPopup.ListItem<SentenceTtsSpeedEnum>[] = [
    {text: '默认', value: SentenceTtsSpeedEnum.default},
    {text: '较慢', value: SentenceTtsSpeedEnum.slower},
    {text: '死慢', value: SentenceTtsSpeedEnum.verySlow},
  ];
}
