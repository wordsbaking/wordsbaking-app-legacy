import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import {StudyStats} from 'app/core/engine';

@Injectable()
export class UserService {
  todayStartAt$: Observable<TimeNumber>;

  readonly studiedCollectionFinishedMap$: ReplaySubject<Map<string, boolean>>;

  constructor() {}

  updateTodayStudyStats(_stats: StudyStats): void {}
}
