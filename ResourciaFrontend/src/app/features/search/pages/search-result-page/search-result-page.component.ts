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


@Component({
  selector: 'app-search-result-page',
  imports: [ RouterLink, ExploreToolbarComponent, RadioFacetComponent, CheckboxFacetComponent, SearchableSingleFacetComponent ],
  templateUrl: './search-result-page.component.html',
  styleUrl: './search-result-page.component.scss'
})
export class SearchResultPageComponent implements OnInit {
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  collapsed = signal<Record<string, boolean>>({});
  selected = signal<Record<string, any>>({});

  private toaster = inject(ToasterService);

  subjectOptions: SelectOption[] = [
    { value: 'math',    label: 'Mathematics', badge: '142' },
    { value: 'science', label: 'Science',     badge: '98'  },
    { value: 'history', label: 'History',     badge: '67'  },
  ];


  selectedType: unknown = null;


  constructor(private search: SearchService) {}

  ngOnInit(): void {
    
    this.toaster.show('Schema loaded successfully', 'success');
    this.search.schema().subscribe((data: SchemaResponse) => {
      console.log(data.filters)
      this.schema = data;

      const initial: Record<string, boolean> = {};
      for (const f of data.filters) initial[f.key] = true;
      this.collapsed.set(initial);
    });
  }

  sections = signal([
    { title: 'Subject', content: 'Subject content', collapsed: true },
    { title: 'Author', content: 'Author content', collapsed: true },
    { title: 'Year', content: 'Year content', collapsed: true },
  ]);

  toggleSection(key: string) {
    this.collapsed.update(m => ({ ...m, [key]: !m[key] }));
  }

  isCollapsed(key: string) {
    return this.collapsed()[key] ?? true;
  }

  onTextChange(filter: any, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selected.update(m => ({ ...m, [filter.key]: value }));
  }

  onBoolChange(filter: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update(m => ({ ...m, [filter.key]: checked }));
  }

  onNumberRangeChange(filter: any, side: 'min' | 'max', event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const n = raw === '' ? null : Number(raw);

    const current = this.selected()[filter.key] ?? { min: null, max: null };
    this.selected.update(m => ({
      ...m,
      [filter.key]: { ...current, [side]: n }
    }));
  }

  getPlaceholder(filterLabel: string): string {
    // One translatable message with an interpolated variable
    return $localize`:@@search.filter.placeholder:Type ${filterLabel}:label:...`;
  }

  onSubjectChange(value: unknown): void {
    console.log('Selected subject:', value);
    this.selectedType = value;
  }
}
