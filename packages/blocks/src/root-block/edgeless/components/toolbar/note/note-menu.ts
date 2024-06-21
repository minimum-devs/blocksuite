import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { NoteChildrenFlavour } from '../../../../../_common/utils/index.js';
import type { NoteTool } from '../../../controllers/tools/note-tool.js';
import type { EdgelessTool } from '../../../types.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { NOTE_MENU_ITEMS } from './note-menu-config.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
    .button-group-container svg {
      width: 20px;
      height: 20px;
    }
    .divider {
      width: 1px;
      height: 24px;
      background: var(--affine-border-color);
      transform: scaleX(0.5);
      margin: 0 14px;
    }
  `;

  override type: EdgelessTool['type'] = 'affine:note';

  @property({ attribute: false })
  accessor childFlavour!: NoteChildrenFlavour;

  @property({ attribute: false })
  accessor childType!: string | null;

  @property({ attribute: false })
  accessor tip!: string;

  @property({ attribute: false })
  accessor onChange!: (
    props: Partial<{
      childFlavour: NoteTool['childFlavour'];
      childType: string | null;
      tip: string;
    }>
  ) => void;

  override firstUpdated() {
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(tool => {
        if (tool.type !== 'affine:note') return;
        this.childFlavour = tool.childFlavour;
        this.childType = tool.childType;
        this.tip = tool.tip;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override render() {
    const { childType } = this;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <!-- add to edgeless -->
          <div class="button-group-container">
            ${repeat(
              NOTE_MENU_ITEMS,
              item => item.childFlavour,
              item => html`
                <edgeless-tool-icon-button
                  .active=${childType === item.childType}
                  .activeMode=${'background'}
                  .tooltip=${item.tooltip}
                  @click=${() =>
                    this.onChange({
                      childFlavour: item.childFlavour,
                      childType: item.childType,
                      tip: item.tooltip,
                    })}
                >
                  ${item.icon}
                </edgeless-tool-icon-button>
              `
            )}
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
