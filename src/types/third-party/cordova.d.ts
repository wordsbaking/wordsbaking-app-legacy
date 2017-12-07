interface CordovaStatic {
  platformId: string;
}

interface CordovaAppStatic {
  exitApp(): void;
  backHistory(): void;
}

interface Window {
  cordova?: CordovaStatic;
}

interface Navigator {
  app?: CordovaAppStatic;
}
