export interface WebsiteAdapter {
  id: string;
  name: string;
  matchDomain: (hostname: string) => boolean;
  getInputElement: () => HTMLElement | null;
  getSubmitButton: () => HTMLElement | null;
  getInputValue: () => string;
  setInputValue: (value: string) => void;
  isAvailable: () => boolean;
  getDegradedReason?: () => string | null;
}

export type InterceptCallback = (
  rawText: string,
  proceedWithOriginal: () => void,
  proceedWithSanitized: (sanitizedText: string) => void,
  cancel: () => void
) => void;
