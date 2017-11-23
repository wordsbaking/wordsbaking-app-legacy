import {
  AnimationMetadata,
  AnimationQueryOptions,
  query as animationQuery,
} from '@angular/animations';

export function animationElementQuery(
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) {
  return animationQuery(selector, animation, options);
}
