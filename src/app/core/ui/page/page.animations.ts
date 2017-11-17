import {
  AnimationMetadata,
  AnimationQueryOptions,
  animate,
  group,
  query,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export function q(
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) {
  return query(selector, animation, options);
}

export const pageTransitions = [
  transition(':enter', [
    q('.page-header', style({transform: 'translateY(-100%)'})),
    q('.page-header > .inner', style({transform: 'translateY(-100%)'})),
    q('.page-content', style({opacity: '0'})),
    q('.page-footer', style({transform: 'translateY(100%)'})),
    group(
      [
        q(
          '.page-header',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
        ),
        q(
          '.page-header > .inner',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
          {
            delay: 200,
          },
        ),
        q('.page-content', animate('0.2s linear', style({opacity: '1'})), {
          delay: 200,
        }),
        q(
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
      q(
        '.page-header > .inner',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
      ),
      q(
        '.page-header',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
        {
          delay: 200,
        },
      ),
      q('.page-content', animate('0.2s linear', style({opacity: '0'}))),
      q(
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
