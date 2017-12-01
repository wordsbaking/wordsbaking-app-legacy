import {RouterModule, Routes} from '@angular/router';

import {AuthGuardService} from 'app/core/common';

import {SplashScreenView} from 'app/pages/splash-screen/splash-screen.view';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SplashScreenView,
  },
  {
    path: 'glance',
    loadChildren: './pages/glance/glance.module#GlanceModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {target: 'glance'},
  },
  {
    path: 'study',
    loadChildren: './pages/study/study.module#StudyModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {target: 'study'},
  },
  {
    path: 'settings',
    loadChildren: './pages/settings/settings.module#SettingsModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {target: 'settings'},
  },
  {
    path: 'sign-in',
    loadChildren: './pages/sign-in/sign-in.module#SignInModule',
    data: {target: 'sign-in'},
  },
  {
    path: 'sign-up',
    loadChildren: './pages/sign-up/sign-up.module#SignUpModule',
    data: {target: 'sign-up'},
  },
  {
    path: 'recycle-bin',
    loadChildren: './pages/recycle-bin/recycle-bin.module#RecycleBinModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {target: 'recycle-bin'},
  },
  {
    path: 'user-profile',
    loadChildren: './pages/user-profile/user-profile.module#UserProfileModule',
    canLoad: [AuthGuardService],
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    data: {target: 'user-profile'},
  },
  {
    path: '**',
    redirectTo: 'sign-in',
  },
];

export const AppRouting = RouterModule.forRoot(routes, {
  enableTracing: false,
});
