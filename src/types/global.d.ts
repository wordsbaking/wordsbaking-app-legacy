declare var IS_IPHONE: boolean;
declare var IS_ANDROID: boolean;
declare var IS_BROWSER: boolean;
declare var IS_CORDOVA: boolean;

declare var module: any;
declare var require: any;

declare var APP_PROFILE: {
  platform: string;
  version: AppVersionProfile;
};

declare var ENV: Partial<Environment> | undefined;

interface AppVersionProfile {
  name: string;
  code: number;
  beta: boolean;
  description?: string;
  downloadUrl?: string;
}

interface Environment {
  production: boolean;
  hmr: boolean;
  aliyunOSSUserContentBaseUrl: string;
  apiBaseUrl: string;
  hybirdApp: boolean;
  debug?: boolean;
}

interface Dict<T> {
  [key: string]: T;
}

interface RouteConfigurationData {
  name: string;
  preventLoadingHint?: boolean;
  hideStatusBar?: boolean; // for cordova app
  preventBackHistory?: boolean; // for cordova android app
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
