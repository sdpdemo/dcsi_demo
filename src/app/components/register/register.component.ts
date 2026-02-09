import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var window: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  registerForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  registrationSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Expose function to get email for consent script
    window.getRegistrationEmail = () => {
      return this.registerForm?.get('email')?.value || '';
    };
  }

  ngAfterViewInit(): void {
    // Initialize consent widget after view is ready
    setTimeout(() => {
      this.initializeConsentWidget();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup global functions
    if (window.getRegistrationEmail) {
      delete window.getRegistrationEmail;
    }
  }

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  private initializeConsentWidget(): void {
    console.log('Initializing consent widget...');

    // Configure the consent widget
    window.consentWidgetConfig = {
      consentFormId: "29ee965d-f647-499b-848d-a52d077f1476",
      apiUrl: "https://qa-op.pre-dataprivacy.com/cpm-api/consent/v1/getConsentFormById",
      submitApiUrl: "https://qa-op.pre-dataprivacy.com/cpm-api/consent/v1/createOrUpdateConsent",
      showButtons: false,
      showLanguageDropdown: true,
      enableCheckboxes: true,
      enableRadioButtons: true,
      enableDropdowns: true
    };

    // Load the consent script
    this.loadConsentScript();
  }

  private loadConsentScript(): void {
    // Remove any existing script
    const existingScripts = document.querySelectorAll('script[src="assets/consent-script.js"]');
    existingScripts.forEach(script => script.remove());

    // Create and load new script
    const script = document.createElement('script');
    script.src = 'assets/consent-script.js';
    script.async = false;

    script.onload = () => {
      console.log('Consent script loaded successfully');
    };

    script.onerror = () => {
      console.error('Failed to load consent script');
      const root = document.getElementById('consent-root');
      if (root) {
        root.innerText = 'Failed to load consent form. Please refresh the page.';
      }
    };

    document.body.appendChild(script);
  }

  private hasSelectedConsent(): boolean {
    // Use the global function from consent script if available
    if (window.hasSelectedConsent) {
      return window.hasSelectedConsent();
    }
    return false;
  }

  onSubmit(): void {
    // Validate form fields
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if at least one consent is selected
    if (!this.hasSelectedConsent()) {
      this.errorMessage = 'Please select at least one consent option';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Capture consent data
    let consentData: any = null;
    if (window.captureConsentData) {
      consentData = window.captureConsentData();
      console.log('Captured consent data:', consentData);
    }

    const registrationData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email
    };

    console.log('Submitting registration:', registrationData);

    // Call registration API
    this.http.post('https://qa-op.pre-dataprivacy.com/cpm-api/dsci/register', registrationData)
      .subscribe({
        next: (response: any) => {
          console.log('Registration response:', response);

          if (response.createUserStatusCode === 200) {
            // Registration successful, now submit consent
            if (consentData && consentData.createConsentRequestList.length > 0) {
              this.submitConsent(consentData);
            } else {
              // No consent data to submit, just redirect
              this.handleSuccessfulRegistration();
            }
          } else {
            this.isLoading = false;
            this.errorMessage = response.createUserStatusMessage || 'Registration failed.';
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
  }

  private submitConsent(consentData: any): void {
    console.log('Submitting consent data...');

    // Update consent data with current email
    const currentEmail = this.registerForm.value.email;
    const updatedConsentData = consentData.createConsentRequestList.map((consent: any) => ({
      ...consent,
      dataPrincipalIdList: [{ key: "email", value: currentEmail }]
    }));

    this.http.post('https://qa-op.pre-dataprivacy.com/cpm-api/consent/v1/createOrUpdateConsent',
      { createConsentRequestDtoWrapper: updatedConsentData }
    )
      .subscribe({
        next: (consentResponse: any) => {
          console.log('Consent submission successful:', consentResponse);
          this.handleSuccessfulRegistration();
        },
        error: (error) => {
          console.error('Consent submission error:', error);
          // Still consider registration successful even if consent submission fails
          this.handleSuccessfulRegistration();
        }
      });
  }

  private handleSuccessfulRegistration(): void {
    this.isLoading = false;
    this.registrationSuccess = true;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}
