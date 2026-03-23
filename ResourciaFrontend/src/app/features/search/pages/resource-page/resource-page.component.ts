import { Component } from '@angular/core';
import { ResourceHeroComponent } from './components/resource-hero/resource-hero.component';
import { ResourcePageBodyComponent } from './components/resource-page-body/resource-page-body.component';

@Component({
  selector: 'app-resource-page',
  imports: [ ResourceHeroComponent, ResourcePageBodyComponent ],
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.scss',
})
export class ResourcePageComponent {

}
