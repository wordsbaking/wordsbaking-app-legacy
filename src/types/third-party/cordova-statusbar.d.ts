interface CordovaStatusBarStatic {
  overlaysWebView(overlay: boolean): void;
  styleDefault(): void;
  styleLightContent(): void;
  styleBlackTranslucent(): void;
  styleBlackOpaque(): void;
  backgroundColorByName(color: string): void;
  backgroundColorByHexString(colorHex: string): void;
  hide(): void;
  show(): void;
}

interface Window {
  StatusBar?: CordovaStatusBarStatic;
}
