import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { SearchService } from '../../../../../../core/services/search.service';
import { ResourceSearchComponent } from './resource-search.component';
import { FilterKind } from '../../../../../../shared/models/filter-kind';

describe('ResourceSearchComponent', () => {
  let component: ResourceSearchComponent;
  let fixture: ComponentFixture<ResourceSearchComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ResourceSearchComponent],
      providers: [
        {
          provide: Router,
          useValue: router
        },
        {
          provide: SearchService,
          useValue: {
            schema: () => of({
              filters: [
                {
                  key: 'subject',
                  label: 'Subject',
                  kind: FilterKind.Facet,
                  isMulti: true,
                  resourceField: null,
                  values: [{ value: 'math', label: 'Math' }]
                },
                {
                  key: 'author',
                  label: 'Author',
                  kind: FilterKind.Text,
                  isMulti: false,
                  resourceField: 'Author',
                  values: []
                },
                {
                  key: 'usesAi',
                  label: 'Uses AI',
                  kind: FilterKind.Boolean,
                  isMulti: false,
                  resourceField: 'UsesAi',
                  values: []
                },
                {
                  key: 'monetization',
                  label: 'Monetization',
                  kind: FilterKind.Facet,
                  isMulti: false,
                  resourceField: null,
                  values: [
                    { value: 'free', label: 'Free' },
                    { value: 'subscription', label: 'Subscription' }
                  ]
                },
                {
                  key: 'year',
                  label: 'Year',
                  kind: FilterKind.Range,
                  isMulti: false,
                  resourceField: 'Year',
                  values: []
                }
              ]
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should prioritise subject, uses AI, and monetization filters from schema', () => {
    expect(component.filters.map((filter) => filter.key)).toEqual(['subject', 'usesAi', 'monetization']);
  });

  it('should navigate using backend filter keys and both boolean states', () => {
    component.formValues = {
      subject: 'math',
      usesAi: 'false',
      monetization: 'subscription'
    };

    component.onSearch();

    expect(router.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: {
        subject: 'math',
        usesAi: 'false',
        monetization: 'subscription'
      }
    });
  });
});
