import { Component, inject } from '@angular/core';
import { SchemaResponse, FilterKind } from '../../../../shared/models/search-schema';
import { SearchService } from '../../../../core/services/search.service';
import { AdminHeaderComponent } from '../../../../layouts/admin-layout/components/admin-header/admin-header.component';

@Component({
  selector: 'app-filters',
  imports: [AdminHeaderComponent],
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
