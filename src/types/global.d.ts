declare var module: any;

declare var VERSION: string | undefined;
declare var ENV: Partial<Environment> | undefined;

interface Environment {
  production: boolean;
  hmr: boolean;
  aliyunOSSUserContentBaseUrl: string;
  apiBaseUrl: string;
}

interface Window {
  cordova: any;
}

interface Dict<T> {
  [key: string]: T;
}

interface RouteConfigurationData {
  name: string;
  preventLoadingHint?: boolean;
  hideStatusBar?: boolean;
}

type TypedString<T extends string> = string & T;

type EmailString = TypedString<'__email'>;
type MobileString = TypedString<'__mobile'>;
type PasswordString = TypedString<'__password'>;

type TypedNumber<T extends string> = number & {__type: T};

type TimeNumber = TypedNumber<'__time'>;

type Primitive = string | number | boolean;
type Nullable = undefined | null;

interface Constructor<T> {
  new (...args: any[]): T;
}

interface DateConstructor {
  now(): TimeNumber;
}

interface Date {
  getTime(): TimeNumber;
}
