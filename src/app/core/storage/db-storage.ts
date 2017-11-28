import {Subject} from 'rxjs/Subject';

const JSON_KEY = '_json';
const MAX_VARIABLES_NUMBER = 999;
const MAX_BATCH_SIZE = 250;

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type SetMultipleProgressHandler = (done: number, total: number) => void;

export interface DBStorageCreateOptions {
  name?: string;
  tableName?: string;
  primaryKey?: string;
  /** Defaults to 'integer'. */
  primaryKeyType?: string;
  indexSchema?: Dict<string>;
}

export class DBStorage<K extends string | number, T> {
  readonly change$ = new Subject<void>();

  private constructor(
    readonly db: Database,
    readonly tableName: string,
    readonly primaryKey: string,
    readonly columns: string[],
  ) {}

  async exec(queries: string[], argsArray?: any[][]): Promise<SQLResultSet>;
  async exec(query: string, args?: any[]): Promise<SQLResultSet>;
  async exec(
    queries: string | string[],
    argsArray: any[] = [],
  ): Promise<SQLResultSet> {
    if (typeof queries === 'string') {
      queries = [queries];
      argsArray = [argsArray];
    }

    let resultSet = await new Promise<SQLResultSet>((resolve, reject) => {
      let result: SQLResultSet;
      let changed = false;

      this.db.transaction(
        transaction => {
          next(transaction, 0);

          function next(transaction: SQLTransaction, index: number) {
            if (index >= queries.length) {
              // The transaction will complete if no other statements to be
              // executed after something like `setTimeout(..., 0)`.
              return;
            }

            let query = queries[index];
            let args = argsArray[index];

            transaction.executeSql(query, args, (transaction, resultSet) => {
              if (resultSet.rowsAffected) {
                changed = true;
              }

              if (index === queries.length - 1) {
                result = resultSet;
                return;
              }

              next(transaction, index + 1);
            });
          }
        },
        error => reject(error),
        () => {
          resolve(result);

          if (changed) {
            this.change$.next();
          }
        },
      );
    });

    return resultSet;
  }

  async get(id: K): Promise<T | undefined> {
    let {rows} = await this.exec(
      `select * from "${this.tableName}" where "${this.primaryKey}"=?`,
      [id],
    );

    if (!rows.length) {
      return undefined;
    }

    let row = rows.item(0);

    return this.buildItem(row);
  }

  async getAll(): Promise<T[]> {
    let {rows} = await this.exec(`select * from "${this.tableName}"`);

    let items: T[] = [];

    for (let i = 0; i < rows.length; i++) {
      let row = rows.item(i);
      let item = this.buildItem(row);
      items.push(item);
    }

    return items;
  }

  async getAllAsDict(): Promise<Dict<T>> {
    let {rows} = await this.exec(`select * from "${this.tableName}"`);

    // tslint:disable-next-line:no-null-keyword
    let dict: Dict<T> = Object.create(null);

    for (let i = 0; i < rows.length; i++) {
      let row = rows.item(i);
      let item = this.buildItem(row);
      dict[row[this.primaryKey]] = item;
    }

    return dict;
  }

  async getPrimaryKeys(): Promise<K[]> {
    let {rows} = await this.exec(
      `select "${this.primaryKey}" from "${this.tableName}"`,
    );

    let ids: K[] = [];

    for (let i = 0; i < rows.length; i++) {
      let item = rows.item(i);
      ids.push(item[this.primaryKey]);
    }

    return ids;
  }

  async set(id: K, value: T): Promise<void>;
  async set(item: T): Promise<void>;
  async set(id: K | T, item?: T): Promise<void> {
    if (typeof id === 'object') {
      item = id;
      id = (item as any)[this.primaryKey];
    }

    let extraVariables: string[] = [];
    let extraColumns: string[] = [];
    let extraValues: any[] = [];

    let columns = this.columns;

    if (item instanceof Object) {
      item = {...(item as any)} as T;

      delete (item as any)[this.primaryKey];

      for (let column of columns) {
        extraVariables.push('?,');
        extraColumns.push(`"${column}",`);
        extraValues.push((item as any)[column]);

        delete (item as any)[column];
      }
    } else if (columns.length) {
      throw new TypeError('Expecting an object');
    }

    let json = JSON.stringify(item);

    extraValues.push(json);

    let query = `\
insert or replace into "${this.tableName}" (
  "${this.primaryKey}", ${extraColumns.join('\n  ')} "${JSON_KEY}"
)
values (
  ?, ${extraVariables.join('\n  ')} ?
)`;

    await this.exec(query, [id].concat(extraValues));
  }

  async setMultiple(
    items: T[],
    progress?: SetMultipleProgressHandler,
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    items = [...items];

    let columns = [this.primaryKey, ...this.columns];

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

    let itemGroups: T[][] = [];

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
        if (item instanceof Object) {
          item = {...(item as any)} as T;

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
        } else if (columns.length) {
          throw new TypeError('Expecting an object');
        }
      }

      await this.exec(query, values);

      if (progress) {
        progress(done, total);
      }
    }
  }

  /**
   * Insert an item without present primary key value? Only integer primary
   * key available?
   */
  async insert(item: T): Promise<number> {
    let extraVariables: string[] = [];
    let extraColumns: string[] = [];
    let extraValues: any[] = [];

    item = {...(item as any)} as T;

    let columns = this.columns.concat();

    if ((item as any)[this.primaryKey] !== null) {
      columns.push(this.primaryKey);
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
    let query = `delete from "${this.tableName}" where "${this
      .primaryKey}" = ?`;
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

  private buildItem(row: any): T {
    let item = JSON.parse(row[JSON_KEY] || '{}');

    let columns = this.columns;

    if (columns.length && !(item instanceof Object)) {
      item = {};
    }

    if (item instanceof Object) {
      item[this.primaryKey] = row[this.primaryKey];

      for (let column of columns) {
        item[column] = row[column];
      }
    }

    return item;
  }

  static async create<K extends string | number, T extends object>({
    name = 'default',
    tableName = 'data',
    primaryKey = 'id',
    primaryKeyType = 'integer',
    indexSchema = {},
  }: DBStorageCreateOptions): Promise<DBStorage<K, T>> {
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
  "${primaryKey}" ${primaryKeyType} primary key,
  ${columns.map(column => `"${column}" ${indexSchema[column]},`).join('\n  ')}
  "${JSON_KEY}" text
)`;

          transaction.executeSql(query);
        },
        error => reject(error),
        () => resolve(),
      );
    });

    return new DBStorage(db, tableName, primaryKey, columns);
  }

  private static dbMap = new Map<string, Database>();
}
