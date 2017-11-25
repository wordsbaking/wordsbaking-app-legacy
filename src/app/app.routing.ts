import {RouterModule, Routes} from '@angular/router';

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
    data: {target: 'glance'},
  },
  {
    path: 'study',
    loadChildren: './pages/study/study.module#StudyModule',
    data: {target: 'study'},
  },
  {
    path: 'settings',
    loadChildren: './pages/settings/settings.module#SettingsModule',
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
    data: {target: 'recycle-bin'},
  },
  {
    path: '**',
    redirectTo: 'glance',
  },
];

export const AppRouting = RouterModule.forRoot(routes, {
  enableTracing: false,
});
