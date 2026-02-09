import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

declare var window: any;

@Component({
  selector: 'app-preference-center',
  templateUrl: './preference-center.component.html',
  styleUrls: ['./preference-center.component.css', '../../../assets/preference-styles.css']
})
export class PreferenceCenterComponent implements OnInit, AfterViewInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if user is logged in
    const email = sessionStorage.getItem('email');
    const dataPrincipalToken = sessionStorage.getItem('dataPrincipalToken');

    if (!email || !dataPrincipalToken) {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
    this.initPreferenceCenter();
  }

  private initPreferenceCenter(): void {
    const email = sessionStorage.getItem('email') || '';
    const dataPrincipalToken = sessionStorage.getItem('dataPrincipalToken') || '';

    // Set up preference center widget configuration
    window.consentWidgetConfig = {
      preferenceFormId: "d1dd24e4-e49d-42e2-9ca9-8d9eec0150ef",
      preferenceDetailsApiUrl: "https://qa-op.pre-dataprivacy.com/cpm-api/preference/v1/export/getPreferenceDetails",
      preferenceHistoryApiUrl: "https://qa-op.pre-dataprivacy.com/cpm-api/preference/v1/export/auditSearch/scroll",
      submitApiUrl: "https://qa-op.pre-dataprivacy.com/cpm-api/consent/v1/createOrUpdateConsent",
      userToken: `Bearer ${dataPrincipalToken}`,
      dataPrincipalId: {
        key: "email",
        value: email
      },
      showButtons: true,
      showLanguageDropdown: true,
     enableCheckboxes: true,
      enableRadioButtons: true,
      enableDropdowns: true,
      footerAlignment: "left"
    };

    // Load the preference center script from assets
    this.loadPreferenceScript();
  }

  private loadPreferenceScript(): void {
    const script = document.createElement('script');
    script.src = 'assets/preference-script.js';
    script.async = false;
    document.body.appendChild(script);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}

