import {Component, ElementRef, HostBinding, OnInit} from '@angular/core';

import * as $ from 'jquery';

import * as logger from 'logger';

import {Easing, animate} from 'app/lib/animate';

import {NavigationService} from 'app/core/navigation';

import {FreeDelegateEvent} from 'app/lib/touch-delegate';

import {welcomeTransitions} from './welcome.animations';

@Component({
  selector: 'wb-view.welcome-view',
  templateUrl: './welcome.view.html',
  styleUrls: ['./welcome.view.less'],
  animations: [welcomeTransitions],
})
export class WelcomeView implements OnInit {
  element: HTMLElement;

  @HostBinding('@welcomeTransitions') welcomeTransitionsState = '';

  private $element: JQuery;
  private $slideLine: JQuery;
  private slideLineMoveTargetStyle: CSSStyleDeclaration;
  private sliding = false;

  constructor(ref: ElementRef, private navigationService: NavigationService) {
    this.element = ref.nativeElement;
    this.$element = $(this.element);
  }

  async onSlideLineTouchFree(originEvent: FreeDelegateEvent): Promise<void> {
    let {$slideLine, $element} = this;

    let event = originEvent.detail;

    if (event.touch.isStart) {
      $slideLine.addClass('hover');
    }

    if (event.touch.isEnd) {
      this.sliding = false;

      if (event.diffX <= -20) {
        $element.addClass('leave');
        localStorage.setItem('MET_CIBEI', new Date().toISOString());

        setTimeout(() => {
          this.navigationService.navigate(['/sign-up']).catch(logger.error);
        }, 400);
      } else {
        try {
          await animate(event.diffX, 0, 200, Easing.circular, diffX => {
            if (this.sliding) {
              return;
            }

            this.updateSlideLinePosition(diffX);
          });
        } catch (e) {}

        $slideLine.removeClass('hover');
      }
    } else {
      this.sliding = true;

      this.updateSlideLinePosition(event.diffX);
    }
  }

  ngOnInit(): void {
    this.$slideLine = $('.slide-line', this.element);
    this.slideLineMoveTargetStyle = this.$slideLine.find('.hint')[0].style;
  }

  private updateSlideLinePosition(offset: number): void {
    let {slideLineMoveTargetStyle} = this;
    slideLineMoveTargetStyle.transform = `translate3d(${offset}px, 0, 0)`;
    slideLineMoveTargetStyle.opacity = (1 - Math.abs(offset) / 200) as any;
  }
}
