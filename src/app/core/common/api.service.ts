import {Injectable} from '@angular/core';

import Axios from 'axios';
import ExtendableError from 'extendable-error';

import {ConfigService} from 'app/core/config';

const apiBaseUrl = '//localhost:1337';

interface APIErrorData {
  code: string;
  message: string;
}

// type ErrorMessageBuilder = (error: APIErrorData) => string;

// const errorMessageBuilderDict: Dict<ErrorMessageBuilder> = {
//   UserExistsError(): string {
//     return '该用户已经存在';
//   },
// };

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
  onUploadProgress?: OnProgress;
  onDownloadProgress?: OnProgress;
}

export interface SignUpInfo {
  apiKey: string;
}

export class APIError extends ExtendableError {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

@Injectable()
export class APIService {
  constructor(private configService: ConfigService) {}

  async call<T>(
    path: string,
    body?: any,
    {type, onUploadProgress, onDownloadProgress}: APICallOptions = {},
  ): Promise<T> {
    let url = apiBaseUrl + path;

    let response = await Axios.post(url, body, {
      // withCredentials: true,
      headers: {
        'Content-Type': type,
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
    let {apiKey} = await this.call<SignUpInfo>('/sign-up', {email, password});

    await this.configService.set('apiKey', apiKey);
  }

  getUrl(path: string): string {
    return apiBaseUrl + path;
  }
}
