import {animate, group, style, transition, trigger} from '@angular/animations';

import {AnimationTool} from 'app/util';

export const wordDetailCardTransitions = trigger('wordDetailCardTransitions', [
  transition(':enter', [
    style({backgroundColor: 'rgba(238, 238, 238, 0)'}),
    AnimationTool.query(
      '.word-detail-card',
      style({opacity: 0, transform: 'scale(0.8)'}),
    ),
    group([
      animate(
        '0.2s linear',
        style({backgroundColor: 'rgba(238, 238, 238, 0.9)'}),
      ),
      AnimationTool.query(
        '.word-detail-card',
        animate(
          '0.4s 100ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({
            opacity: 1,
            transform: 'scale(1)',
          }),
        ),
      ),
    ]),
  ]),
  transition(':leave', [
    style({backgroundColor: 'rgba(238, 238, 238, 0.9)'}),
    AnimationTool.query(
      '.word-detail-card',
      style({opacity: 1, transform: 'scale(1)'}),
    ),
    group([
      AnimationTool.query(
        '.word-detail-card',
        animate(
          '0.2s ease-out',
          style({
            opacity: 0,
            transform: 'scale(0.9)',
          }),
        ),
      ),
      animate(
        '0.2s 140ms linear',
        style({backgroundColor: 'rgba(238, 238, 238, 0)'}),
      ),
    ]),
  ]),
]);
