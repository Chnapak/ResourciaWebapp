import { Component, inject } from '@angular/core';
import { SchemaResponse, FilterKind } from '../../../../models/search-schema';
import { SearchService } from '../../../../services/search.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-filters',
  imports: [PageHeaderComponent],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss'
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
