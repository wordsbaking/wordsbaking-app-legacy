import {Injectable} from '@angular/core';

import Axios from 'axios';
import ExtendableError from 'extendable-error';

import {AuthConfigService} from 'app/core/config/auth';

const apiBaseUrl = '//localhost:1337';

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
  apiKey: string;
  account: string;
  userId: string;
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

  async signIn(email: string, password: string): Promise<void> {
    let {apiKey, userId, account} = await this.call<SignInInfo>(
      '/sign-in',
      {email, password},
      {auth: false},
    );

    await Promise.all([
      this.authConfigService.set('apiKey', apiKey),
      this.authConfigService.set('userId', userId),
      this.authConfigService.set('account', account),
    ]);
  }

  async signOut(): Promise<void> {
    await this.authConfigService.reset();
  }

  async uploadAvatar(avatarData: Blob): Promise<string> {
    return this.call<string>('/update-profile', avatarData, {
      type: 'application/octet-stream',
    });
  }

  getUrl(path: string): string {
    return apiBaseUrl + path;
  }
}
