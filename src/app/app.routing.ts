import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'glance',
  },
  {
    path: 'glance',
    loadChildren: './pages/glance/glance.module#GlanceModule',
    data: {target: 'glance'},
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
    path: '**',
    redirectTo: 'glance',
  },
];

export const AppRouting = RouterModule.forRoot(routes, {
  enableTracing: false,
});
