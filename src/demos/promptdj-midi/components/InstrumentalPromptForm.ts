import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('instrumental-prompt-form')
export class InstrumentalPromptForm extends LitElement {
  static override styles = css`
    .form-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background-color: #f9fafb;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }
    textarea {
      width: 100%;
      min-width: 400px;
      padding: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
    }
    button {
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      border: none;
      background-color: #2563eb;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #1d4ed8;
    }
    button:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  `;

  static override properties = {
    isLoading: {type: Boolean},
    prompt: {state: true},
  };

  isLoading = false;
  prompt = '';

  private handleSubmit() {
    this.dispatchEvent(new CustomEvent('generate', { detail: this.prompt }));
  }

  override render() {
    return html`
      <div class="form-container">
        <textarea
          placeholder="e.g., A futuristic, cyberpunk-inspired track with a driving beat and atmospheric synths."
          .value=${this.prompt}
          @input=${(e: Event) => this.prompt = (e.target as HTMLTextAreaElement).value}
          ?disabled=${this.isLoading}
        ></textarea>
        <button @click=${this.handleSubmit} ?disabled=${this.isLoading || !this.prompt}>
          ${this.isLoading ? 'Loading...' : 'Get Styles'}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'instrumental-prompt-form': InstrumentalPromptForm;
  }
}
