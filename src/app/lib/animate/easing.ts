export namespace Easing {
  export function quadratic(k: number) {
    return k * (2 - k);
  }

  export function circular(k: number) {
    return Math.sqrt(1 - --k * k);
  }
}
