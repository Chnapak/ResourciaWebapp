import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { canActivateAdminGuard } from './admin.guard';
import { of, firstValueFrom } from 'rxjs';

describe('canActivateAdminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => canActivateAdminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getUserInfo: () => of({ isAdmin: true }),
          },
        },
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow admin', async () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.runInInjectionContext(async () => {
      const result = canActivateAdminGuard(route, state);
      const allowed = await firstValueFrom(of(result).pipe());
      expect(allowed).toBeTrue();
    });
  });

  it('should block non-admin', (done) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getUserInfo: () => of({ isAdmin: false }),
          },
        },
      ],
    });

  });
});
