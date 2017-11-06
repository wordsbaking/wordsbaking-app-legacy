import * as v from 'villa';

const PRIMARY_KEY = 'id';
const JSON_KEY = '_json';
const MAX_VARIABLES_NUMBER = 999;
const MAX_BATCH_SIZE = 250;

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type SetMultipleProgressHandler = (done: number, total: number) => void;

export interface DBStorageItem<K extends string | number> {
  id: K;
}

export interface DBStorageCreateOptions {
  name?: string;
  tableName?: string;
  /** Defaults to 'integer'. */
  primaryType?: string;
  indexSchema?: Dict<string>;
}

export class DBStorage<K extends string | number> {
  private constructor(
    readonly db: Database,
    readonly columns: string[],
    readonly tableName: string,
  ) {}

  async exec(queries: string[], argsArray?: any[][]): Promise<SQLResultSet>;
  async exec(query: string, args?: any[]): Promise<SQLResultSet>;
  async exec(
    queries: string | string[],
    argsArray: any[] = [],
  ): Promise<SQLResultSet> {
    return v.lock(this, async () => {
      if (typeof queries === 'string') {
        queries = [queries];
        argsArray = [argsArray];
      }

      let result: SQLResultSet;

      return new Promise<SQLResultSet>((resolve, reject) => {
        this.db.transaction(
          transaction => {
            for (let i = 0; i < queries.length; i++) {
              let query = queries[i];
              let args = argsArray[i];

              if (i < queries.length - 1) {
                transaction.executeSql(query, args);
              } else {
                transaction.executeSql(
                  query,
                  args,
                  (_transaction, resultSet) => {
                    result = resultSet;
                  },
                );
              }
            }
          },
          error => reject(error),
          () => resolve(result),
        );
      });
    });
  }

  async get<T extends DBStorageItem<K>>(id: K): Promise<T | undefined> {
    let {rows} = await this.exec(
      `select * from "${this.tableName}" where "${PRIMARY_KEY}"=?`,
      [id],
    );

    if (!rows.length) {
      return undefined;
    }

    let row = rows.item(0);

    return this.buildItem<T>(row);
  }

  async getAll<T extends DBStorageItem<K>>(): Promise<T[]> {
    let {rows} = await this.exec(`select * from "${this.tableName}"`);

    let items: T[] = [];

    for (let i = 0; i < rows.length; i++) {
      let row = rows.item(i);
      let item = this.buildItem<T>(row);
      items.push(item);
    }

    return items;
  }

  async getIDs(): Promise<K[]> {
    let {rows} = await this.exec(
      `select "${PRIMARY_KEY}" from "${this.tableName}"`,
    );

    let ids: K[] = [];

    for (let i = 0; i < rows.length; i++) {
      let item = rows.item(i);
      ids.push(item[PRIMARY_KEY]);
    }

    return ids;
  }

  async set(id: K, value: DBStorageItem<K>): Promise<void>;
  async set(item: DBStorageItem<K>): Promise<void>;
  async set(id: K | DBStorageItem<K>, item?: DBStorageItem<K>): Promise<void> {
    if (typeof id === 'object') {
      item = id;
      id = item[PRIMARY_KEY];
    }

    let extraVariables: string[] = [];
    let extraColumns: string[] = [];
    let extraValues: any[] = [];

    item = {...item} as DBStorageItem<K>;

    delete item[PRIMARY_KEY];

    let columns = this.columns;

    for (let column of columns) {
      extraVariables.push('?,');
      extraColumns.push(`"${column}",`);
      extraValues.push((item as any)[column]);

      delete (item as any)[column];
    }

    let json = JSON.stringify(item);

    extraValues.push(json);

    let query = `\
insert or replace into "${this.tableName}" (
  "${PRIMARY_KEY}", ${extraColumns.join('\n  ')} "${JSON_KEY}"
)
values (
  ?, ${extraVariables.join('\n  ')} ?
)`;

    await this.exec(query, [id].concat(extraValues));
  }

  async setMultiple(
    items: DBStorageItem<K>[],
    progress?: SetMultipleProgressHandler,
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    items = [...items];

    let columns = [PRIMARY_KEY, ...this.columns];

    let unionVariables: string[] = [];

    let queryBase = `\
insert or replace into "${this.tableName}"
select ${[...columns, JSON_KEY]
      .map(column => {
        unionVariables.push('?');
        return `? as "${column}"`;
      })
      .join(', ')}`;

    let queryUnion = ` union select ${unionVariables.join(', ')}`;

    let total = items.length;
    let done = 0;

    let itemGroups: DBStorageItem<K>[][] = [];

    // it's said somewhere that sqlite handles 500 at most every single time
    // though in the sqlite plugin it's set to 250...
    // 999 is the max number of "?" (variables).
    let batchSize = Math.min(
      Math.floor(MAX_VARIABLES_NUMBER / unionVariables.length),
      MAX_BATCH_SIZE,
    );

    while (items.length) {
      itemGroups.push(items.splice(0, batchSize));
    }

    for (let items of itemGroups) {
      done += items.length;

      if (items.length === 1) {
        await this.set(items[0]);

        if (progress) {
          progress(done, total);
        }

        continue;
      }

      let query = queryBase + Array(items.length /* - 1 + 1*/).join(queryUnion);
      let values: any[] = [];

      for (let item of items) {
        item = {...item} as DBStorageItem<K>;

        for (let column of columns) {
          if (hasOwnProperty.call(item, column)) {
            values.push((item as any)[column]);
            delete (item as any)[column];
          } else {
            // tslint:disable-next-line:no-null-keyword
            values.push(null);
          }
        }

        values.push(JSON.stringify(item));
      }

      await this.exec(query, values);

      if (progress) {
        progress(done, total);
      }
    }
  }

  async insert<T extends DBStorageItem<K>>(item: T): Promise<number> {
    let extraVariables: string[] = [];
    let extraColumns: string[] = [];
    let extraValues: any[] = [];

    item = {...(item as DBStorageItem<K>)} as T;

    let columns = this.columns.concat();

    if (item[PRIMARY_KEY] !== null) {
      columns.push(PRIMARY_KEY);
    }

    for (let column of columns) {
      extraVariables.push('?,');
      extraColumns.push(`"${column}",`);
      extraValues.push((item as any)[column]);

      delete (item as any)[column];
    }

    let json = JSON.stringify(item);
    extraValues.push(json);

    let query = `\
insert or replace into "${this.tableName}" (
  ${extraColumns.join(' ')} "${JSON_KEY}"
)
values (
  ${extraVariables.join(' ')} ?
)`;

    // console.log(query);
    // console.log(extraValues);

    let {insertId} = await this.exec(query, extraValues);

    return insertId;
  }

  async remove(id: K): Promise<void> {
    let query = `delete from "${this.tableName}" where "${PRIMARY_KEY}" = ?`;
    await this.exec(query, [id]);
  }

  async removeWhere(condition: string, ...args: any[]): Promise<void> {
    let query = `delete from "${this.tableName}" where ${condition}`;
    await this.exec(query, args);
  }

  async empty(): Promise<void> {
    let query = `delete from "${this.tableName}"`;
    await this.exec(query);
  }

  private buildItem<T extends DBStorageItem<K>>(row: any): T {
    let item = JSON.parse(row[JSON_KEY] || '{}');

    let columns = this.columns;

    if (columns.length && !(item instanceof Object)) {
      item = {};
    }

    if (item instanceof Object) {
      item[PRIMARY_KEY] = row[PRIMARY_KEY];

      for (let column of columns) {
        item[column] = row[column];
      }
    }

    return item;
  }

  static async create<K extends string | number>({
    name = 'default',
    tableName = 'data',
    primaryType = 'integer',
    indexSchema = {},
  }: DBStorageCreateOptions): Promise<DBStorage<K>> {
    let columns = Object.keys(indexSchema);

    let db = DBStorage.dbMap.get(name);

    if (!db) {
      db = (window.sqlitePlugin || window).openDatabase(
        name,
        '1.0',
        name,
        50 * 1024 * 1024,
      );
    }

    await new Promise<void>((resolve, reject) => {
      db!.transaction(
        transaction => {
          let query = `\
create table if not exists "${tableName}" (
  "${PRIMARY_KEY}" ${primaryType} primary key,
  ${columns.map(column => `"${column}" ${indexSchema[column]},`).join('\n  ')}
  "${JSON_KEY}" text
)`;

          transaction.executeSql(query);
        },
        error => reject(error),
        () => resolve(),
      );
    });

    return new DBStorage(db, columns, tableName);
  }

  private static dbMap = new Map<string, Database>();
}
