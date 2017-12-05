interface CordovaSplashScreenStatic {
  hide(): void;
  show(): void;
}

interface Navigator {
  splashscreen?: CordovaSplashScreenStatic;
}
