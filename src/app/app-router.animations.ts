import {
  AnimationMetadata,
  AnimationQueryOptions,
  animateChild,
  query,
  sequence,
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

export const routerTransitions = trigger('routerTransitions', [
  transition('* <=> *', [
    q(
      'wb-view:enter',
      style({
        position: 'fixed',
        right: 0,
        bottom: 0,
        top: 0,
        left: 0,
        zIndex: 0,
      }),
    ),
    q(
      'wb-view:leave',
      style({
        position: 'fixed',
        right: 0,
        bottom: 0,
        top: 0,
        left: 0,
        zIndex: 1,
      }),
    ),
    sequence([
      q('wb-view:leave', animateChild()),
      q('wb-view:enter', animateChild()),
    ]),
  ]),
]);
