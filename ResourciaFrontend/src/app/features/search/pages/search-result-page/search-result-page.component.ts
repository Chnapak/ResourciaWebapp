import { Component, inject, OnInit, signal } from '@angular/core';
import { SchemaResponse } from '../../../../shared/models/search-schema';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { SearchService } from '../../../../core/services/search.service';
import { RouterLink } from '@angular/router';
import { ExploreToolbarComponent } from './components/explore-toolbar/explore-toolbar.component';
import { RadioComponent } from '../../../../shared/ui/radio/radio.component';
import { RadioFacetComponent } from '../../components/facets/radio-facet/radio-facet.component';
import { CheckboxFacetComponent } from '../../components/facets/checkbox-facet/checkbox-facet.component';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSingleFacetComponent } from '../../components/facets/searchable-single-facet/searchable-single-facet.component';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { SearchableMultiSelectComponent } from '../../../../shared/ui/searchable-multi-select/searchable-multi-select.component';
import { FiltersSectionComponent } from './components/filters-section/filters-section.component';
import { FiltersSidebarComponent } from './components/filters-sidebar/filters-sidebar.component';
import { ResourceCardComponent } from './components/resource-card/resource-card.component';


@Component({
  selector: 'app-search-result-page',
  standalone: true,
  imports: [ RouterLink, ExploreToolbarComponent, RadioFacetComponent, CheckboxFacetComponent, SearchableSingleFacetComponent , SearchableMultiSelectComponent, FiltersSidebarComponent, ResourceCardComponent ],
  templateUrl: './search-result-page.component.html',
  styleUrl: './search-result-page.component.scss'
})
export class SearchResultPageComponent implements OnInit {
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  collapsed = signal<Record<string, boolean>>({});

  private toaster = inject(ToasterService);

  resources = [
    {
      id: 1,
      title: 'Brilliant',
      url: 'https://www.brilliant.org',
      domain: 'brilliant.org',
      type: 'Interactive',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      tags: ['Math', 'Logic', 'STEM'],
      extraTagCount: 2,
      pricingLabel: 'Free trial',
      rating: 4.8,
      reviews: '2.5k',
      saves: 340,
      logoLetter: 'B'
    }
  ];


  constructor(private search: SearchService) {}

  ngOnInit(): void {
    
    this.toaster.show('Schema loaded successfully', 'success');
    /*this.search.schema().subscribe((data: SchemaResponse) => {
      console.log(data.filters)
      this.schema = data;

      const initial: Record<string, boolean> = {};
      for (const f of data.filters) initial[f.key] = true;
      this.collapsed.set(initial);
    });*/
  }



  toggleSection(key: string) {
    this.collapsed.update(m => ({ ...m, [key]: !m[key] }));
  }

  isCollapsed(key: string) {
    return this.collapsed()[key] ?? true;
  }

  clearAllFilters(): void {
    console.log('clear all filters');
  }

  onFacetChange(filter: any, value: string): void {
    console.log('facet change', filter, value);
  }

  onNumberRangeChange(filter: any, type: 'min' | 'max', value: string): void {
    console.log('range change', filter, type, value);
  }

  onBoolChange(filter: any, value: boolean): void {
    console.log('boolean change', filter, value);
  }

  onTextChange(filter: any, value: string): void {
    console.log('text change', filter, value);
  }

  openResource(resource: any): void {
    window.open(resource.url, '_blank');
  }

  shareResource(resource: any): void {
    console.log('share resource', resource);
  }
}
