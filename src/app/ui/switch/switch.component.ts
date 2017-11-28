import {Component, ElementRef, HostBinding, Input} from '@angular/core';

export type SwitchComponentSize = 'large' | 'normal' | 'small';

@Component({
  selector: 'wb-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.less'],
})
export class SwitchComponent {
  @Input() value: string;

  @Input('tabindex') tabIndex: string | number | undefined = undefined;

  // @Output() checkedChange = new EventEmitter<boolean>();

  element: HTMLElement;

  @HostBinding('class.selected') private _checked = false;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;
  }

  @Input()
  set checked(checked: boolean) {
    this._checked = checked;
  }

  get checked(): boolean {
    return this._checked;
  }

  // onChange(event: Event): void {
  //   let checkboxInput = event.target as HTMLInputElement;
  //   this.checkboxChecked = checkboxInput.checked;

  //   this.checkedChange.emit(this.checkboxChecked);
  // }
}
