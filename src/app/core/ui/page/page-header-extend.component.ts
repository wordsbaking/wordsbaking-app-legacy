import {Component} from '@angular/core';

@Component({
  selector: 'wb-page-header-extend',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; }'],
  animations: [],
})
export class PageHeaderExtendComponent {}
