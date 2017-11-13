import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'wb-selection-list-item',
  templateUrl: './selection-list-item.component.html',
  styleUrls: ['./selection-list-item.component.less'],
})
export class SelectionListItemComponent<T> {
  @Input('selected')
  set selectedInput(selected: boolean) {
    if (selected !== this.selected) {
      this.toggleSelect(!!selected);
    }
  }

  @Output('selected') selectedChangeEvent = new EventEmitter<boolean>();

  @Input() value: T | undefined;

  element: HTMLElement;

  get selected(): boolean {
    return this.selectionState;
  }

  @HostBinding('class.selected') private selectionState = false;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;
  }

  toggleSelect(force?: boolean): void {
    let {selectionState} = this;
    let nextSelectionState = force === undefined ? !selectionState : force;

    if (nextSelectionState === selectionState) {
      return;
    }

    this.selectionState = nextSelectionState;

    this.selectedChangeEvent.emit(this.selectionState);
  }
}
