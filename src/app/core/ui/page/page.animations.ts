import {
  animate,
  group,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

import {AnimationTool} from 'app/util';

export const pageTransitions = [
  transition(':enter', [
    AnimationTool.query(
      '.page-header',
      style({transform: 'translateY(-100%)'}),
    ),
    AnimationTool.query(
      '.page-header > .inner',
      style({transform: 'translateY(-100%)'}),
    ),
    AnimationTool.query('.page-content', style({opacity: '0'})),
    AnimationTool.query('.page-footer', style({transform: 'translateY(100%)'})),
    group(
      [
        AnimationTool.query(
          '.page-header',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
        ),
        AnimationTool.query(
          '.page-header > .inner',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
          {
            delay: 200,
          },
        ),
        AnimationTool.query(
          '.page-content',
          animate('0.2s linear', style({opacity: '1'})),
          {
            delay: 200,
          },
        ),
        AnimationTool.query(
          '.page-footer',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
          {
            delay: 200,
          },
        ),
        style({opacity: 1}),
      ],
      {
        delay: 200,
      },
    ),
  ]),
  transition(':leave', [
    group([
      AnimationTool.query(
        '.page-header > .inner',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
      ),
      AnimationTool.query(
        '.page-header',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
        {
          delay: 200,
        },
      ),
      AnimationTool.query(
        '.page-content',
        animate('0.2s linear', style({opacity: '0'})),
      ),
      AnimationTool.query(
        '.page-footer',
        animate('0.2s ease-out', style({transform: 'translateY(100%)'})),
      ),
    ]),
  ]),
];

export const pageHeaderExtensionTransitions = trigger(
  'pageHeaderExtensionTransitions',
  [
    state('folded', style({height: 0})),
    state('expanded', style({height: '*'})),
    transition(':enter, folded => expanded', [
      style({height: 0}),
      animate('0.2s ease-out', style({height: '*'})),
    ]),
    transition('expanded => folded', [
      style({height: '*'}),
      animate('0.2s ease-out', style({height: 0})),
    ]),
    transition('folded => void', [
      style({height: 0}),
      animate(400, style({height: 0})),
    ]),
  ],
);
