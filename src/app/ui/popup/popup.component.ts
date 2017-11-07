import {
  AfterViewChecked,
  Component,
  ComponentFactory,
  ComponentRef,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import * as $ from 'jquery';

import {OnComponentFactoryInit} from '../util';

import {PopupPositionType, PopupShowType, PopupSizeType} from './popup-types';

export interface ComponentType<T> {
  new (...args: any[]): T;
}

type XAxisPosition = 'left' | 'right' | 'center';
type YAxisPosition = 'top' | 'bottom' | 'center';
type AxisPosition = XAxisPosition | YAxisPosition;
type PositionSolution = [boolean, AxisPosition, AxisPosition | undefined];

export interface PopupInitOptions {
  showType: PopupShowType;
  componentRef: ComponentRef<PopupComponent>;
  content: ContextualPopupContent;
  contentOptions?: any;
  context: HTMLElement;
  positions?: PopupPositionType[];
  margin?: number;
  width?: PopupSizeType;
  height?: PopupSizeType;
  transparent?: boolean;
  staticContextOffset?: boolean;
}

export interface PopupPositionInfo {
  left: number;
  top: number;
  solution: PositionSolution | undefined;
}

export interface OnContextualPopupPositionChange {
  onContextualPopupPositionChange(positionInfo: PopupPositionInfo): void;
}

type ContextualPopupContent =
  | ComponentFactory<
      OnComponentFactoryInit<any> & OnContextualPopupPositionChange
    >
  | TemplateRef<any>;

const $WINDOW = $(window);

@Component({
  selector: 'wb-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.less'],
})
export class PopupComponent implements OnInit, AfterViewChecked {
  element: HTMLElement;

  @ViewChild('placeholder', {read: ViewContainerRef})
  private placeholder: ViewContainerRef;

  private componentRef: ComponentRef<PopupComponent>;
  private content: ContextualPopupContent;
  private contentComponentRef: ComponentRef<
    OnComponentFactoryInit<any> & OnContextualPopupPositionChange
  >;
  private contentOptions: any;

  private showType: PopupShowType;
  private $popup: JQuery;
  private $context: JQuery;
  private margin: number;
  private positions: PopupPositionType[];
  private popupWidthSize: PopupSizeType;
  private popupHeightSize: PopupSizeType;

  private contextWidth: number;
  private contextHeight: number;
  private contextLeft: number;
  private contextTop: number;
  private staticContextOffset: boolean;

  private currentPositionInfo: PopupPositionInfo | undefined;

  private hidden = false;

  private adjust: () => void;

  constructor(private ref: ElementRef) {
    this.element = ref.nativeElement;
  }

  init({
    showType,
    componentRef,
    content,
    context,
    margin = 5,
    positions = ['bottom', 'top'],
    contentOptions,
    width,
    height,
    transparent,
    staticContextOffset,
  }: PopupInitOptions): void {
    this.componentRef = componentRef;
    this.content = content;
    this.showType = showType;
    this.contentOptions = contentOptions;
    this.$popup = $(this.ref.nativeElement);
    this.$context = $(context);
    this.margin = margin;
    this.positions = positions;
    this.popupWidthSize = width;
    this.popupHeightSize = height;
    this.staticContextOffset = !!staticContextOffset;
    this.adjust =
      showType === 'drop-down'
        ? this.dropDownProviderAdjust
        : this.locationProviderAdjust;

    if (transparent) {
      this.$popup.addClass('transparent');
    }

    this.$popup.addClass('wb-popup');
  }

  ngOnInit(): void {
    let {content, contentOptions, placeholder, $context} = this;

    if (content instanceof TemplateRef) {
      placeholder.createEmbeddedView(content);
    } else {
      this.contentComponentRef = placeholder.createComponent(content);
      let {instance} = this.contentComponentRef;

      if (instance.wbOnComponentFactoryInit) {
        instance.wbOnComponentFactoryInit(contentOptions);
      }
    }

    this.contextWidth = $context.innerWidth()!;
    this.contextHeight = $context.innerHeight()!;

    let {left: contextLeft, top: contextTop} = $context.offset()!;

    this.contextLeft = contextLeft;
    this.contextTop = contextTop;
  }

  ngAfterViewChecked(): void {
    this.adjust();
  }

  private dropDownProviderAdjust(): void {
    let {
      $popup,
      $context,
      margin = 5,
      positions = ['bottom', 'top'] as PopupPositionType[],
      popupWidthSize,
      popupHeightSize,
      contextWidth,
      contextHeight,
      contextLeft,
      contextTop,
      contentComponentRef,
      currentPositionInfo,
    } = this;

    if (!this.staticContextOffset) {
      let {left, top} = $context.offset()!;

      contextLeft = left;
      contextTop = top;
    }

    if ($context.parents('body').length === 0) {
      if (!this.hidden) {
        $popup.addClass('hidden');
        this.hidden = true;
      }

      return;
    }

    if (this.hidden) {
      $popup.removeClass('hidden');
      this.hidden = false;
    }

    $popup.css({
      width: '',
      height: '',
    });

    let windowWidth = $WINDOW.width()!;
    let windowHeight = $WINDOW.height()!;

    let popupWidth = calculatePopupSize(
      contextWidth,
      $popup.outerWidth()!,
      popupWidthSize,
    );

    let popupHeight = calculatePopupSize(
      contextHeight,
      $popup.outerHeight()!,
      popupHeightSize,
    );

    $popup.css({
      width: `${popupWidth}px`,
      height: `${popupHeight}px`,
    });

    let solution: PositionSolution | undefined;

    for (let position of positions) {
      let trial = evaluate(position);

      if (trial[0]) {
        solution = trial;
        break;
      }

      if (!solution) {
        solution = trial;
      }
    }

    let left: number;
    let top: number;

    let [, side, direction] = solution!;

    if (side === 'center') {
      left = contextLeft + (contextWidth - popupWidth) / 2 - margin;
      top = contextTop + (contextHeight - popupHeight) / 2 - margin;
    } else if (side === 'left' || side === 'right') {
      left = calculateSideX(side);
      top = calculateDirectionY(direction as YAxisPosition | undefined);
    } else {
      top = calculateSideY(side);
      left = calculateDirectionX(direction as XAxisPosition | undefined);
    }

    if (
      currentPositionInfo &&
      currentPositionInfo.left === left &&
      currentPositionInfo.top === top
    ) {
      return;
    }

    $popup.css({left: `${left}px`, top: `${top}px`});

    this.currentPositionInfo = {
      left,
      top,
      solution,
    };

    if (contentComponentRef) {
      let {instance} = contentComponentRef;

      if (instance && instance.onContextualPopupPositionChange) {
        instance.onContextualPopupPositionChange({
          ...this.currentPositionInfo,
        });
      }
    }

    function calculateSideX(position: XAxisPosition): number {
      if (position === 'left') {
        return contextLeft - margin - popupWidth;
      } else {
        return contextLeft + contextWidth + margin;
      }
    }

    function calculateDirectionX(position: XAxisPosition | undefined): number {
      if (position === 'left') {
        return Math.min(contextLeft, windowWidth - popupWidth);
      } else if (position === 'right') {
        return Math.max(contextLeft + contextWidth - popupWidth, 0);
      } else {
        let ideal = contextLeft + contextWidth / 2 - popupWidth / 2;

        if (ideal < 0) {
          return 0;
        } else if (ideal + popupWidth > windowWidth) {
          return Math.max(windowWidth - popupWidth, 0);
        } else {
          return ideal;
        }
      }
    }

    function calculateSideY(position: YAxisPosition): number {
      if (position === 'top') {
        return contextTop - margin - popupHeight;
      } else {
        return contextTop + contextHeight + margin;
      }
    }

    function calculateDirectionY(position: YAxisPosition | undefined): number {
      if (position === 'top') {
        return Math.min(contextTop, windowHeight - popupHeight);
      } else if (position === 'bottom') {
        return Math.max(contextTop + contextHeight - popupHeight, 0);
      } else {
        let ideal = contextTop + contextHeight / 2 - popupHeight / 2;

        if (ideal < 0) {
          return 0;
        } else if (ideal + popupHeight > windowHeight) {
          return Math.max(windowHeight - popupHeight, 0);
        } else {
          return ideal;
        }
      }
    }

    function evaluate(position: PopupPositionType): PositionSolution {
      let groups =
        /(left|right|top|bottom|center)(?:-(left|right|top|bottom))?/.exec(
          position,
        ) || [];

      let side = groups[1] as AxisPosition;
      let direction = groups[2] as AxisPosition | undefined;

      if (side === 'center') {
        return [true, 'center', 'center'];
      }

      if (side === 'left' || side === 'right') {
        let [xValid, xPosition] = evaluateSideX(side);
        let [yValid, yPosition] = evaluateDirectionY(direction as
          | YAxisPosition
          | undefined);
        return [xValid && yValid, xPosition, yPosition];
      } else {
        let [yValid, yPosition] = evaluateSideY(side);
        let [xValid, xPosition] = evaluateDirectionX(direction as
          | XAxisPosition
          | undefined);
        return [yValid && xValid, yPosition, xPosition];
      }
    }

    function evaluateSideX(position: XAxisPosition): [boolean, XAxisPosition] {
      if (position === 'left') {
        if (contextLeft - margin >= popupWidth) {
          return [true, 'left'];
        }
      } else if (position === 'right') {
        if (contextLeft + contextWidth + margin + popupWidth <= windowWidth) {
          return [true, 'right'];
        }
      }

      return [false, position];
    }

    function evaluateDirectionX(
      position: XAxisPosition | undefined,
    ): [boolean, XAxisPosition | undefined] {
      if (position === 'left') {
        if (contextLeft + popupWidth <= windowWidth) {
          return [true, 'left'];
        }
      } else if (position === 'right') {
        if (popupWidth <= contextLeft + contextWidth) {
          return [true, 'right'];
        }
      } else if (popupWidth <= windowWidth) {
        return [true, undefined];
      }

      return [false, position];
    }

    function evaluateSideY(position: YAxisPosition): [boolean, YAxisPosition] {
      if (position === 'top') {
        if (contextTop - margin >= popupHeight) {
          return [true, 'top'];
        }
      } else if (position === 'bottom') {
        if (contextTop + contextHeight + margin + popupHeight <= windowHeight) {
          return [true, 'bottom'];
        }
      }

      return [false, position];
    }

    function evaluateDirectionY(
      position: YAxisPosition | undefined,
    ): [boolean, YAxisPosition | undefined] {
      if (position === 'top') {
        if (contextTop + popupHeight <= windowHeight) {
          return [true, 'top'];
        }
      } else if (position === 'bottom') {
        if (popupHeight <= contextTop + contextHeight) {
          return [true, 'bottom'];
        }
      } else if (popupHeight <= windowHeight) {
        return [true, undefined];
      }

      return [false, position];
    }

    function calculatePopupSize(
      parentSize: number,
      contentSize: number,
      size: PopupSizeType,
    ): number {
      if (typeof size === 'number') {
        return size;
      } else if (size === 'match-parent') {
        return parentSize;
      } else {
        return contentSize;
      }
    }
  }

  private locationProviderAdjust(): void {
    let {
      $popup,
      $context,
      // margin = 5,
      positions = ['center'] as PopupPositionType[],
      popupWidthSize,
      popupHeightSize,
      contextWidth,
      contextHeight,
      // contextLeft,
      // contextTop,
      // contentComponentRef,
      // currentPositionInfo,
    } = this;

    if (
      $context.parents('body').length === 0 &&
      $context[0] !== document.body
    ) {
      if (!this.hidden) {
        $popup.addClass('hidden');
        this.hidden = true;
      }

      return;
    }

    if (this.hidden) {
      $popup.removeClass('hidden');
      this.hidden = false;
    }

    let popupWidth = calculatePopupSize(
      contextWidth,
      $popup.outerWidth()!,
      popupWidthSize,
    );

    let popupHeight = calculatePopupSize(
      contextHeight,
      $popup.outerHeight()!,
      popupHeightSize,
    );

    $popup.css({
      width: `${popupWidth}px`,
      height: `${popupHeight}px`,
    });

    let position = positions[positions.length - 1];
    let groups =
      /(left|right|top|bottom|center)(?:-(left|right|top|bottom))?/.exec(
        position,
      ) || [];

    let side = groups[1] as AxisPosition;
    let direction = groups[2] as AxisPosition | undefined;
    let top = 0;
    let left = 0;

    switch (side) {
      case 'left':
      case 'right':
        left = calculateX(side);
        top = calculateY(direction as YAxisPosition | undefined);
        break;
      case 'top':
      case 'bottom':
        top = calculateY(side);
        left = calculateX(direction as XAxisPosition | undefined);
        break;
      case 'center':
        left = (contextWidth - popupWidth) / 2;
        top = (contextHeight - popupHeight) / 2;
        break;
    }

    $popup.css({left: `${left}px`, top: `${top}px`});

    function calculateX(position: XAxisPosition | undefined): number {
      if (position === 'left') {
        return 0;
      } else if (position === 'right') {
        return contextWidth - popupWidth;
      } else {
        return (contextWidth - popupWidth) / 2;
      }
    }

    function calculateY(position: YAxisPosition | undefined): number {
      if (position === 'top') {
        return 0;
      } else if (position === 'bottom') {
        return contextHeight - popupHeight;
      } else {
        return (contextHeight - popupHeight) / 2;
      }
    }

    function calculatePopupSize(
      parentSize: number,
      contentSize: number,
      size: PopupSizeType,
    ): number {
      if (typeof size === 'number') {
        return size;
      } else if (size === 'match-parent') {
        return parentSize;
      } else {
        return contentSize;
      }
    }
  }
}
