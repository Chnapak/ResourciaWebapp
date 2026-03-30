import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EditProfileService } from '../../services/edit-profile.service';
import { EditProfilePageComponent } from './edit-profile-page.component';

describe('EditProfilePageComponent', () => {
  let component: EditProfilePageComponent;
  let fixture: ComponentFixture<EditProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfilePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: EditProfileService,
          useValue: {
            load: () => of({
              displayName: 'Martin Novak',
              username: 'martinnovak',
              bio: 'Connected profile.',
              location: 'Prague',
              website: 'https://resourcia.com',
              interests: ['Education'],
              avatarUrl: null,
            }),
            saveStatus: () => 'idle',
            saveMessage: () => null,
            resetStatus: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
