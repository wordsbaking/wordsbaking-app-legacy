import {RouterModule, Routes} from '@angular/router';

import {SplashScreenView} from 'app/pages/splash-screen/splash-screen.view';

import {
  AuthGuardService,
  WelcomePageGuardService,
} from './app-router-guard-services';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SplashScreenView,
    data: {
      name: 'splash',
      preventLoadingHint: true,
      hideStatusBar: true,
      preventBackHistory: true,
    },
  },
  {
    path: 'welcome',
    loadChildren: './pages/welcome/welcome.module#WelcomeModule',
    data: {
      name: 'welcome',
      preventLoadingHint: true,
      hideStatusBar: true,
      preventBackHistory: true,
    },
    canLoad: [WelcomePageGuardService],
    canActivate: [WelcomePageGuardService],
  },
  {
    path: 'glance',
    loadChildren: './pages/glance/glance.module#GlanceModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {name: 'glance', preventLoadingHint: true, preventBackHistory: true},
  },
  {
    path: 'study',
    loadChildren: './pages/study/study.module#StudyModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {name: 'study'},
  },
  {
    path: 'settings',
    loadChildren: './pages/settings/settings.module#SettingsModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {name: 'settings'},
  },
  {
    path: 'sign-in',
    loadChildren: './pages/sign-in/sign-in.module#SignInModule',
    data: {name: 'sign-in', preventBackHistory: true},
  },
  {
    path: 'sign-up',
    loadChildren: './pages/sign-up/sign-up.module#SignUpModule',
    data: {name: 'sign-up', preventBackHistory: true},
  },
  {
    path: 'recycle-bin',
    loadChildren: './pages/recycle-bin/recycle-bin.module#RecycleBinModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {name: 'recycle-bin'},
  },
  {
    path: 'user-profile',
    loadChildren: './pages/user-profile/user-profile.module#UserProfileModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {name: 'user-profile'},
  },
  {
    path: '**',
    redirectTo: 'sign-in',
  },
];

export const AppRouting = RouterModule.forRoot(routes, {
  enableTracing: false,
});
