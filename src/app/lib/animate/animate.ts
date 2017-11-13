export type EasingFunc = (now: number) => number;
export type StepHandler = (value: number) => void;

export async function animate(
  form: number,
  to: number,
  duration: number,
  easingFn: EasingFunc,
  stepHandler: StepHandler,
): Promise<void> {
  let startTime = Date.now();
  let destTime = startTime + duration;
  let completeCallback: Function;
  let current: number;

  return new Promise<void>(resolve => {
    completeCallback = resolve;
    step();
  });

  function step() {
    let now = Date.now();

    if (now >= destTime) {
      if (current < to) {
        stepHandler(to);
      }

      completeCallback();
      return;
    }

    let easing = easingFn((now - startTime) / duration);
    current = (to - form) * easing + form;
    stepHandler(current);

    requestAnimationFrame(step);
  }
}
