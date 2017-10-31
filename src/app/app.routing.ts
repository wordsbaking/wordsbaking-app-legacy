import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'glance',
  },
  {
    path: 'sign-in',
    loadChildren: './pages/sign-in/sign-in.module#SignInModule',
    data: {target: 'sign-in'},
  },
  {
    path: 'glance',
    loadChildren: './pages/glance/glance.module#GlanceModule',
    data: {target: 'glance'},
  },
  {
    path: '**',
    redirectTo: 'glance',
  },
];

export const AppRouting = RouterModule.forRoot(routes, {
  enableTracing: false,
});
