import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {EngineService} from 'app/core/engine';
import {pageTransitions} from 'app/core/ui';

const glanceViewTransitions = trigger('glanceViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.glance-view',
  templateUrl: './glance.view.html',
  styleUrls: ['./glance.view.less'],
  animations: [glanceViewTransitions],
})
export class GlanceView {
  @HostBinding('@glanceViewTransitions') glanceViewTransitions = 'active';

  constructor(private engineService: EngineService) {}
}
