import {
  AnimationMetadata,
  AnimationQueryOptions,
  query as animationQuery,
} from '@angular/animations';

export namespace AnimationTool {
  export function query(
    selector: string,
    animation: AnimationMetadata | AnimationMetadata[],
    options: AnimationQueryOptions = {optional: true},
  ) {
    return animationQuery(selector, animation, options);
  }
}
