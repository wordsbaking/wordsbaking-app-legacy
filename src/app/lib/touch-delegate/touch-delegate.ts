import * as $ from 'jquery';

import {TouchIdentifier, TouchIdentifierResult} from './identifiers';

export interface TouchPoint {
  x: number;
  y: number;
}

export interface TouchVelocity {
  x: number;
  y: number;
  speed: number;
}

export interface TouchEventPoint {
  x: number;
  y: number;
  time: number;
  isStart: boolean;
  isEnd: boolean;
}

export interface TouchDelegateItem {
  id: string;
  identifier: TouchIdentifier;
  listener: TouchDelegateListener;
  priority: number;
}

export type TouchDelegateListener = (
  event: TouchDelegateEvent,
) => void | boolean;

export type TouchType = 'mouse' | 'touch';

export let pointerEnabled: boolean;
export let typePointerDown: string;
export let typePointerMove: string;
export let typePointerUp: string;

// tslint:disable-next-line:strict-type-predicates
if (typeof PointerEvent !== 'undefined') {
  pointerEnabled = true;
  typePointerDown = 'pointerdown';
  typePointerMove = 'pointermove';
  typePointerUp = 'pointerup pointercancel';
} else if (navigator.msPointerEnabled) {
  pointerEnabled = true;
  typePointerDown = 'MSPointerDown';
  typePointerMove = 'MSPointerMove';
  typePointerUp = 'MSPointerUp MSPointerCancel';
} else {
  pointerEnabled = false;
}

// TODO: PointerEvent support
pointerEnabled = false;

export type NodeVaries = Node | JQuery | string;

export function getDistance(pointA: TouchPoint, pointB: TouchPoint) {
  let diffX = pointA.x - pointB.x;
  let diffY = pointA.y - pointB.y;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

export class TouchSequence {
  touchPoints: TouchEventPoint[] = [];

  constructor(public identifier: number) {}

  get first(): TouchEventPoint {
    return this.touchPoints[0];
  }

  get last(): TouchEventPoint {
    let points = this.touchPoints;
    return points[points.length - 1];
  }

  get ended(): boolean {
    return !!this.last && this.last.isEnd;
  }

  get x(): number | undefined {
    return this.last && this.last.x;
  }

  get y(): number | undefined {
    return this.last && this.last.y;
  }

  get diffX(): number | undefined {
    let first = this.first;
    let last = this.last;
    return first && last.x - first.x;
  }

  get diffY(): number | undefined {
    let first = this.first;
    let last = this.last;
    return first && last.y - first.y;
  }

  get lastDiffX(): number {
    let points = this.touchPoints;

    let pointA = points[points.length - 2];
    let pointB = points[points.length - 1];

    if (pointA) {
      return pointB.x - pointA.x;
    } else {
      return 0;
    }
  }

  get lastDiffY(): number {
    let points = this.touchPoints;

    let pointA = points[points.length - 2];
    let pointB = points[points.length - 1];

    if (pointA) {
      return pointB.y - pointA.y;
    } else {
      return 0;
    }
  }

  get slope(): number {
    return this.diffY! / this.diffX!;
  }

  get lastSlope(): number {
    return this.lastDiffY / this.lastDiffX;
  }

  get velocity(): TouchVelocity {
    let points = this.touchPoints;

    let pointA = points[points.length - 1];

    if (points.length < 2) {
      return {
        x: 0,
        y: 0,
        speed: 0,
      };
    }

    let pointB =
      points.length < 3 || !pointA.isEnd
        ? points[points.length - 2]
        : points[points.length - 3];

    let duration = pointB.time - pointA.time;

    return {
      x: (pointB.x - pointA.x) / duration,
      y: (pointB.y - pointA.y) / duration,
      speed: getDistance(pointB, pointA) / (pointB.time - pointA.time),
    };
  }

  get timeLasting() {
    let first = this.first;
    let last = this.last;
    return (this.ended ? last.time : Date.now()) - first.time;
  }

  get maxRadius() {
    let points = this.touchPoints;

    let firstPoint = points[0];
    let max = 0;

    for (let i = 1; i < points.length; i++) {
      let radius = getDistance(firstPoint, points[i]);
      if (radius > max) {
        max = radius;
      }
    }

    return max;
  }

  add(point: TouchEventPoint) {
    this.touchPoints.push(point);
  }
}

export class TouchInfo {
  dataMap = new Map<string, any>();
  sequences: TouchSequence[] = [];
  activeSequenceMap = new Map<string, TouchSequence>();
  type: TouchType;

  get isStart(): boolean {
    return (
      !this.isEnd &&
      this.sequences.length === 1 &&
      this.sequences[0].touchPoints.length === 1
    );
  }

  get isEnd(): boolean {
    return !this.activeSequenceMap.size;
  }

  get timeLasting(): number {
    let sequences = this.sequences;
    if (!sequences.length) {
      return 0;
    }

    let firstSequence = sequences[0];
    let start = firstSequence.first.time;

    let end = this.isEnd
      ? Math.max(0, ...sequences.map(({last: {time}}) => time))
      : Date.now();

    return end - start;
  }
}

export interface TouchDelegateEvent {
  originalEvent: Event;
  target: EventTarget | undefined;
  touch: TouchInfo;
  firstMatch: boolean;
  stopPropagation(stopAll?: boolean): void;
}

export class TouchDelegate {
  private $target: JQuery;
  private $parent: JQuery;

  private delegateItems: TouchDelegateItem[] = [];

  constructor(
    selector: NodeVaries,
    preventDefault = false,
    parent = window.document,
  ) {
    this.$parent = $(parent);
    this.$target = $(selector);

    this.addEventListeners(
      typeof selector === 'string' ? selector : undefined,
      preventDefault,
    );
  }

  on(
    identifier: TouchIdentifier,
    listener: TouchDelegateListener,
    priority = 0,
  ) {
    this.insert({
      id: (TouchDelegate.added++).toString(),
      identifier,
      listener,
      priority,
    });
  }

  delegate(
    identifier: TouchIdentifier,
    selector: any,
    listener: TouchDelegateListener,
    priority = 0,
  ) {
    this.insert({
      id: (TouchDelegate.added++).toString(),
      identifier,
      listener(event: TouchDelegateEvent): void {
        let $target = $(event.target!);
        let target: HTMLElement;

        if ($target.is(selector)) {
          target = $target[0];
        } else {
          target = $target.closest(selector)[0];
        }

        if (target) {
          event.target = target;
          listener(event);
        }
      },
      priority,
    });
  }

  destroy() {
    let itemSet = new Set(this.delegateItems);
    let currentItems = TouchDelegate.currentDelegateItems;

    let removed = 0;

    for (let item of currentItems) {
      if (!itemSet.has(item)) {
        currentItems[removed++] = item;
      }
    }

    currentItems.splice(removed);
  }

  private addEventListeners(
    selector: string | undefined,
    preventDefault: boolean,
  ): void {
    if (pointerEnabled) {
      this.addPointerEventListeners(selector, preventDefault);
    } else {
      this.addTouchEventListeners(selector, preventDefault);
    }
  }

  private addPointerEventListeners(
    selector: string | undefined,
    preventDefault: boolean,
  ): void {
    let onpointerdown = (e: JQuery.Event<HTMLElement>) => {
      TouchDelegate.triggerTarget = e.target;
      TouchDelegate.currentDelegateItems = TouchDelegate.currentDelegateItems.concat(
        this.delegateItems,
      );

      if (preventDefault) {
        e.preventDefault();
      }
    };

    if (selector === undefined) {
      this.$target.on(typePointerDown, onpointerdown);
    } else {
      this.$parent.on(typePointerDown, selector, onpointerdown);
    }
  }

  private addTouchEventListeners(
    selector: string | undefined,
    preventDefault: boolean,
  ): void {
    let ontouchstart = (e: JQuery.Event<HTMLElement>) => {
      TouchDelegate.triggerTarget = e.target;
      TouchDelegate.currentDelegateItems = TouchDelegate.currentDelegateItems.concat(
        this.delegateItems,
      );

      if (preventDefault) {
        e.preventDefault();
      }
    };

    let onmousedown = (e: JQuery.Event<HTMLElement>) => {
      if (TouchDelegate.touching) {
        return;
      }

      TouchDelegate.triggerTarget = e.target;
      TouchDelegate.currentDelegateItems = TouchDelegate.currentDelegateItems.concat(
        this.delegateItems,
      );

      if (preventDefault) {
        e.preventDefault();
      }
    };

    if (selector === undefined) {
      this.$target.on('touchstart', ontouchstart).on('mousedown', onmousedown);
    } else {
      this.$parent
        .on('touchstart', selector, ontouchstart)
        .on('mousedown', selector, onmousedown);
    }
  }

  private insert(item: TouchDelegateItem) {
    let items = this.delegateItems;

    let i: number;

    for (i = items.length - 1; i >= 0; i--) {
      if (items[i].priority < item.priority) {
        break;
      }
    }

    items.splice(i + 1, 0, item);
  }

  /** @internal */
  static attachDocumentEventListeners() {
    if (pointerEnabled) {
      $(document)
        .on(typePointerDown, (e: JQuery.Event<HTMLElement>) => {
          TouchDelegate.touching = true;
          let oe = e.originalEvent as PointerEvent;
          TouchDelegate.pointerDown(oe, oe.pointerId, oe.clientX, oe.clientY);
        })
        .on(typePointerMove, e => {
          let oe = e.originalEvent as PointerEvent;
          TouchDelegate.pointerMove(oe, oe.pointerId, oe.clientX, oe.clientY);
        })
        .on(typePointerUp, e => {
          TouchDelegate.touching = false;
          let oe = e.originalEvent as PointerEvent;
          TouchDelegate.pointerUp(oe, oe.pointerId);
        });
    } else {
      $(document)
        .on('touchstart', (e: JQuery.Event<HTMLElement>) => {
          TouchDelegate.touching = true;
          let oe = e.originalEvent as TouchEvent;
          let touches = oe.changedTouches;

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < touches.length; i++) {
            let touch = touches[i];
            TouchDelegate.pointerDown(
              oe,
              touch.identifier,
              touch.clientX,
              touch.clientY,
            );
          }
        })
        .on('touchmove', e => {
          let oe = e.originalEvent as TouchEvent;
          let touches = oe.changedTouches;

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < touches.length; i++) {
            let touch = touches[i];
            TouchDelegate.pointerMove(
              oe,
              touch.identifier,
              touch.clientX,
              touch.clientY,
            );
          }
        })
        .on('touchend touchcancel', (e: JQuery.Event<HTMLElement>) => {
          TouchDelegate.touching = false;
          let oe = e.originalEvent as TouchEvent;
          let touches = oe.changedTouches;

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < touches.length; i++) {
            let touch = touches[i];
            TouchDelegate.pointerUp(oe, touch.identifier);
          }
        })
        .on('mousedown', (e: JQuery.Event<HTMLElement>) => {
          if (TouchDelegate.touching) {
            return;
          }

          TouchDelegate.mousedown = true;
          TouchDelegate.pointerDown(e.originalEvent, 0, e.clientX!, e.clientY!);
        })
        .on('mousemove', (e: JQuery.Event<HTMLElement>) => {
          if (!TouchDelegate.mousedown) {
            return;
          }

          TouchDelegate.pointerMove(e.originalEvent, 0, e.clientX!, e.clientY!);
        })
        .on('mouseup', (e: JQuery.Event<HTMLElement>) => {
          if (!TouchDelegate.mousedown) {
            return;
          }

          TouchDelegate.mousedown = false;
          TouchDelegate.pointerUp(e.originalEvent, 0);
        });
    }
  }

  private static added = 0;
  private static stopAll = false;
  private static stopPropagationSet = new Set<string>();
  private static touchInfo = new TouchInfo();
  private static touching = false;
  private static mousedown = false;

  private static triggerTarget: EventTarget | undefined;
  private static currentDelegateItems: TouchDelegateItem[] = [];
  private static timeoutIds: number[] = [];

  private static pointerDownTriggerCallbacks: (() => void)[] | undefined;

  private static pointerDown(
    originalEvent: Event,
    id: number,
    x: number,
    y: number,
  ) {
    let idStr = id.toString();
    let info = TouchDelegate.touchInfo;

    let sequenceMap = info.activeSequenceMap;
    let sequence = sequenceMap.get(idStr);

    let isStart: boolean;

    if (sequence) {
      isStart = false;
    } else {
      isStart = true;
      sequence = new TouchSequence(id);
      sequenceMap.set(idStr, sequence);

      let type = originalEvent.type.match(
        /mouse|touch|pointer/i,
      )![0].toLowerCase();

      info.type =
        type === 'pointer' ? (originalEvent as PointerEvent).pointerType : type;

      info.sequences.push(sequence);
    }

    sequence.add({
      x,
      y,
      isStart,
      isEnd: false,
      time: Date.now(),
    });

    let callbacks = (this.pointerDownTriggerCallbacks = []);

    // Previously, the following code was wrapped by a setTimeout call.
    // Possibly for avoid some PointerEvent issue as I can recall.

    TouchDelegate.trigger(originalEvent);

    for (let callback of callbacks) {
      try {
        callback();
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
      }
    }

    this.pointerDownTriggerCallbacks = undefined;
  }

  private static pointerMove(
    originalEvent: Event,
    id: number,
    x: number,
    y: number,
  ) {
    if (this.pointerDownTriggerCallbacks) {
      this.pointerDownTriggerCallbacks.push(process);
    } else {
      process();
    }

    function process() {
      let idStr = id.toString();
      let info = TouchDelegate.touchInfo;
      let sequencesMap = info.activeSequenceMap;
      let sequence = sequencesMap.get(idStr);

      if (!sequence) {
        return;
      }

      let now = Date.now();

      let last = sequence.last;

      let distance = Math.sqrt(
        Math.pow(x - last.x, 2) + Math.pow(y - last.y, 2),
      );

      if (last && now - last.time < 100) {
        if (distance < 2) {
          return;
        }
      } else if (distance < 1) {
        return;
      }

      sequence.add({
        x,
        y,
        isStart: false,
        isEnd: false,
        time: Date.now(),
      });

      TouchDelegate.trigger(originalEvent);
    }
  }

  private static pointerUp(originalEvent: Event, id: number) {
    if (this.pointerDownTriggerCallbacks) {
      this.pointerDownTriggerCallbacks.push(process);
    } else {
      process();
    }

    function process() {
      let idStr = id.toString();
      let info = TouchDelegate.touchInfo;

      let sequencesMap = info.activeSequenceMap;
      let sequence = sequencesMap.get(idStr);

      if (!sequence) {
        return;
      }

      let points = sequence.touchPoints;
      let last = points[points.length - 1];

      sequence.add({
        x: last.x,
        y: last.y,
        isStart: false,
        isEnd: true,
        time: Date.now(),
      });

      sequencesMap.delete(idStr);

      TouchDelegate.trigger(originalEvent);

      if (!sequencesMap.size) {
        info.sequences.length = 0;
        info.dataMap.clear();
        TouchDelegate.triggerTarget = undefined;
        TouchDelegate.currentDelegateItems = [];
        TouchDelegate.timeoutIds.forEach(id => clearTimeout(id));
        TouchDelegate.timeoutIds.length = 0;
        TouchDelegate.stopAll = false;
        TouchDelegate.stopPropagationSet.clear();
      }
    }
  }

  private static trigger(
    originalEvent: Event,
    triggerItem?: TouchDelegateItem,
  ) {
    let info = TouchDelegate.touchInfo;

    TouchDelegate.currentDelegateItems = TouchDelegate.currentDelegateItems.filter(
      item => {
        if (triggerItem && triggerItem !== item) {
          return true;
        }

        let id = item.id;
        let identifier = item.identifier;
        let identifierName = identifier.name;

        if (
          TouchDelegate.stopAll ||
          TouchDelegate.stopPropagationSet.has(identifierName)
        ) {
          return false;
        }

        let dataMap = info.dataMap;
        let identified = dataMap.has(id);
        let data = dataMap.get(id);

        let result: TouchIdentifierResult | undefined;

        try {
          result = identifier.identify(info, identified, data);
        } catch (error) {
          // tslint:disable-next-line:no-console
          console.error(error);
          return false;
        }

        if (!result) {
          return true;
        }

        let match: boolean | undefined;
        let firstMatch = !identified;

        if (result.identified) {
          match = result.match;
          data = result.data;

          dataMap.set(id, data);

          if (identified) {
            if (match !== false) {
              match = true;
            }
          } else {
            identified = true;
          }
        } else if (typeof result.timeout === 'number') {
          let timeoutId = setTimeout(() => {
            TouchDelegate.trigger(originalEvent, item);
          }, result.timeout);
          TouchDelegate.timeoutIds.push(timeoutId);
          return true;
        }

        if (identified) {
          if (match) {
            let eventData: TouchDelegateEvent = {
              originalEvent,
              target: TouchDelegate.triggerTarget,
              touch: info,
              firstMatch,
              stopPropagation:
                result.end !== false
                  ? stopAll => {
                      if (stopAll) {
                        TouchDelegate.stopAll = true;
                      } else {
                        TouchDelegate.stopPropagationSet.add(identifier.name);
                      }
                    }
                  : stopAll => {
                      if (stopAll) {
                        TouchDelegate.stopAll = true;
                      } else {
                        throw new Error(
                          'can not call stopPropagation on a touch delegate event not marked as end',
                        );
                      }
                    },
            };

            if (data) {
              $.extend(eventData, data);
            }

            try {
              if (item.listener(eventData) === false) {
                return false;
              }
            } catch (e) {
              setTimeout(() => {
                throw e;
              }, 0);
            }
          }

          if (!match || result.end !== false) {
            return false;
          } else {
            return true;
          }
        } else {
          return true;
        }
      },
    );
  }
}

TouchDelegate.attachDocumentEventListeners();
