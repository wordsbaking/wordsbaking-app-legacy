export type AndroidBackButtonBlocker = () => boolean;

export abstract class AppService {
  protected androidBackButtonBlockers: AndroidBackButtonBlocker[] = [];

  abstract init(): void;

  addAndroidBackButtonBlocker(blocker: AndroidBackButtonBlocker): void {
    this.androidBackButtonBlockers.push(blocker);
  }
}
