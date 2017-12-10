import {Injectable} from '@angular/core';

import {TTSService} from '../common';

@Injectable()
export class BrowserTTSService extends TTSService {
  async speak(_term: string): Promise<void> {}
}
