import { Component } from '@angular/core';
import { ResourceDescriptionCardComponent } from './components/resource-description-card/resource-description-card.component';
import { ActiveFilterChip } from '../../../../../../shared/models/active-filter-chip';
import { ResourceRatingsComponent } from './components/resource-ratings/resource-ratings.component';
import { ResourceDiscussionSectionComponent } from './components/resource-discussion-section/resource-discussion-section.component';

@Component({
  selector: 'app-resource-page-body',
  imports: [ResourceDescriptionCardComponent, ResourceRatingsComponent, ResourceDiscussionSectionComponent],
  templateUrl: './resource-page-body.component.html',
  styleUrl: './resource-page-body.component.scss',
})
export class ResourcePageBodyComponent {
  description: string = "Test test";
  tags: ActiveFilterChip[] = [
    {
      key: "subject",
      value: "math",
      displayValue: "Math"
    }
  ];
}
