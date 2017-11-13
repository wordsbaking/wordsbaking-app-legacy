import {
  TouchDelegateEvent,
  TouchDelegateEventDetail,
  TouchInfo,
} from './touch-delegate';

export interface TouchIdentifierResult {
  identified: boolean;
  match?: boolean;
  timeout?: number;
  end?: boolean;
  data?: any;
}

export type TouchIdentifyHandler = (
  info: TouchInfo,
  identified: boolean,
  data: any,
) => TouchIdentifierResult | undefined;

export class TouchIdentifier {
  constructor(public name: string, public identify: TouchIdentifyHandler) {}
}

export interface TouchStartDelegateEventDetail
  extends TouchDelegateEventDetail {
  diffX: number;
  diffY: number;
  x: number;
  y: number;
}
export type TouchStartDelegateEvent = TouchDelegateEvent<
  TouchStartDelegateEventDetail
>;

export interface TouchEndDelegateEventDetail extends TouchDelegateEventDetail {
  diffX: number;
  diffY: number;
  x: number;
  y: number;
}
export type TouchEndDelegateEvent = TouchDelegateEvent<
  TouchEndDelegateEventDetail
>;

export interface TapDelegateEventDetail extends TouchDelegateEventDetail {}
export type TapDelegateEvent = TouchDelegateEvent<TapDelegateEventDetail>;

/**
 * delegate event interface for `free` identifier.
 */
export interface FreeDelegateEventDetail extends TouchDelegateEventDetail {
  diffX: number;
  diffY: number;
  x: number;
  y: number;
}

export type FreeDelegateEvent = TouchDelegateEvent<FreeDelegateEventDetail>;

/**
 * delegate event interface for `drag` identifier.
 */
export interface DragDelegateEventDetail extends TouchDelegateEventDetail {
  diffX: number;
  diffY: number;
  x: number;
  y: number;
}

export type DragDelegateEvent = TouchDelegateEvent<DragDelegateEventDetail>;

/**
 * delegate event interface for `slide-x` identifier.
 */
export interface SlideXDelegateEventDetail extends TouchDelegateEventDetail {
  diffX: number;
}

export type SlideXDelegateEvent = TouchDelegateEvent<SlideXDelegateEventDetail>;

/**
 * delegate event interface for `slide-y` identifier.
 */
export interface SlideYDelegateEventDetail extends TouchDelegateEventDetail {
  diffY: number;
}

export type SlideYDelegateEvent = TouchDelegateEvent<SlideYDelegateEventDetail>;

export interface PolylineDelegateEventData {
  changedAxis: 'x' | 'y';
  diffX: number;
  diffY: number;
}
export interface PolylineDelegateEventDetail
  extends TouchDelegateEventDetail,
    PolylineDelegateEventData {}

export type PolylineDelegateEvent = TouchDelegateEvent<
  PolylineDelegateEventDetail
>;

export namespace TouchIdentifier {
  /**
   * `start` identifier, identifies a touch start.
   */
  export const touchStart = new TouchIdentifier('touch-start', info => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    return {
      identified: true,
      match: true,
      end: true,
      data: {
        diffX: sequence.diffX,
        diffY: sequence.diffY,
        x: sequence.x,
        y: sequence.y,
      },
    };
  });

  /**
   * `end` identifier, identifies a touch end.
   */
  export const touchEnd = new TouchIdentifier('touch-end', info => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    if (sequence.ended) {
      return {
        identified: true,
        match: true,
        end: true,
        data: {
          diffX: sequence.diffX,
          diffY: sequence.diffY,
          x: sequence.x,
          y: sequence.y,
        },
      };
    }

    return undefined;
  });

  /**
   * `tap` identifier, identifies a quick touch.
   */
  export const tap = new TouchIdentifier('tap', info => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    if (
      sequences.length > 1 ||
      sequence.timeLasting > 500 ||
      sequence.maxRadius > 5
    ) {
      return {
        identified: true,
        match: false,
        end: true,
      };
    }

    if (sequence.ended) {
      return {
        identified: true,
        match: true,
        end: true,
      };
    }

    return undefined;
  });

  /**
   * `hold` identifier, identifiers a touch longer than 500ms.
   */
  export const hold = new TouchIdentifier('hold', info => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    if (sequences.length > 1 || sequence.maxRadius > 3) {
      return {
        identified: true,
        match: false,
        end: true,
      };
    }

    if (sequence.ended) {
      return {
        identified: true,
        match: false,
        end: true,
      };
    }

    if (sequence.timeLasting >= 500) {
      return {
        identified: true,
        match: true,
        end: true,
      };
    }

    if (sequence.touchPoints.length === 1) {
      return {
        identified: false,
        timeout: 1000,
      };
    }

    return undefined;
  });

  /**
   * `drag` identifier
   */
  export const drag = new TouchIdentifier('drag', (info, identified) => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    if (!identified && info.type !== 'touch') {
      if (sequence.touchPoints.length > 1 && !sequence.ended) {
        return {
          identified: true,
          match: true,
          end: false,
          data: {
            diffX: sequence.diffX,
            diffY: sequence.diffY,
            x: sequence.x,
            y: sequence.y,
          },
        };
      }
    }

    if (!identified && info.type === 'touch') {
      if (sequences.length > 1 || sequence.maxRadius > 3) {
        return {
          identified: true,
          match: false,
          end: true,
        };
      }

      if (sequence.ended) {
        return {
          identified: true,
          match: false,
          end: true,
        };
      }

      if (sequence.timeLasting >= 100) {
        return {
          identified: true,
          match: true,
          end: false,
          data: {
            diffX: sequence.diffX,
            diffY: sequence.diffY,
            x: sequence.x,
            y: sequence.y,
          },
        };
      }

      if (sequence.touchPoints.length === 1) {
        return {
          identified: false,
          timeout: 100,
        };
      }
    }

    if (identified) {
      let ended = sequence.ended;

      return {
        identified: true,
        match: true,
        end: ended,
        data: {
          diffX: sequence.diffX,
          diffY: sequence.diffY,
          x: sequence.x,
          y: sequence.y,
        },
      };
    }

    return undefined;
  });

  /**
   * `free` identifier, matches any touch with data of the first touch sequence.
   */
  export const free = new TouchIdentifier('free', info => {
    let sequence = info.sequences[0];

    return {
      identified: true,
      match: true,
      end: false,
      data: {
        diffX: sequence.diffX,
        diffY: sequence.diffY,
        x: sequence.x,
        y: sequence.y,
      },
    };
  });

  /**
   * `slide-x` identifier, identifiers horizontally touch moving.
   */
  export const slideX = new TouchIdentifier('slide-x', (info, identified) => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    let match = identified;

    if (!identified && sequence.maxRadius > 2) {
      identified = true;

      if (Math.abs(sequence.lastSlope) < 1 && sequences.length === 1) {
        match = true;
      }
    }

    return {
      identified,
      match,
      end: false,
      data: {
        diffX: sequence.diffX,
      },
    };
  });

  /**
   * `slide-y` identifier, identifiers vertically touch moving.
   */
  export const slideY = new TouchIdentifier('slide-y', (info, identified) => {
    let sequences = info.sequences;
    let sequence = sequences[0];

    let match = identified;

    if (!identified && sequence.maxRadius > 2) {
      identified = true;

      if (Math.abs(sequence.lastSlope) > 1 && sequences.length === 1) {
        match = true;
      }
    }

    return {
      identified,
      match,
      end: false,
      data: {
        diffY: sequence.diffY,
      },
    };
  });

  export const polylineAfterSlideY = new TouchIdentifier(
    'polyline-after-slide-y',
    (info: TouchInfo, identified: boolean, data: PolylineDelegateEventData) => {
      let sequences = info.sequences;
      let sequence = sequences[0];

      let match = identified;

      if (!identified && sequence.maxRadius > 2) {
        identified = true;

        if (Math.abs(sequence.slope) > 1 && sequences.length === 1) {
          match = true;
        }
      }

      let lastSlope = Math.abs(sequence.lastSlope);

      if (!data) {
        data = {
          changedAxis: 'y',
          diffX: 0,
          diffY: 0,
        };
      }

      if (lastSlope > 1) {
        // y
        data.changedAxis = 'y';
        data.diffY += sequence.lastDiffY;
      } else if (lastSlope < 1) {
        // x
        data.changedAxis = 'x';
        data.diffX += sequence.lastDiffX;
      } else if (data.changedAxis === 'y') {
        data.diffY += sequence.lastDiffY;
      } else {
        data.diffX += sequence.lastDiffX;
      }

      return {
        identified,
        match,
        end: false,
        data,
      };
    },
  );
}
