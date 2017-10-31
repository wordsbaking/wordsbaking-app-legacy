import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {frameTransitions} from 'app/core/ui';

const glanceTransitions = trigger('glanceTransitions', [...frameTransitions]);

@Component({
  selector: 'wb-view.glance-view',
  templateUrl: './glance.view.html',
  styleUrls: ['./glance.view.less'],
  animations: [glanceTransitions],
})
export class GlanceView {
  @HostBinding('@glanceTransitions') glanceTransitions = 'active';
}
