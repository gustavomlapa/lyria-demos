/**
 * @fileoverview Control real time music with text prompts
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {css, CSSResultGroup, html, LitElement, svg} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';

import {
  GoogleGenAI,
  type LiveMusicGenerationConfig,
  type LiveMusicServerMessage,
  type LiveMusicSession,
  Type,
  MusicGenerationMode,
} from '@google/genai';
import {decode, decodeAudioData} from './utils';
import lyriaHeader from './lyria_header.gif';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1alpha' });
let model = 'lyria-realtime-exp';

interface Prompt {
  readonly promptId: string;
  readonly color: string;
  text: string;
  weight: number;
}

type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

/** Throttles a callback to be called at most once per `freq` milliseconds. */
function throttle(func: (...args: unknown[]) => void, delay: number) {
  let lastCall = 0;
  return (...args: unknown[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    if (timeSinceLastCall >= delay) {
      func(...args);
      lastCall = now;
    }
  };
}

const COLORS = [
  '#9900ff',
  '#5200ff',
  '#ff25f6',
  '#2af6de',
  '#ffdd28',
  '#3dffab',
  '#d8ff3e',
  '#d9b2ff',
];

function getUnusedRandomColor(usedColors: string[]): string {
  const availableColors = COLORS.filter((c) => !usedColors.includes(c));
  if (availableColors.length === 0) {
    // If no available colors, pick a random one from the original list.
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

// Base class for icon buttons.
class IconButton extends LitElement {
  static override get properties() {
    return {
      disabled: {type: Boolean, reflect: true},
    };
  }
  disabled = false;

  static override styles = css`
    :host {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    :host([disabled]) {
      opacity: 0.5;
    }
    :host([disabled]) .hitbox {
      cursor: not-allowed;
      pointer-events: none;
    }
    :host(:hover:not([disabled])) svg {
      transform: scale(1.2);
    }
    svg {
      width: 100%;
      height: 100%;
      transition: transform 0.5s cubic-bezier(0.25, 1.56, 0.32, 0.99);
    }
    .hitbox {
      pointer-events: all;
      position: absolute;
      width: 65%;
      aspect-ratio: 1;
      top: 9%;
      border-radius: 50%;
      cursor: pointer;
    }
  ` as CSSResultGroup;

  // Method to be implemented by subclasses to provide the specific icon SVG
  protected renderIcon() {
    return svg``; // Default empty icon
  }

  protected renderSVG() {
    return html` <svg
      width="140"
      height="140"
      viewBox="0 -10 140 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="22"
        y="6"
        width="96"
        height="96"
        rx="48"
        fill="black"
        fill-opacity="0.05" />
      <rect
        x="23.5"
        y="7.5"
        width="93"
        height="93"
        rx="46.5"
        stroke="black"
        stroke-opacity="0.3"
        stroke-width="3" />
      <g filter="url(#filter0_ddi_1048_7373)">
        <rect
          x="25"
          y="9"
          width="90"
          height="90"
          rx="45"
          fill="white"
          fill-opacity="0.05"
          shape-rendering="crispEdges" />
      </g>
      ${this.renderIcon()}
      <defs>
        <filter
          id="filter0_ddi_1048_7373"
          x="0"
          y="0"
          width="140"
          height="140"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha" />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1048_7373" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha" />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="12.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_1048_7373"
            result="effect2_dropShadow_1048_7373" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect2_dropShadow_1048_7373"
            result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0" />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect3_innerShadow_1048_7373" />
        </filter>
      </defs>
    </svg>`;
  }

  override render() {
    return html`${this.renderSVG()}<div class="hitbox"></div>`;
  }
}

@customElement('play-pause-button-vision')
export class PlayPauseButton extends IconButton {
  static override get properties() {
    return {
      playbackState: {type: String},
    };
  }
  playbackState: PlaybackState = 'stopped';

  static override styles = [
    IconButton.styles,
    css`
      .loader {
        stroke: #ffffff;
        stroke-width: 3;
        stroke-linecap: round;
        animation: spin linear 1s infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(359deg);
        }
      }
    `,
  ];

  private renderPause() {
    return svg`<path
      d="M75.0037 69V39H83.7537V69H75.0037ZM56.2537 69V39H65.0037V69H56.2537Z"
      fill="#FEFEFE"
    />`;
  }

  private renderPlay() {
    return svg`<path d="M60 71.5V36.5L87.5 54L60 71.5Z" fill="#FEFEFE" />`;
  }

  private renderLoading() {
    return svg`<path shape-rendering="crispEdges" class="loader" d="M70,74.2L70,74.2c-10.7,0-19.5-8.7-19.5-19.5l0,0c0-10.7,8.7-19.5,19.5-19.5
            l0,0c10.7,0,19.5,8.7,19.5,19.5l0,0"/>`;
  }

  override renderIcon() {
    if (this.playbackState === 'playing') {
      return this.renderPause();
    } else if (this.playbackState === 'loading') {
      return this.renderLoading();
    } else {
      return this.renderPlay();
    }
  }
}

@customElement('reset-button-vision')
export class ResetButton extends IconButton {
  private renderResetIcon() {
    return svg`<path fill="#fefefe" d="M71,77.1c-2.9,0-5.7-0.6-8.3-1.7s-4.8-2.6-6.7-4.5c-1.9-1.9-3.4-4.1-4.5-6.7c-1.1-2.6-1.7-5.3-1.7-8.3h4.7
      c0,4.6,1.6,8.5,4.8,11.7s7.1,4.8,11.7,4.8c4.6,0,8.5-1.6,11.7-4.8c3.2-3.2,4.8-7.1,4.8-11.7s-1.6-8.5-4.8-11.7
      c-3.2-3.2-7.1-4.8-11.7-4.8h-0.4l3.7,3.7L71,46.4L61.5,37l9.4-9.4l3.3,3.4l-3.7,3.7H71c2.9,0,5.7,0.6,8.3,1.7
      c2.6,1.1,4.8,2.6,6.7,4.5c1.9,1.9,3.4,4.1,4.5,6.7c1.1,2.6,2.6,4.8,4.5,6.7
      s-4.1,3.4-6.7,4.5C76.7,76.5,73.9,77.1,71,77.1z"/>`;
  }

  override renderIcon() {
    return this.renderResetIcon();
  }
}

/** A button for uploading context file (PDF/Image). */
@customElement('upload-context-button')
export class UploadContextButton extends IconButton {
  @query('#file-input')
  private fileInput!: HTMLInputElement;

  static override get properties() {
    return {
      loading: {type: Boolean},
    };
  }
  loading = false;

  static override styles = [
    IconButton.styles,
    css`
      .loader {
        stroke: #ffffff;
        stroke-width: 3;
        stroke-linecap: round;
        animation: spin linear 1s infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(359deg);
        }
      }
    `,
  ];

  private renderUploadIcon() {
    return svg`<path d="M65 40 h-5 l10 -10 l10 10 h-5 v15 h-10 Z M55 60 h30 v5 H55 Z" fill="#FEFEFE" />`;
  }

  override renderIcon() {
    if (this.loading) {
      return svg`<path shape-rendering="crispEdges" class="loader" d="M70,74.2L70,74.2c-10.7,0-19.5-8.7-19.5-19.5l0,0c0-10.7,8.7-19.5,19.5-19.5
            l0,0c10.7,0,19.5,8.7,19.5,19.5l0,0"/>`;
    }
    return this.renderUploadIcon();
  }

  private handleFileChange(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.dispatchEvent(
        new CustomEvent('file-uploaded', {
          detail: files[0],
          bubbles: true,
          composed: true,
        }),
      );
      (e.target as HTMLInputElement).value = '';
    }
  }

  private handleClick() {
    if (this.disabled) return;
    this.fileInput.click();
  }

  override render() {
    return html`
      <input
        type="file"
        id="file-input"
        @change=${this.handleFileChange}
        style="display: none"
        accept="image/*,application/pdf" />
      ${this.renderSVG()}
      <div class="hitbox" @click=${this.handleClick}></div>
    `;
  }
}

@customElement('toast-message-vision')
class ToastMessage extends LitElement {
  static override styles = css`
    .toast {
      line-height: 1.6;
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #000;
      color: white;
      padding: 15px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      min-width: 200px;
      max-width: 80vw;
      transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
      z-index: 11;
    }
    button {
      border-radius: 100px;
      aspect-ratio: 1;
      border: none;
      color: #000;
      cursor: pointer;
    }
    .toast:not(.showing) {
      transition-duration: 1s;
      transform: translate(-50%, -200%);
    }
  `;

  static override get properties() {
    return {
      message: {type: String},
      showing: {type: Boolean},
    };
  }

  message = '';
  showing = false;

  override render() {
    return html`<div class=${classMap({showing: this.showing, toast: true})}>
      <div class="message">${this.message}</div>
      <button @click=${this.hide}>✕</button>
    </div>`;
  }

  show(message: string) {
    this.showing = true;
    this.message = message;
  }

  hide() {
    this.showing = false;
  }
}

@customElement('vinyl-pad')
class VinylPad extends LitElement {
  static override styles = css`
    :host {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .vinyl-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      cursor: grab;
      transition: transform 0.3s ease-out;
    }
    .vinyl-wrapper:active {
      cursor: grabbing;
    }
    svg.vinyl-svg {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    .label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      height: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }
    .prompt-text {
      font-family: 'Google Sans', sans-serif;
      font-weight: 500;
      color: #fff;
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
      word-break: break-word;
      font-size: clamp(1.4vmin, 1.6vmin, 1.8vmin);
      line-height: 1.1;
      -webkit-font-smoothing: antialiased;
    }
    .weight-display {
      font-size: 1.3vmin;
      color: #eee;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.7);
      margin-top: 0.5vmin;
    }
  `;

  static override get properties() {
    return {
      prompt: {type: Object},
      rotation: {type: Number},
    };
  }

  prompt!: Prompt;
  rotation = 0; // 0-270 degrees

  private isDragging = false;
  private centerX = 0;
  private centerY = 0;
  private startAngle = 0;
  private startRotation = 0;

  private onPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.isDragging = true;
    const rect = this.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    const initialAngle = Math.atan2(
      e.clientY - this.centerY,
      e.clientX - this.centerX,
    );
    this.startAngle = initialAngle;
    this.startRotation = this.rotation;
    document.body.classList.add('dragging');
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const currentAngle = Math.atan2(
      e.clientY - this.centerY,
      e.clientX - this.centerX,
    );
    const angleDiff = currentAngle - this.startAngle;
    let newRotation = this.startRotation + angleDiff * (180 / Math.PI);
    newRotation = Math.max(0, Math.min(270, newRotation)); // Clamp between 0 and 270 degrees
    this.rotation = newRotation;
    this.dispatchPromptChange();
  };

  private onPointerUp = () => {
    this.isDragging = false;
    document.body.classList.remove('dragging');
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  };

  private dispatchPromptChange() {
    const newWeight = (this.rotation / 270) * 2;
    this.dispatchEvent(
      new CustomEvent<Prompt>('prompt-changed', {
        detail: {...this.prompt, weight: newWeight},
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const weight = (this.rotation / 270) * 2;
    const glowOpacity = Math.min(weight / 1.5, 1);

    return html`
      <div
        class="vinyl-wrapper"
        style=${styleMap({transform: `rotate(${this.rotation}deg)`})}
        @pointerdown=${this.onPointerDown}>
        <svg class="vinyl-svg" viewBox="0 0 100 100">
          <defs>
            <filter id="glow-${this.prompt.promptId}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="coloredBlur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
          </defs>
          <circle cx="50" cy="50" r="49" fill="#181818" />
          <g style=${styleMap({opacity: `${glowOpacity}`})} filter="url(#glow-${this.prompt.promptId})">
             <circle cx="50" cy="50" r="49" fill=${this.prompt.color} fill-opacity="0.7" />
          </g>
          ${[...Array(20)].map(
            (_, i) => svg`
              <circle
                cx="50"
                cy="50"
                r=${26 + i * 1.15}
                fill="none"
                stroke="#000"
                stroke-width="0.3"
              />
            `,
          )}
          <circle cx="50" cy="50" r="25" fill=${this.prompt.color} />
        </svg>

        <div
          class="label"
          style=${styleMap({transform: `translate(-50%, -50%) rotate(-${this.rotation}deg)`})}>
          <span class="prompt-text">${this.prompt.text}</span>
          <span class="weight-display">${weight.toFixed(2)}</span>
        </div>
      </div>
    `;
  }
}

/** A panel for managing real-time music generation settings. */
@customElement('settings-controller-vision')
class SettingsController extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 2vmin;
      background-color: #2a2a2a;
      color: #eee;
      box-sizing: border-box;
      border-radius: 5px;
      font-family: 'Google Sans', sans-serif;
      font-size: 1.5vmin;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #666 #1a1a1a;
      transition:
        width 0.3s ease-out,
        max-height 0.3s ease-out;
    }
    :host([showadvanced]) {
      max-height: 40vmin;
    }
    :host::-webkit-scrollbar {
      width: 6px;
    }
    :host::-webkit-scrollbar-track {
      background: #1a1a1a;
      border-radius: 3px;
    }
    :host::-webkit-scrollbar-thumb {
      background-color: #666;
      border-radius: 3px;
    }
    .setting {
      margin-bottom: 0.5vmin;
      display: flex;
      flex-direction: column;
      gap: 0.5vmin;
    }
    label {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      white-space: nowrap;
      user-select: none;
    }
    label span:last-child {
      font-weight: normal;
      color: #ccc;
      min-width: 3em;
      text-align: right;
    }
    input[type='range'] {
      --track-height: 8px;
      --track-bg: #0009;
      --track-border-radius: 4px;
      --thumb-size: 16px;
      --thumb-bg: #23b613ff;
      --thumb-border-radius: 50%;
      --thumb-box-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
      --value-percent: 0%;
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: var(--track-height);
      background: transparent;
      cursor: pointer;
      margin: 0.5vmin 0;
      border: none;
      padding: 0;
      vertical-align: middle;
    }
    input[type='range']::-webkit-slider-runnable-track {
      width: 100%;
      height: var(--track-height);
      cursor: pointer;
      border: none;
      background: linear-gradient(
        to right,
        var(--thumb-bg) var(--value-percent),
        var(--track-bg) var(--value-percent)
      );
      border-radius: var(--track-border-radius);
    }
    input[type='range']::-moz-range-track {
      width: 100%;
      height: var(--track-height);
      cursor: pointer;
      background: var(--track-bg);
      border-radius: var(--track-border-radius);
      border: none;
    }
    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      height: var(--thumb-size);
      width: var(--thumb-size);
      background: var(--thumb-bg);
      border-radius: var(--thumb-border-radius);
      box-shadow: var(--thumb-box-shadow);
      cursor: pointer;
      margin-top: calc((var(--thumb-size) - var(--track-height)) / -2);
    }
    input[type='range']::-moz-range-thumb {
      height: var(--thumb-size);
      width: var(--thumb-size);
      background: var(--thumb-bg);
      border-radius: var(--thumb-border-radius);
      box-shadow: var(--thumb-box-shadow);
      cursor: pointer;
      border: none;
    }
    input[type='number'],
    input[type='text'],
    select {
      background-color: #2a2a2a;
      color: #eee;
      border: 1px solid #666;
      border-radius: 3px;
      padding: 0.4vmin;
      font-size: 1.5vmin;
      font-family: inherit;
      box-sizing: border-box;
    }
    input[type='number'] {
      width: 6em;
    }
    input[type='text'] {
      width: 100%;
    }
    input[type='text']::placeholder {
      color: #888;
    }
    input[type='number']:focus,
    input[type='text']:focus {
      outline: none;
      border-color: #2aa417ff;
      box-shadow: 0 0 0 2px rgba(41, 120, 14, 0.3);
    }
    select {
      width: 100%;
    }
    select:focus {
      outline: none;
      border-color: #13911bff;
    }
    select option {
      background-color: #2a2a2a;
      color: #eee;
    }
    .checkbox-setting {
      flex-direction: row;
      align-items: center;
      gap: 1vmin;
    }
    .core-settings-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4vmin;
      margin-bottom: 1vmin;
      justify-content: space-evenly;
    }
    .core-settings-row .setting {
      min-width: 16vmin;
    }
    .core-settings-row label span:last-child {
      min-width: 2.5em;
    }
    .advanced-toggle {
      cursor: pointer;
      margin: 2vmin 0 1vmin 0;
      color: #aaa;
      text-decoration: underline;
      user-select: none;
      font-size: 1.4vmin;
      width: fit-content;
    }
    .advanced-toggle:hover {
      color: #eee;
    }
    .advanced-settings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10vmin, 1fr));
      gap: 3vmin;
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition:
        max-height 0.3s ease-out,
        opacity 0.3s ease-out;
    }
    .advanced-settings.visible {
      max-width: 120vmin;
      max-height: 40vmin;
      opacity: 1;
    }
    hr.divider {
      display: none;
      border: none;
      border-top: 1px solid #666;
      margin: 2vmin 0;
      width: 100%;
    }
    :host([showadvanced]) hr.divider {
      display: block;
    }
    .auto-row {
      display: flex;
      align-items: center;
      gap: 0.5vmin;
    }
    .setting[auto='true'] input[type='range'] {
      pointer-events: none;
      filter: grayscale(100%);
    }
    .auto-row span {
      margin-left: auto;
    }
    .auto-row label {
      cursor: pointer;
    }
    .auto-row input[type='checkbox'] {
      cursor: pointer;
      margin: 0;
    }
  `;

  private readonly defaultConfig: LiveMusicGenerationConfig = {
    temperature: 1.1,
    topK: 40,
    guidance: 4.0,
    musicGenerationMode: MusicGenerationMode.QUALITY,
  };

  static override get properties() {
    return {
      config: {state: true},
      showAdvanced: {state: true},
      autoDensity: {state: true},
      lastDefinedDensity: {state: true},
      autoBrightness: {state: true},
      lastDefinedBrightness: {state: true},
    };
  }

  private config: LiveMusicGenerationConfig;
  showAdvanced: boolean;
  autoDensity: boolean;
  lastDefinedDensity?: number;
  autoBrightness: boolean;
  lastDefinedBrightness?: number;

  constructor() {
    super();
    this.config = this.defaultConfig;
    this.showAdvanced = false;
    this.autoDensity = true;
    this.autoBrightness = true;
  }

  public resetToDefaults() {
    this.config = this.defaultConfig;
    this.autoDensity = true;
    this.lastDefinedDensity = undefined;
    this.autoBrightness = true;
    this.lastDefinedBrightness = undefined;
    this.dispatchSettingsChange();
  }

  private updateSliderBackground(inputEl: HTMLInputElement) {
    if (inputEl.type !== 'range') {
      return;
    }
    const min = Number(inputEl.min) || 0;
    const max = Number(inputEl.max) || 100;
    const value = Number(inputEl.value);
    const percentage = ((value - min) / (max - min)) * 100;
    inputEl.style.setProperty('--value-percent', `${percentage}%`);
  }

  private handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const key = target.id as
      | keyof LiveMusicGenerationConfig
      | 'auto-density'
      | 'auto-brightness';
    let value: string | number | boolean | undefined | MusicGenerationMode;

    if (target.type === 'number' || target.type === 'range') {
      value = target.value === '' ? undefined : Number(target.value);
      if (target.type === 'range') {
        this.updateSliderBackground(target as HTMLInputElement);
      }
    } else if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    } else if (target.type === 'select-one') {
      const selectElement = target as HTMLSelectElement;
      if (selectElement.options[selectElement.selectedIndex]?.disabled) {
        value = undefined;
      } else {
        if (key === 'musicGenerationMode') {
          value = target.value as MusicGenerationMode;
        } else {
          value = target.value;
        }
      }
    } else {
      value = target.value;
    }

    const newConfig = {
      ...this.config,
      [key]: value,
    };

    if (newConfig.density !== undefined) {
      this.lastDefinedDensity = newConfig.density;
      console.log(this.lastDefinedDensity);
    }

    if (newConfig.brightness !== undefined) {
      this.lastDefinedBrightness = newConfig.brightness;
    }

    if (key === 'auto-density') {
      this.autoDensity = Boolean(value);
      newConfig.density = this.autoDensity
        ? undefined
        : this.lastDefinedDensity;
    } else if (key === 'auto-brightness') {
      this.autoBrightness = Boolean(value);
      newConfig.brightness = this.autoBrightness
        ? undefined
        : this.lastDefinedBrightness;
    }

    this.config = newConfig;
    this.dispatchSettingsChange();
  }

  override updated(changedProperties: Map<string | symbol, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('config')) {
      this.shadowRoot
        ?.querySelectorAll<HTMLInputElement>('input[type="range"]')
        .forEach((slider: HTMLInputElement) => {
          const configValue =
            this.config[slider.id as keyof LiveMusicGenerationConfig];
          if (typeof configValue === 'number') {
            slider.value = String(configValue);
          } else if (slider.id === 'density' || slider.id === 'brightness') {
            // Handle potentially undefined density/brightness with default for background
            slider.value = String(configValue ?? 0.5);
          }
          this.updateSliderBackground(slider);
        });
    }
  }

  private dispatchSettingsChange() {
    this.dispatchEvent(
      new CustomEvent<LiveMusicGenerationConfig>('settings-changed', {
        detail: this.config,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleAdvancedSettings() {
    this.showAdvanced = !this.showAdvanced;
  }

  override render() {
    const cfg = this.config;
    const advancedClasses = classMap({
      'advanced-settings': true,
      'visible': this.showAdvanced,
    });
    const musicGenerationModeMap = new Map<string, MusicGenerationMode>([
      ['Quality', MusicGenerationMode.QUALITY],
      ['Diversity', MusicGenerationMode.DIVERSITY],
      ['Vocalization', MusicGenerationMode.VOCALIZATION],
    ]);
    const scaleMap = new Map<string, string>([
      ['Auto', 'SCALE_UNSPECIFIED'],
      ['C Major / A Minor', 'C_MAJOR_A_MINOR'],
      ['C# Major / A# Minor', 'D_FLAT_MAJOR_B_FLAT_MINOR'],
      ['D Major / B Minor', 'D_MAJOR_B_MINOR'],
      ['D# Major / C Minor', 'E_FLAT_MAJOR_C_MINOR'],
      ['E Major / C# Minor', 'E_MAJOR_D_FLAT_MINOR'],
      ['F Major / D Minor', 'F_MAJOR_D_MINOR'],
      ['F# Major / D# Minor', 'G_FLAT_MAJOR_E_FLAT_MINOR'],
      ['G Major / E Minor', 'G_MAJOR_E_MINOR'],
      ['G# Major / F Minor', 'A_FLAT_MAJOR_F_MINOR'],
      ['A Major / F# Minor', 'A_MAJOR_G_FLAT_MINOR'],
      ['A# Major / G Minor', 'B_FLAT_MAJOR_G_MINOR'],
      ['B Major / G# Minor', 'B_MAJOR_A_FLAT_MINOR'],
    ]);

    return html`
      <div class="core-settings-row">
        <div class="setting">
          <label for="temperature"
            >Temperature<span>${cfg.temperature!.toFixed(1)}</span></label
          >
          <input
            type="range"
            id="temperature"
            min="0"
            max="3"
            step="0.1"
            .value=${cfg.temperature!.toString()}
            @input=${this.handleInputChange} />
        </div>
        <div class="setting">
          <label for="guidance"
            >Guidance<span>${cfg.guidance!.toFixed(1)}</span></label
          >
          <input
            type="range"
            id="guidance"
            min="0"
            max="6"
            step="0.1"
            .value=${cfg.guidance!.toString()}
            @input=${this.handleInputChange} />
        </div>
        <div class="setting">
          <label for="topK">Top K<span>${cfg.topK}</span></label>
          <input
            type="range"
            id="topK"
            min="1"
            max="100"
            step="1"
            .value=${cfg.topK!.toString()}
            @input=${this.handleInputChange} />
        </div>
      </div>
      <hr class="divider" />
      <div class=${advancedClasses}>
        <div class="setting">
          <label for="seed">Seed</label>
          <input
            type="number"
            id="seed"
            .value=${cfg.seed ?? ''}
            @input=${this.handleInputChange}
            placeholder="Auto" />
        </div>
        <div class="setting">
          <label for="bpm">BPM</label>
          <input
            type="number"
            id="bpm"
            min="60"
            max="180"
            .value=${cfg.bpm ?? ''}
            @input=${this.handleInputChange}
            placeholder="Auto" />
        </div>
        <div class="setting" auto=${this.autoDensity}>
          <label for="density">Density</label>
          <input
            type="range"
            id="density"
            min="0"
            max="1"
            step="0.05"
            .value=${String(this.lastDefinedDensity ?? 0.5)}
            @input=${this.handleInputChange} />
          <div class="auto-row">
            <input
              type="checkbox"
              id="auto-density"
              .checked=${this.autoDensity}
              @input=${this.handleInputChange} />
            <label for="auto-density">Auto</label>
            <span>${(this.lastDefinedDensity ?? 0.5).toFixed(2)}</span>
          </div>
        </div>
        <div class="setting" auto=${this.autoBrightness}>
          <label for="brightness">Brightness</label>
          <input
            type="range"
            id="brightness"
            min="0"
            max="1"
            step="0.05"
            .value=${String(this.lastDefinedBrightness ?? 0.5)}
            @input=${this.handleInputChange} />
          <div class="auto-row">
            <input
              type="checkbox"
              id="auto-brightness"
              .checked=${this.autoBrightness}
              @input=${this.handleInputChange} />
            <label for="auto-brightness">Auto</label>
            <span>${(this.lastDefinedBrightness ?? 0.5).toFixed(2)}</span>
          </div>
        </div>
        <div class="setting">
          <label for="scale">Scale</label>
          <select
            id="scale"
            .value=${cfg.scale || 'SCALE_UNSPECIFIED'}
            @change=${this.handleInputChange}>
            <option value="" disabled selected>Select Scale</option>
            ${[...scaleMap.entries()].map(
              ([displayName, enumValue]) =>
                html`<option value=${enumValue}>${displayName}</option>`,
            )}
          </select>
        </div>
        <div class="setting">
          <label for="musicGenerationMode">Music generation mode</label>
          <select
            id="musicGenerationMode"
            .value=${cfg.musicGenerationMode ||
            MusicGenerationMode.QUALITY}
            @change=${this.handleInputChange}>
            ${[...musicGenerationModeMap.entries()].map(
              ([displayName, enumValue]) =>
                html`<option value=${enumValue}>${displayName}</option>`,
            )}
          </select>
        </div>
        <div class="setting">
          <div class="setting checkbox-setting">
            <input
              type="checkbox"
              id="muteBass"
              .checked=${!!cfg.muteBass}
              @change=${this.handleInputChange} />
            <label for="muteBass" style="font-weight: normal;">Mute Bass</label>
          </div>
          <div class="setting checkbox-setting">
            <input
              type="checkbox"
              id="muteDrums"
              .checked=${!!cfg.muteDrums}
              @change=${this.handleInputChange} />
            <label for="muteDrums" style="font-weight: normal;"
              >Mute Drums</label
            >
          </div>
          <div class="setting checkbox-setting">
            <input
              type="checkbox"
              id="onlyBassAndDrums"
              .checked=${!!cfg.onlyBassAndDrums}
              @change=${this.handleInputChange} />
            <label for="onlyBassAndDrums" style="font-weight: normal;"
              >Only Bass & Drums</label
            >
          </div>
        </div>
      </div>
    `;
  }
}

@customElement('rest-generator')
class RestGenerator extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 90vmin;
      color: #eee;
      font-family: 'Google Sans', sans-serif;
      font-size: 1.6vmin;
      padding: 2vmin;
      box-sizing: border-box;
      gap: 2vmin;
    }
    .form-container {
      background-color: #2a2a2a;
      padding: 2vmin;
      border-radius: 5px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.5vmin;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.5vmin;
    }
    label {
      font-weight: bold;
    }
    input,
    textarea {
      background-color: #1a1a1a;
      color: #eee;
      border: 1px solid #666;
      border-radius: 3px;
      padding: 0.8vmin;
      font: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    textarea {
      min-height: 8vmin;
      resize: vertical;
    }
    input:focus,
    textarea:focus {
      outline: none;
      border-color: #12c32fff;
      box-shadow: 0 0 0 2px rgba(20, 119, 17, 0.3);
    }
    .action-button {
      background-color: #107112ff;
      color: white;
      border: none;
      padding: 1.2vmin 2vmin;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1.8vmin;
      transition: background-color 0.2s;
      align-self: flex-end;
    }
    .action-button:hover {
      background-color: #34c739ff;
    }
    .command-container {
      background-color: #1a1a1a;
      padding: 2vmin;
      border-radius: 5px;
      width: 100%;
      border: 1px solid #444;
      display: flex;
      flex-direction: column;
      gap: 1vmin;
    }
    .command-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .info {
      font-size: 1.4vmin;
      color: #aaa;
    }
    .copy-button {
      background: #333;
      color: #eee;
      border: 1px solid #555;
      padding: 0.5vmin 1vmin;
      border-radius: 3px;
      cursor: pointer;
    }
    .copy-button:hover {
      background: #444;
    }
    pre {
      background-color: #000;
      color: #d0d0d0;
      padding: 1vmin;
      border-radius: 3px;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 1.4vmin;
    }
  `;

  static override get properties() {
    return {
      projectId: {state: true},
      prompt: {state: true},
      negativePrompt: {state: true},
      seed: {state: true},
      curlCommand: {state: true},
      toastMessage: {attribute: false},
    };
  }

  private projectId: string;
  private prompt: string;
  private negativePrompt: string;
  private seed: number;
  private curlCommand: string;
  public toastMessage!: ToastMessage;

  constructor() {
    super();
    this.projectId = 'expanded-flame-422613-e4';
    this.prompt =
      'An uplifting and hopeful orchestral piece with a soaring string melody and triumphant brass.';
    this.negativePrompt = 'dissonant, minor key';
    this.seed = 12345;
    this.curlCommand = '';
  }

  private handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const key = target.id;
    const value =
      target.type === 'number' ? Number(target.value) : target.value;

    switch (key) {
      case 'projectId':
        this.projectId = value as string;
        break;
      case 'prompt':
        this.prompt = value as string;
        break;
      case 'negativePrompt':
        this.negativePrompt = value as string;
        break;
      case 'seed':
        this.seed = value as number;
        break;
    }
  }

  private generateCommand() {
    if (!this.prompt) {
      this.toastMessage.show('Prompt cannot be empty.');
      return;
    }

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/us-central1/publishers/google/models/lyria-002:predict`;

    const payload = {
      instances: [
        {
          prompt: this.prompt,
          negative_prompt: this.negativePrompt,
          seed: this.seed,
        },
      ],
      parameters: {},
    };

    const dataString = JSON.stringify(payload, null, 2);

    this.curlCommand = `curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "${endpoint}" \
  -d '${JSON.stringify(payload)}'`;

    this.toastMessage.show('API command generated!');
  }

  private async copyCommand() {
    if (!this.curlCommand) return;
    try {
      await navigator.clipboard.writeText(this.curlCommand);
      this.toastMessage.show('Command copied to clipboard!');
    } catch (err) {
      this.toastMessage.show('Failed to copy command.');
    }
  }

  override render() {
    return html`
      <div class="form-container">
        <div class="form-row">
          <label for="projectId">Project ID</label>
          <input
            type="text"
            id="projectId"
            .value=${this.projectId}
            @input=${this.handleInputChange} />
        </div>
        <div class="form-row">
          <label for="prompt">Prompt</label>
          <textarea id="prompt" .value=${this.prompt} @input=${this.handleInputChange}></textarea>
        </div>
        <div class="form-row">
          <label for="negativePrompt">Negative Prompt</label>
          <input
            type="text"
            id="negativePrompt"
            .value=${this.negativePrompt}
            @input=${this.handleInputChange} />
        </div>
        <div class="form-row">
          <label for="seed">Seed</label>
          <input
            type="number"
            id="seed"
            .value=${this.seed.toString()}
            @input=${this.handleInputChange} />
        </div>
        <button class="action-button" @click=${this.generateCommand}>
          Show API Command
        </button>
      </div>

      ${this.curlCommand
        ? html`
            <div class="command-container">
              <div class="command-header">
                <span class="info">Run this command in a terminal with gcloud installed and authenticated.</span>
                <button class="copy-button" @click=${this.copyCommand}>Copy</button>
              </div>
              <pre><code>${this.curlCommand}</code></pre>
            </div>
          `
        : ''}
    `;
  }
}

/** Component for the PromptDJ UI. */
@customElement('prompt-dj-vision')
export class PromptDj extends LitElement {
  static override styles = css`
    :host {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      box-sizing: border-box;
      padding: 2vmin;
      position: relative;
      font-size: 1.8vmin;
      overflow: hidden;
      color: #eee;
      font-family: 'Orbitron', sans-serif;
    }
    #background {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      z-index: -1;
      background: #111;
    }
    .initial-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: var(--bg-image);
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .mode-switcher {
      display: flex;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.5vmin;
      margin-bottom: 2vmin;
      z-index: 10;
    }
    .mode-switcher button {
      background-color: transparent;
      border: none;
      color: #aaa;
      padding: 1vmin 2vmin;
      font-size: 1.6vmin;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      font-weight: 500;
    }
    .mode-switcher button.active {
      background-color: #239b10ff;
      color: white;
    }
    .content-area {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .initial-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 2vmin;
      position: relative;
      z-index: 1;
    }
    .initial-state h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 7vmin;
      font-weight: 700;
      margin: 0;
      color: #fff;
      text-shadow:
        0 0 5px #fff,
        0 0 10px #fff,
        0 0 15px #00ff1a,
        0 0 20px #00ff1a;
    }
    .initial-state p {
      font-family: 'Orbitron', sans-serif;
      font-size: 2vmin;
      margin: 0;
      max-width: 50ch;
      color: #eee;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    }
    .initial-state upload-context-button {
      width: 20vmin;
      margin-top: 2vmin;
    }
    .main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      gap: 2vmin;
    }
    #pads-container {
      width: 100%;
      max-width: 130vmin;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3vmin;
      justify-content: center;
      align-items: center;
    }
    vinyl-pad {
      width: 25vmin;
      height: 25vmin;
    }
    .bottom-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2vmin;
    }
    .playback-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1vmin;
    }
    play-pause-button-vision,
    reset-button-vision,
    upload-context-button {
      width: 12vmin;
      flex-shrink: 0;
    }
    #settings-container {
      width: 100%;
      max-width: 80vmin;
    }
  `;

  static override get properties() {
    return {
      prompts: {state: true},
      playbackState: {state: true},
      isProcessingContext: {state: true},
      filteredPrompts: {attribute: false},
      mode: {state: true},
    };
  }

  private prompts: Prompt[] = [];
  private session!: LiveMusicSession;
  private readonly sampleRate = 48000;
  private audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: this.sampleRate});
  private outputNode: GainNode = this.audioContext.createGain();
  private nextStartTime = 0;
  private readonly bufferTime = 2;
  private playbackState: PlaybackState = 'stopped';
  private isProcessingContext: boolean = false;
  private filteredPrompts: Set<string> = new Set<string>();
  private connectionError = true;
  private mode: 'dj' | 'rest' = 'dj';

  @query('play-pause-button-vision') private playPauseButton!: PlayPauseButton;
  @query('toast-message-vision') private toastMessage!: ToastMessage;
  @query('settings-controller-vision') private settingsController!: SettingsController;

  constructor() {
    super();
    this.outputNode.connect(this.audioContext.destination);
  }

  override async firstUpdated() {
    await this.connectToSession();
  }

  private async connectToSession() {
    this.session = await ai.live.music.connect({
      model: model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          console.log('Received message from the server: %s\n');
          console.log(e);
          if (e.setupComplete) {
            this.connectionError = false;
          }
          if (e.filteredPrompt) {
            this.filteredPrompts = new Set([
              ...this.filteredPrompts,
              e.filteredPrompt.text,
            ]);
            this.toastMessage.show(e.filteredPrompt.filteredReason);
          }
          if (e.serverContent?.audioChunks !== undefined) {
            if (
              this.playbackState === 'paused' ||
              this.playbackState === 'stopped'
            )
              return;
            const audioBuffer = await decodeAudioData(
              decode(e.serverContent?.audioChunks[0].data),
              this.audioContext,
              48000,
              2,
            );
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            if (this.nextStartTime === 0) {
              this.nextStartTime =
                this.audioContext.currentTime + this.bufferTime;
              setTimeout(() => {
                this.playbackState = 'playing';
              }, this.bufferTime * 1000);
            }

            if (this.nextStartTime < this.audioContext.currentTime) {
              console.log('under run');
              this.playbackState = 'loading';
              this.nextStartTime = 0;
              return;
            }
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
          }
        },
        onerror: (e: ErrorEvent) => {
          console.log('Error occurred: %s\n', JSON.stringify(e));
          this.connectionError = true;
          this.stopAudio();
          this.toastMessage.show('Connection error, please restart audio.');
        },
        onclose: (e: CloseEvent) => {
          console.log('Connection closed.');
          this.connectionError = true;
          this.stopAudio();
          this.toastMessage.show('Connection error, please restart audio.');
        },
      },
    });
  }

  private setSessionPrompts = throttle(async () => {
    const promptsToSend = this.prompts.filter((p) => {
      return !this.filteredPrompts.has(p.text) && p.weight !== 0;
    });
    try {
      await this.session.setWeightedPrompts({
        weightedPrompts: promptsToSend,
      });
    } catch (e: any) {
      this.toastMessage.show(e.message);
      this.pauseAudio();
    }
  }, 200);

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    const changedPrompt = e.detail;
    const promptIndex = this.prompts.findIndex(
      (p) => p.promptId === changedPrompt.promptId,
    );
    if (promptIndex > -1) {
      this.prompts[promptIndex] = changedPrompt;
      this.prompts = [...this.prompts]; // Trigger update
      this.setSessionPrompts();
    }
  }

  private makeBackground() {
    const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

    const MAX_WEIGHT = 0.5;
    const MAX_ALPHA = 0.6;

    const bg: string[] = [];

    this.prompts.forEach((p, i) => {
      const alphaPct = clamp01(p.weight / MAX_WEIGHT) * MAX_ALPHA;
      const alpha = Math.round(alphaPct * 0xff)
        .toString(16)
        .padStart(2, '0');

      const stop = p.weight / 2;
      const x = (i % 4) / 3;
      const y = Math.floor(i / 4) / 3;
      const s = `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${p.color}${alpha} 0px, ${p.color}00 ${stop * 100}%)`;

      bg.push(s);
    });

    return bg.join(', ');
  }

  private async handlePlayPause() {
    if (this.playbackState === 'playing') {
      this.pauseAudio();
    } else if (
      this.playbackState === 'paused' ||
      this.playbackState === 'stopped'
    ) {
      if (this.connectionError) {
        await this.connectToSession();
        this.setSessionPrompts();
      }
      this.loadAudio();
    } else if (this.playbackState === 'loading') {
      this.stopAudio();
    }
  }

  private pauseAudio() {
    this.session?.pause();
    this.playbackState = 'paused';
    if (this.audioContext.state === 'running') {
      this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
      this.outputNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 0.1,
      );
    }
    this.nextStartTime = 0;
    this.outputNode = this.audioContext.createGain();
    this.outputNode.connect(this.audioContext.destination);
  }

  private loadAudio() {
    this.audioContext.resume();
    this.session.play();
    this.playbackState = 'loading';
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(
      1,
      this.audioContext.currentTime + 0.1,
    );
  }

  private stopAudio() {
    this.session?.stop();
    this.playbackState = 'stopped';
    if (this.audioContext.state === 'running') {
      this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.outputNode.gain.linearRampToValueAtTime(
        1,
        this.audioContext.currentTime + 0.1,
      );
    }
    this.nextStartTime = 0;
  }

  private fileToGenerativePart(
    file: File,
  ): Promise<{inlineData: {data: string; mimeType: string}}> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private async handleFileUploaded(e: CustomEvent<File>) {
    const file = e.detail;
    if (!file) return;

    this.isProcessingContext = true;
    this.toastMessage.show('Analyzing your file...');

    try {
      const filePart = await this.fileToGenerativePart(file);
      let userPromptText = '';

      if (file.type.startsWith('image/')) {
        userPromptText = `This is cover art. Generate a list of exactly 6 short, creative, one-or-two-word text prompts for a music soundtrack that fits the mood. The prompts should be suitable for a generative music model, like in the original demo.`;
      } else if (file.type === 'application/pdf') {
        userPromptText = `This is a script. Analyze it and generate a list of exactly 6 short, creative, one-or-two-word text prompts for a music soundtrack. The prompts should capture key moods from the script and be suitable for a generative music model, like in the original demo.`;
      } else {
        this.toastMessage.show(
          'Unsupported file type. Please upload an image or a PDF.',
        );
        this.isProcessingContext = false;
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {parts: [filePart, {text: userPromptText}]},
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompts: {
                type: Type.ARRAY,
                description:
                  'A list of exactly 6 short, descriptive prompts for music generation.',
                items: {
                  type: Type.STRING,
                },
                minItems: 6,
                maxItems: 6,
              },
            },
            required: ['prompts'],
          },
        },
      });

      const jsonResponse = JSON.parse(response.text);
      const newPromptTexts: string[] | undefined = jsonResponse.prompts;

      if (!newPromptTexts || newPromptTexts.length !== 6) {
        this.toastMessage.show(
          'Could not generate 6 prompts from the file. Please try a different one.',
        );
      } else {
        const usedColors: string[] = [];
        this.prompts = newPromptTexts.map((text, i) => {
          const color = getUnusedRandomColor(usedColors);
          usedColors.push(color);
          return {
            promptId: `prompt-${i}`,
            text: text,
            weight: 0,
            color: color,
          };
        });

        this.setSessionPrompts();
        this.toastMessage.show(`Generated 6 new prompt ideas!`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      this.toastMessage.show(
        'An error occurred while processing the file. Please check the console.',
      );
    } finally {
      this.isProcessingContext = false;
    }
  }

  private updateSettings = throttle(
    async (e: CustomEvent<LiveMusicGenerationConfig>) => {
      await this.session?.setMusicGenerationConfig({
        musicGenerationConfig: e.detail,
      });
    },
    200,
  );

  private async handleReset() {
    if (this.connectionError) {
      await this.connectToSession();
    }
    this.pauseAudio();
    this.session.resetContext();
    this.settingsController.resetToDefaults();
    this.session?.setMusicGenerationConfig({
      musicGenerationConfig: {},
    });
    this.setSessionPrompts();
    setTimeout(this.loadAudio.bind(this), 100);
  }

  private handleModeChange(newMode: 'dj' | 'rest') {
    if (this.mode === 'dj' && newMode === 'rest') {
      if (this.playbackState === 'playing' || this.playbackState === 'loading') {
        this.pauseAudio();
      }
    }
    this.mode = newMode;
  }

  override render() {
    const isInitialDjMode = this.mode === 'dj' && this.prompts.length === 0;

    const djContent =
      this.mode === 'dj'
        ? isInitialDjMode
          ? this.renderInitialState()
          : this.renderActiveState()
        : '';
    const restContent =
      this.mode === 'rest'
        ? html`<rest-generator
            .toastMessage=${this.toastMessage}></rest-generator>`
        : '';

    return html`
      <style>
        :host {
          --bg-image: url(${lyriaHeader});
        }
      </style>
      ${this.mode === 'rest' || isInitialDjMode ? html`<div class="initial-background"></div>` : ''}
      ${
        this.mode === 'dj' && !isInitialDjMode
          ? html`<div
              id="background"
              style=${styleMap({backgroundImage: this.makeBackground()})}>
            </div>`
          : ''
      }
      <div class="mode-switcher">
        <button
          class=${classMap({active: this.mode === 'dj'})}
          @click=${() => this.handleModeChange('dj')}>
          DJ Mode
        </button>
        <button
          class=${classMap({active: this.mode === 'rest'})}
          @click=${() => this.handleModeChange('rest')}>
          REST API
        </button>
      </div>
      <div class="content-area">${djContent} ${restContent}</div>
      <toast-message-vision></toast-message-vision>
    `;
  }

  private renderInitialState() {
    return html`
      <div class="initial-state">
        <h1>VisionDJ</h1>
        <p>
          Upload a movie script (PDF) or cover art (image) to generate a custom
          set of musical pads for your soundtrack.
        </p>
        <upload-context-button
          .loading=${this.isProcessingContext}
          .disabled=${this.isProcessingContext}
          @file-uploaded=${this.handleFileUploaded}
          title="Upload PDF script or cover image"></upload-context-button>
      </div>
    `;
  }

  private renderActiveState() {
    return html`
      <div class="main-content">
        <div id="pads-container" @prompt-changed=${this.handlePromptChanged}>
          ${this.renderPads()}
        </div>
        <div class="bottom-controls">
          <div class="playback-controls">
            <upload-context-button
              .loading=${this.isProcessingContext}
              .disabled=${this.isProcessingContext}
              @file-uploaded=${this.handleFileUploaded}
              title="Upload new file"></upload-context-button>
            <play-pause-button-vision
              @click=${this.handlePlayPause}
              .playbackState=${this.playbackState}></play-pause-button-vision>
            <reset-button-vision @click=${this.handleReset}></reset-button-vision>
          </div>
          <div id="settings-container">
            <settings-controller-vision
              @settings-changed=${this.updateSettings}></settings-controller-vision>
          </div>
        </div>
      </div>
    `;
  }

  private renderPads() {
    return this.prompts.map((prompt) => {
      const rotation = (prompt.weight / 2) * 270;

      return html`
        <vinyl-pad .prompt=${prompt} .rotation=${rotation}></vinyl-pad>
      `;
    });
  }
}

export function main(container: HTMLElement) {
  const pdj = new PromptDj();
  container.appendChild(pdj);
}

// main(document.body);

declare global {
  interface HTMLElementTagNameMap {
    'prompt-dj-vision': PromptDj;
    'settings-controller-vision': SettingsController;
    'upload-context-button': UploadContextButton;
    'play-pause-button-vision': PlayPauseButton;
    'reset-button-vision': ResetButton;
    'vinyl-pad': VinylPad;
    'toast-message-vision': ToastMessage;
    'rest-generator': RestGenerator;
  }
}
