interface CordovaStatic {
  platformId: string;
}

interface CordovaAppStatic {
  exitApp(): void;
  backHistory(): void;
}

interface CordovaDeviceProfile {
  version: string;
}

interface Window {
  cordova?: CordovaStatic;
  device?: CordovaDeviceProfile;
}

interface Navigator {
  app?: CordovaAppStatic;
}
