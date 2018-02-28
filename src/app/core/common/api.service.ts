import {Injectable} from '@angular/core';

import Axios from 'axios';
import ExtendableError from 'extendable-error';

import {AuthConfigService} from 'app/core/config/auth';
import {WordDataItem} from 'app/core/data';

import {environment} from '../../../environments/environment';

const apiBaseUrl = environment.apiBaseUrl;

interface APIErrorData {
  code: string;
  message: string;
}

interface APISuccessResult {
  data: any;
}

interface APIRedirectionResult {
  location: string;
}

interface APIErrorResult {
  error: APIErrorData;
}

type APIResult = APISuccessResult | APIErrorResult | APIRedirectionResult;

type AccountStatus = 'normal' | 'need-upgrade' | 'upgrading';

export const enum MigrationStatus {
  migrating,
  finished,
  failed,
}

export type OnProgress = (event: ProgressEvent) => void;

export interface APICallOptions {
  type?: string;
  auth?: boolean;
  onUploadProgress?: OnProgress;
  onDownloadProgress?: OnProgress;
}

export class APIError extends ExtendableError {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

// /sign-up

export interface SignUpInfo {
  apiKey: string;
  account: string;
  userId: string;
}

// /sign-in

export interface SignInInfo {
  account: string;
  userId?: string;
  apiKey?: string;
  accountStatus: AccountStatus;
  availableDataSourceVersions?: string[];
}

export interface AppVersionEntry {
  platform: string;
  version: string;
  beta: boolean;
  publisher: string;
  description: string;
  downloadUrl: string;
  timestamp: number;
}

@Injectable()
export class APIService {
  constructor(private authConfigService: AuthConfigService) {}

  async call<T>(
    path: string,
    body?: any,
    {
      type,
      auth = true,
      onUploadProgress,
      onDownloadProgress,
    }: APICallOptions = {},
  ): Promise<T> {
    let url = apiBaseUrl + path;

    let apiKey: string | undefined;

    if (auth) {
      apiKey = await this.authConfigService.nonEmptyAPIKey$.first().toPromise();
    }

    let response = await Axios.post(url, body, {
      // withCredentials: true,
      headers: {
        'Content-Type': type,
        ...apiKey ? {'X-API-Key': apiKey} : {},
      },
      onUploadProgress,
      onDownloadProgress,
    });

    let result = response.data as APIResult;

    if ('location' in result) {
      window.location.href = (result as APIRedirectionResult).location;
      // Unreachable
      throw undefined;
    } else if ('error' in result) {
      let error = (result as APIErrorResult).error;
      throw new APIError(error.code, error.message || error.code);
    } else {
      return (result as APISuccessResult).data;
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    let {apiKey, userId, account} = await this.call<SignUpInfo>(
      '/sign-up',
      {email, password},
      {auth: false},
    );

    await Promise.all([
      this.authConfigService.set('apiKey', apiKey),
      this.authConfigService.set('userId', userId),
      this.authConfigService.set('account', account),
    ]);
  }

  async signIn(email: string, password: string): Promise<SignInInfo> {
    let info = await this.call<SignInInfo>(
      '/sign-in',
      {email, password},
      {auth: false},
    );

    let {apiKey, userId, account, accountStatus} = info;

    if (accountStatus !== 'normal') {
      return info;
    }

    await Promise.all([
      this.authConfigService.set('apiKey', apiKey),
      this.authConfigService.set('userId', userId),
      this.authConfigService.set('account', account),
    ]);

    return info;
  }

  async migrateUserData(
    email: string,
    password: string,
    dataSourceVersion: string | undefined,
  ): Promise<void> {
    return this.call<void>(
      '/migrate-user-data',
      {email, password, dataSourceVersion},
      {auth: false},
    );
  }

  getUserDataMigrationStatus(
    email: string,
  ): Promise<MigrationStatus | undefined> {
    return this.call<MigrationStatus | undefined>(
      '/user-data-migration-status',
      {email},
      {auth: false},
    );
  }

  async signOut(): Promise<void> {}

  async uploadAvatar(avatarData: Blob): Promise<string> {
    return this.call<string>('/update-profile', avatarData, {
      type: 'application/octet-stream',
    });
  }

  async getWordsData(terms: string[]): Promise<WordDataItem[]> {
    return this.call<WordDataItem[]>('/get-words-data', {
      terms,
    });
  }

  async getAppLatestVersionInfo(
    platform: string,
  ): Promise<AppVersionEntry | undefined> {
    return this.call<AppVersionEntry | undefined>(
      '/latest-app-version',
      {
        platform,
      },
      {auth: false},
    );
  }

  getUrl(path: string): string {
    return apiBaseUrl + path;
  }
}
