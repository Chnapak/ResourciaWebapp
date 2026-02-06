import { Component, OnInit, signal } from '@angular/core';
import { SchemaResponse, FilterKind } from '../../../../models/search-schema';
import { SearchService } from '../../../../core/services/search.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-search-result-page',
  imports: [ RouterLink ],
  templateUrl: './search-result-page.component.html',
  styleUrl: './search-result-page.component.scss'
})
export class SearchResultPageComponent implements OnInit {
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  collapsed = signal<Record<string, boolean>>({});
  selected = signal<Record<string, any>>({});

  constructor(private search: SearchService) {}

  ngOnInit(): void {
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
}
