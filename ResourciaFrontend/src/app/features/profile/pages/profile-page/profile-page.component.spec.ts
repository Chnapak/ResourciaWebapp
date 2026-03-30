import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { ProfileViewModel } from '../../models/profile.model';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;

  const currentUser$ = new BehaviorSubject<any>(null);

  const profile: ProfileViewModel = {
    id: 'user-1',
    name: 'Martin Novak',
    handle: 'martinnovak',
    bio: 'Connected profile.',
    avatarInitials: 'MN',
    role: 'contributor',
    isVerified: true,
    joinedAt: '2026-01-01T00:00:00Z',
    lastActive: '2026-03-30T00:00:00Z',
    interests: ['Web Development'],
    stats: {
      resourcesShared: 1,
      reviewsWritten: 1,
      helpfulVotes: 3,
      resourcesSaved: 2,
    },
    sharedResources: [],
    recentReviews: [],
    recentActivity: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ username: 'Martin Novak' })),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            getProfile: () => of(profile),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser$: currentUser$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
