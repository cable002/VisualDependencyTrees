import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FirstTreePage } from './first-tree.page';

const routes: Routes = [
  {
    path: '',
    component: FirstTreePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FirstTreePageRoutingModule {}
