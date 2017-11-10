import {Injectable} from '@angular/core';

import Axios from 'axios';

const apiBaseUrl = '';

interface APISuccessResult {
  data: any;
}

interface APIRedirectionResult {
  location: string;
}

interface APIErrorResult {
  error: {
    code: string;
    message: string;
  };
}

type APIResult = APISuccessResult | APIErrorResult | APIRedirectionResult;

export type OnProgress = (event: ProgressEvent) => void;

export interface APICallOptions {
  type?: string;
  onUploadProgress?: OnProgress;
  onDownloadProgress?: OnProgress;
}

@Injectable()
export class APIService {
  async call<T>(
    path: string,
    body?: any,
    {type, onUploadProgress, onDownloadProgress}: APICallOptions = {},
  ): Promise<T> {
    let url = apiBaseUrl + path;

    let response = await Axios.post(url, body, {
      withCredentials: true,
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
      throw new Error(error.message);
    } else {
      return (result as APISuccessResult).data;
    }
  }

  getUrl(path: string): string {
    return apiBaseUrl + path;
  }
}
