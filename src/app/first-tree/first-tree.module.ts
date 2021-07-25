import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FirstTreePageRoutingModule } from './first-tree-routing.module';

import { FirstTreePage } from './first-tree.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FirstTreePageRoutingModule
  ],
  declarations: [FirstTreePage]
})
export class FirstTreePageModule {}
