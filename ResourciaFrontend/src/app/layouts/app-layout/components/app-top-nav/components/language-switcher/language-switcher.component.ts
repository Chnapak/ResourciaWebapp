import { Component, OnInit } from '@angular/core';
import { Dropdown } from 'flowbite';
import { DropdownComponent, DropdownItem } from '../../../../../../shared/ui/dropdown/dropdown.component';

type LanguageCode = 'en-US' | 'cs-CZ';

interface LanguageOption {
  code: LanguageCode;
  shortLabel: string;
  label: string;
  path: string;
}


@Component({
  selector: 'app-language-switcher',
  imports: [DropdownComponent],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent implements OnInit {
  readonly languages: LanguageOption[] = [
    {
      code: 'en-US',
      shortLabel: 'EN',
      label: 'English',
      path: '/',
    },
    {
      code: 'cs-CZ',
      shortLabel: 'CS',
      label: 'Čeština',
      path: '/cs',
    },
  ];

  currentLanguage: LanguageOption = this.languages[0];

  get currentLang(): string {
    return this.currentLanguage.shortLabel;
  }

  get languageItems(): DropdownItem[] {
    return this.languages.map((lang) => ({
      type: 'action',
      label: lang.label,
      action: () => this.switchLanguage(lang),
    }));
  }

  ngOnInit(): void {
    this.currentLanguage = this.detectCurrentLanguage();
  }

  switchLanguage(language: LanguageOption): void {
    if (this.isCurrentPath(language.path)) {
      this.currentLanguage = language;
      return;
    }

    window.location.href = this.toAbsoluteUrl(language.path);
  }

  private detectCurrentLanguage(): LanguageOption {
    const currentPath = this.normalizePath(window.location.pathname);
    const language = this.languages.find((lang) => this.matchesPath(currentPath, lang.path));
    return (
      language ??
      this.languages[0]
    );
  }

  private isCurrentPath(path: string): boolean {
    return this.matchesPath(
      this.normalizePath(window.location.pathname),
      this.normalizePath(path)
    );
  }

  private matchesPath(currentPath: string, langPath: string): boolean {
    return currentPath === langPath || currentPath.startsWith(langPath + '/');
  }

  private normalizePath(path: string): string {
    if (!path) return '/';
    return path.replace(/\/+$/, '') || '/';
  }

  private toAbsoluteUrl(path: string): string {
    const origin = window.location.origin;
    return origin ? `${origin}${path}` : path;
  }
}
