import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

export type SwitchComponentSize = 'large' | 'normal' | 'small';

@Component({
  selector: 'wb-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.less'],
})
export class SwitchComponent {
  @Input() value: string;

  @Input('tabindex') tabIndex: string | number | undefined = undefined;

  @Input()
  set checked(checked: boolean) {
    this.checkboxChecked = checked;
  }

  get checked(): boolean {
    return this.checkboxChecked;
  }

  @Output() checkedChange = new EventEmitter<boolean>();

  @Input()
  set size(size: SwitchComponentSize) {
    if (this.checkboxSize === size) {
      return;
    }

    this.element.classList.toggle('large', size === 'large');
    this.element.classList.toggle('normal', size === 'normal');
    this.element.classList.toggle('small', size === 'small');

    this.checkboxSize = size;
  }

  get size(): SwitchComponentSize {
    return this.checkboxSize || 'normal';
  }

  element: HTMLElement;

  @HostBinding('class.selected') private checkboxChecked = false;
  private checkboxSize: SwitchComponentSize;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;
  }

  onChange(event: Event): void {
    let checkboxInput = event.target as HTMLInputElement;
    this.checkboxChecked = checkboxInput.checked;

    this.checkedChange.emit(this.checkboxChecked);
  }
}
