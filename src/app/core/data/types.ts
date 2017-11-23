import {DBStorageItem} from 'app/core/storage';

export type DataEntryType = 'value' | 'accumulation';

export interface UpdateItem {
  id: string;
  type?: DataEntryType;
  updateAt: TimeNumber;
  data: any;
  removed?: true;
}

export interface Item<T> extends DBStorageItem<string> {
  data: T;
  removed?: true;
}

export interface CollectionData {
  name: string;
  terms: string[];
}

export interface RecordData {}

export abstract class DataEntryTypeDefinition {
  constructor(readonly name: DataEntryType) {}

  abstract merge(data: any, updateData: any): any;
  abstract combine(updateDataA: any, updateDataB: any): any;
  abstract markSynced(updateData: any): boolean;
}

export class ValueDataEntryTypeDefinition extends DataEntryTypeDefinition {
  constructor() {
    super('value');
  }

  merge(_value: any, updateValue: any): any {
    return updateValue;
  }

  combine(_a: any, b: any): any {
    return b;
  }

  markSynced(): boolean {
    return false;
  }
}

export interface AccumulationUpdateData {
  id: any;
  value: any;
  /** Possibly synced but didn't end successful. */
  synced?: true;
}

export class AccumulationDataEntryTypeDefinition extends DataEntryTypeDefinition {
  constructor() {
    super('accumulation');
  }

  merge(data: any, updateData: AccumulationUpdateData[]): any {
    return updateData.reduce(
      (data, singleUpdateData) => this.accumulate(data, singleUpdateData.value),
      data,
    );
  }

  combine(
    updateDataA: AccumulationUpdateData[],
    updateDataB: AccumulationUpdateData[],
  ): any {
    let lastSingleA = updateDataA[updateDataA.length - 1];

    if (updateDataB.length > 1) {
      throw new Error('unexpected updateDataB length');
    }

    let singleB = updateDataB[0];
    let updateData: AccumulationUpdateData[];

    if (lastSingleA.synced) {
      lastSingleA = {
        id: singleB.id,
        value: singleB.value,
      };

      updateData = [...updateDataA, lastSingleA];
    } else {
      lastSingleA.id = singleB.id;
      lastSingleA.value = this.accumulate(lastSingleA.value, singleB.value);
      updateData = [...updateDataA];
    }

    return updateData;
  }

  markSynced(updateData: AccumulationUpdateData[]): boolean {
    let lastSingle = updateData[updateData.length - 1];

    if (lastSingle.synced) {
      return false;
    }

    lastSingle.synced = true;
    return true;
  }

  protected accumulate(a: any, b: any): any {
    return (a || (typeof b === 'string' ? '' : 0)) + b;
  }
}

export class DataEntryTypeManager {
  private map = new Map<DataEntryType, DataEntryTypeDefinition>();

  get(type: DataEntryType | undefined): DataEntryTypeDefinition | undefined {
    return this.map.get(type || 'value');
  }

  register(definition: DataEntryTypeDefinition): void {
    this.map.set(definition.name, definition);
  }
}
