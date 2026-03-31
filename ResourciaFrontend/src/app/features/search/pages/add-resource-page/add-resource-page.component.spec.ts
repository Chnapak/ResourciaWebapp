import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ResourceService } from '../../../../core/services/resource.service';
import { SearchService } from '../../../../core/services/search.service';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { AddResourcePageComponent } from './add-resource-page.component';

describe('AddResourcePageComponent', () => {
  let component: AddResourcePageComponent;
  let fixture: ComponentFixture<AddResourcePageComponent>;
  let resourceServiceSpy: jasmine.SpyObj<ResourceService>;
  let router: Router;

  const subjectFilter = {
    key: 'subject',
    label: 'Subject',
    kind: FilterKind.Facet,
    isMulti: true,
    resourceField: null,
    values: [
      { value: 'math', label: 'Math' },
      { value: 'science', label: 'Science' },
    ],
  };

  const authorFilter = {
    key: 'author',
    label: 'Author',
    kind: FilterKind.Text,
    isMulti: false,
    resourceField: 'Author',
    values: [],
  };

  const yearFilter = {
    key: 'year',
    label: 'Year',
    kind: FilterKind.Range,
    isMulti: false,
    resourceField: 'Year',
    values: [],
  };

  const isFreeFilter = {
    key: 'isFree',
    label: 'Free only',
    kind: FilterKind.Boolean,
    isMulti: false,
    resourceField: 'IsFree',
    values: [],
  };

  beforeEach(async () => {
    resourceServiceSpy = jasmine.createSpyObj<ResourceService>('ResourceService', ['createResource']);
    resourceServiceSpy.createResource.and.returnValue(
      of({
        id: 'resource-id',
        title: 'W3Schools',
        url: 'https://www.w3schools.com',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AddResourcePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: SearchService,
          useValue: {
            schema: () => of({
              filters: [subjectFilter, authorFilter, yearFilter, isFreeFilter],
            }),
          },
        },
        { provide: ResourceService, useValue: resourceServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(AddResourcePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads schema-driven filters and submits the backend payload', () => {
    component.resourceForm.patchValue({
      title: 'W3Schools',
      url: 'w3schools.com',
      description: 'Learn coding online.',
    });

    component.getFilterControl(subjectFilter)?.setValue(['math']);
    component.getFilterControl(authorFilter)?.setValue('W3Schools');
    component.getFilterControl(yearFilter)?.setValue('1998');
    component.getFilterControl(isFreeFilter)?.setValue('true');

    component.submit();

    expect(fixture.nativeElement.textContent).toContain('Subject');
    expect(fixture.nativeElement.textContent).toContain('Author');
    expect(resourceServiceSpy.createResource).toHaveBeenCalledWith({
      title: 'W3Schools',
      url: 'https://w3schools.com',
      description: 'Learn coding online.',
      facets: {
        subject: ['math'],
      },
      author: 'W3Schools',
      year: 1998,
      isFree: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/resource', 'resource-id']);
  });
});
