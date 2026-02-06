import { Component, inject } from '@angular/core';
import { SchemaResponse, FilterKind } from '../../../../models/search-schema';
import { SearchService } from '../../../../core/services/search.service';
import { PageHeaderComponent } from '../../../../pages/admin-hub-page/shared/page-header/page-header.component';

@Component({
  selector: 'app-filters',
  imports: [PageHeaderComponent],
  templateUrl: './filters-page.component.html',
  styleUrl: './filters-page.component.scss'
})
export class FiltersAdminPageComponent {
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  protected readonly SearchService = inject(SearchService);

  ngOnInit(): void {
    this.SearchService.schema().subscribe((data: SchemaResponse) => {
      console.log(data.filters)
      this.schema = data; 
    })
  }
}
