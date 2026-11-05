/**
 * Speech Recognition & Financial PII Sanitization Engine
 */

export interface SpeechResultCallback {
  (text: string, isFinal: boolean): void;
}

// Sensitive Financial PII Patterns (PCI-DSS & GLBA regulations)
const CC_PATTERN = /\b(?:\d[ -]*?){13,16}\b/g;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const ROUTING_PATTERN = /\b\d{9}\b/g;

export function redactFinancialPII(text: string): { sanitized: string; hasPII: boolean } {
  let hasPII = false;
  let sanitized = text;

  if (CC_PATTERN.test(sanitized)) {
    hasPII = true;
    sanitized = sanitized.replace(CC_PATTERN, (match) => {
      const clean = match.replace(/[\s-]/g, '');
      const last4 = clean.slice(-4);
      return `•••• •••• •••• ${last4}`;
    });
  }

  if (SSN_PATTERN.test(sanitized)) {
    hasPII = true;
    sanitized = sanitized.replace(SSN_PATTERN, '•••-••-••••');
  }

  return { sanitized, hasPII };
}

export class LiveSpeechEngine {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: SpeechResultCallback | null = null;
  private simulationTimer: number | null = null;

  constructor() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (this.onResultCallback) {
            if (finalTranscript.trim()) {
              this.onResultCallback(finalTranscript.trim(), true);
            } else if (interimTranscript.trim()) {
              this.onResultCallback(interimTranscript.trim(), false);
            }
          }
        };

        this.recognition.onerror = (e: any) => {
          // If microphone is silent or permission denied, fallback cleanly to simulated dialogue
          console.log('Web Speech API note:', e.error);
        };
      } catch (err) {
        console.warn('SpeechRecognition initialization error', err);
      }
    }
  }

  public start(onResult: SpeechResultCallback): void {
    this.onResultCallback = onResult;
    this.isListening = true;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {
        // May already be started
      }
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // No-op
      }
    }
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public getSupported(): boolean {
    return !!this.recognition;
  }
}
