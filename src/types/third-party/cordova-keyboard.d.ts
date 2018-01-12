interface CordovaKeyboardPluginStatic {
  isVisible: boolean;
  automaticScrollToTopOnHiding: boolean;
  disableScrollingInShrinkView(value: boolean, callback?: Function): void;
  hideFormAccessoryBar(value: boolean, callback?: Function): void;
  shrinkView(value: boolean, callback?: Function): void;
  hide(): void;
  show(): void;
}

interface Window {
  Keyboard?: CordovaKeyboardPluginStatic;
}
