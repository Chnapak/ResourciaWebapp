import { Component, inject, signal, OnInit, resource } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { AbstractControl, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubjectService } from '../../../../core/services/subject.service';
import { SubjectSimple } from '../../../../shared/models/subject-simple';
import { ResourceService } from '../../../../core/services/resource.service';
import { CreateResourceRequestModel } from '../../../../shared/models/create-resource-request';


@Component({
  selector: 'app-token-validation-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './token-validation-page.component.html',
  styleUrl: './token-validation-page.component.scss'
})
export class TokenValidationPageComponent implements OnInit {
  protected readonly fb = inject(FormBuilder);  
  protected readonly authService = inject(AuthService);
  protected readonly resourceService = inject(ResourceService);
  protected readonly subjectService = inject(SubjectService);
  protected readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  successVerifying = false;
  tokenErorr = false;

  step: number = 1;

  protected email?: string | null;
  protected token?: string | null;

  protected subjects?: SubjectSimple[] | null;

  public resourceForm = this.fb.group({
    resourceTitle: ['', [Validators.required]],
    resourceUrl: ['', [Validators.required, this.urlCheck()]],
    resourceSubject: ['', [Validators.required]],
  });

  private urlCheck() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      try {
        new URL(value);
        return { isUrlFormat: true};
      } catch (_) {
        return null;
      }
    }
  }

  ngOnInit(){
    const queryParams = this.route.snapshot.queryParams;
    this.token = queryParams['token'] ? decodeURIComponent(queryParams['token']) : null;
    this.email = queryParams['email'] || null;
    
    console.log(this.step)

    this.subjectService.getSubjects().subscribe(data => {
      console.log(data)
      this.subjects = data;
    });
  }

  next() {
    console.log(this.step)
    
    if (this.step == 1) {
      this.confirmEmail();
    }
    else if (this.step == 2) {
      this.postResource()
    }
    else {
      this.router.navigate(['/']); 
    }
  }

  checkStep(n: number) {
    let answer = this.step >= n
    console.log(answer)
    return this.step >= n
  }

  confirmEmail(){
    let t = this.token ? this.token : "";
    let e = this.email ? this.email : "";

    this.loading = true;
    this.error = null;

    this.authService.confirmToken(t, e).subscribe({next: () => {
        this.loading = false;
        this.successVerifying = true;
        this.step = 2;
      },
      error: () => {
        this.loading = false;
        this.error = "Token is old or invalid. Get a new link or start over.";
      }
    });
  }

  postResource() {
    this.loading = true;
    this.error = null;

    const formData = this.resourceForm.value;
    const model: CreateResourceRequestModel = {
      title: formData.resourceTitle!,
      url: formData.resourceUrl!,
      facets: {
        subject: [formData.resourceSubject!]
      }
    };

    this.resourceService.createResource(model).subscribe({
      next: (response) => {
        console.log('Resource created:', response);
        this.loading = false;
        this.step = 3; // Progress to next step
      },
      error: (err) => {
        this.loading = false;
        this.error = "Something went wrong while creating the resource.";
        console.error('postResource error:', err);
      }
    });
  }

}
