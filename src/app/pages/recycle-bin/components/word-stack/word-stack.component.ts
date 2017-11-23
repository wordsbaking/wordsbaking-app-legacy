import {Component, Input} from '@angular/core';

export interface WordStack {
  title: string;
  words: string[];
}

@Component({
  selector: 'wb-recycle-bin-view-word-stack',
  templateUrl: './word-stack.component.html',
  styleUrls: ['./word-stack.component.less'],
})
export class WordStackComponent {
  @Input() title: string;
  @Input() words: string[];
}
