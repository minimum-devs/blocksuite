import type { EditorHost } from '@blocksuite/block-std';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createTextRenderer } from '../../messages/text.js';
import { renderImages } from '../components/images.js';
import './action-wrapper.js';
@customElement('chat-text')
export class ChatText extends WithDisposable(ShadowlessElement) {
  protected override render() {
    const { attachments, text, host } = this;
    return html`${attachments && attachments.length > 0
      ? renderImages(attachments)
      : nothing}${createTextRenderer(host, { customHeading: true })(
      text,
      this.state
    )} `;
  }

  @property({ attribute: false })
  accessor attachments: string[] | undefined = undefined;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor state: 'finished' | 'generating' = 'finished';

  @property({ attribute: false })
  accessor text!: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-text': ChatText;
  }
}
