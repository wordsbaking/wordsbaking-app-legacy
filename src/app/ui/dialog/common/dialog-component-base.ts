import {OnComponentFactoryInit} from '../../util';

export interface DialogComponentInitOptions<T> {
  content: T;
  close(): void;
}

export abstract class DialogComponentBase<T>
  implements OnComponentFactoryInit<DialogComponentInitOptions<T>> {
  content: T;
  private closeHandler: () => void;

  wbOnComponentFactoryInit(options: DialogComponentInitOptions<T>): void {
    this.closeHandler = options.close;
    this.content = options.content;
  }

  close(): void {
    this.closeHandler();
  }
}
