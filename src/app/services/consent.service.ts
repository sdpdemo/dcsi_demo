import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConsentPermission {
  id: string;
  text: string;
  elementType: 'CHECKBOX' | 'RADIOBUTTON' | 'DROPDOWN';
  mandatory: boolean;
  options: string[];
  permissionTranslation: Array<{
    language: string;
    languageCode: string;
    text: string;
    options: string[];
  }>;
}

export interface ConsentFormData {
  id: string;
  name: string;
  consentFormId: string;
  permissions: ConsentPermission[];
  branding: {
    companyName: string;
    logo?: string;
  };
}

export interface ConsentSubmissionItem {
  dataPrincipalIdList: Array<{ key: string; value: string }>;
  permissionId: string;
  consentReceivedType: string;
  optedFor: string[];
  consentLanguage: string;
}

export interface ConsentFormResponse {
  statusCode: number;
  statusMessage: string;
  response: ConsentFormData[];
}

export interface ConsentSubmissionResponse {
  statusCode: number;
  statusMessage: string;
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  private readonly CONSENT_FORM_ID = '45fc7e93-94aa-4a8c-b047-4ec37b5ba4a0';
  private readonly API_URL = 'https://dev-hs.qhtpl.com/cpm-api/consent/v1';

  constructor(private http: HttpClient) {}

  getConsentForm(): Observable<ConsentFormResponse> {
    return this.http.post<ConsentFormResponse>(
      `${this.API_URL}/getConsentFormById`,
      { consentFormId: this.CONSENT_FORM_ID }
    );
  }

  submitConsent(consentData: ConsentSubmissionItem[]): Observable<ConsentSubmissionResponse> {
    return this.http.post<ConsentSubmissionResponse>(
      `${this.API_URL}/createOrUpdateConsent`,
      { createConsentRequestDtoWrapper: consentData }
    );
  }
}
