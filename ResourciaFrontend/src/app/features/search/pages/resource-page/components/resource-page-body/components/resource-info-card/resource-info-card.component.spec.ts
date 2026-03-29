import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SearchService } from '../../../../../../../../core/services/search.service';
import { FilterKind } from '../../../../../../../../shared/models/filter-kind';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { ResourceInfoCardComponent } from './resource-info-card.component';

describe('ResourceInfoCardComponent', () => {
  let component: ResourceInfoCardComponent;
  let fixture: ComponentFixture<ResourceInfoCardComponent>;

  const searchServiceStub = {
    schema: () => of({
      filters: [
        {
          key: 'subject',
          label: 'Subject',
          kind: FilterKind.Facet,
          isMulti: true,
          resourceField: null,
          values: [{ value: 'math', label: 'Math' }],
        },
        {
          key: 'author',
          label: 'Author',
          kind: FilterKind.Text,
          isMulti: false,
          resourceField: 'Author',
          values: [],
        },
        {
          key: 'year',
          label: 'Year',
          kind: FilterKind.Range,
          isMulti: false,
          resourceField: 'Year',
          values: [],
        },
        {
          key: 'curriculum',
          label: 'Curriculum',
          kind: FilterKind.Facet,
          isMulti: true,
          resourceField: null,
          values: [{ value: 'ap', label: 'AP' }],
        },
      ],
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceInfoCardComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceStub },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render core metadata together with schema-driven rows', () => {
    const resource: ResourceDetailModel = {
      id: 'resource-id',
      title: 'Linear Algebra Course',
      description: 'Course description',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra',
      isFree: true,
      year: 2025,
      author: 'Gilbert Strang',
      learningStyle: 'Video',
      tags: ['math'],
      facets: [
        { key: 'type', value: 'course', label: 'Course' },
        { key: 'language', value: 'english', label: 'English' },
        { key: 'difficulty', value: 'intermediate', label: 'Intermediate' },
        { key: 'subject', value: 'math', label: 'Math' },
      ],
      ratings: {
        averageRating: 4.9,
        totalCount: 10,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 1,
        count5: 9,
      },
      savesCount: 7,
      createdBy: 'stefan_r',
      createdAtUtc: '2025-09-14T00:00:00.000Z',
      updatedAtUtc: '2026-02-28T00:00:00.000Z',
      reviews: [],
      discussions: [],
    };

    component.resource = resource;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Course');
    expect(text).toContain('ocw.mit.edu');
    expect(text).toContain('English');
    expect(text).toContain('Intermediate');
    expect(text).toContain('Free');
    expect(text).toContain('Subject');
    expect(text).toContain('Math');
    expect(text).toContain('Author');
    expect(text).toContain('Gilbert Strang');
    expect(text).toContain('Year');
    expect(text).toContain('2025');
    expect(text).toContain('stefan_r');
    expect(text).toContain('7 saves');
    expect(text).toContain('Curriculum');
    expect(text).toContain('Not specified');
  });
});
