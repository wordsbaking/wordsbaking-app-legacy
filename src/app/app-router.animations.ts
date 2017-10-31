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

const q = (
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) => query(selector, animation, options);

export const routerTransition = trigger('routerTransition', [
  transition('* <=> *', [
    q(':enter', style({position: 'fixed', right: 0, bottom: 0, top: 0, left: 0})),
    sequence([q(':leave', animateChild()), q(':enter', animateChild())]),
  ]),
]);
