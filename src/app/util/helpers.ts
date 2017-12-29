import * as moment from 'moment';

export function generateStudyStatsID(offset: Date = new Date()) {
  return `study-stats-${moment(offset).format('YYYYMMDD')}`;
}

export function generateStudyTimeID(offset: Date = new Date()) {
  return `study-time-${moment(offset).format('YYYYMMDD')}`;
}
