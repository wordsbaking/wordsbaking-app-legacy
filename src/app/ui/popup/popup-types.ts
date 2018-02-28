import {ComponentFactory, TemplateRef} from '@angular/core';

export type PopupShowType = 'drop-down' | 'location';

export type PopupSizeType = 'match-parent' | 'wrap-parent' | number | undefined;

export type PopupPositionType =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'left-top'
  | 'left-bottom'
  | 'right'
  | 'right-top'
  | 'right-bottom'
  | 'center';

export type PopupContentType = ComponentFactory<any> | TemplateRef<any>;

export interface PopupShowOptions {
  margin?: number;
  positions?: PopupPositionType[];
  width?: PopupSizeType;
  height?: PopupSizeType;
  background?: boolean | string;
  transparent?: boolean;
  contentOptions?: any;
  clearOnWindowResize?: boolean;
  clearOnWindowScroll?: boolean;
  clearOnClick?: boolean;
  clearOnOutsideClick?: boolean;
  animation?: PopupAnimation;
}

export interface PopupHandler {
  result: Promise<void>;
  clear(): void;
}

export type PopupAnimation = 'fadeIn' | 'fadeInDown' | 'bounceInUp';
