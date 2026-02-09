import { Component, OnInit, Input } from '@angular/core';
import { ConsentService, ConsentFormData, ConsentPermission, ConsentSubmissionItem } from '../../services/consent.service';

@Component({
  selector: 'app-consent-form',
  templateUrl: './consent-form.component.html',
  styleUrls: ['./consent-form.component.css']
})
export class ConsentFormComponent implements OnInit {
  @Input() userEmail: string = '';

  formData: ConsentFormData | null = null;
  permissions: ConsentPermission[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  selectedValues: Map<string, Set<string>> = new Map();

  constructor(private consentService: ConsentService) {}

  ngOnInit(): void {
    this.loadConsentForm();
  }

  loadConsentForm(): void {
    this.isLoading = true;
    this.consentService.getConsentForm().subscribe({
      next: (response) => {
        if (response.response && response.response.length > 0) {
          this.formData = response.response[0];
          this.permissions = this.formData.permissions || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load consent form';
        this.isLoading = false;
      }
    });
  }

  onCheckboxChange(permissionId: string, option: string, event: any): void {
    if (!this.selectedValues.has(permissionId)) {
      this.selectedValues.set(permissionId, new Set());
    }

    if (event.target.checked) {
      this.selectedValues.get(permissionId)!.add(option);
    } else {
      this.selectedValues.get(permissionId)!.delete(option);
    }
  }

  onRadioChange(permissionId: string, option: string): void {
    this.selectedValues.set(permissionId, new Set([option]));
  }

  onDropdownChange(permissionId: string, event: any): void {
    this.selectedValues.set(permissionId, new Set([event.target.value]));
  }

  isValid(): boolean {
    return this.selectedValues.size > 0 &&
           Array.from(this.selectedValues.values()).some(set => set.size > 0);
  }

  getConsentData(): ConsentSubmissionItem[] {
    const result: ConsentSubmissionItem[] = [];

    this.permissions.forEach(permission => {
      const selected = this.selectedValues.get(permission.id) || new Set();

      result.push({
        dataPrincipalIdList: [{ key: 'email', value: this.userEmail }],
        permissionId: permission.id,
        consentReceivedType: 'FORMS',
        optedFor: Array.from(selected),
        consentLanguage: 'english'
      });
    });

    return result;
  }

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}
