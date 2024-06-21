import './default/default-tool-button.js';
import './connector/connector-tool-button.js';
import './frame/frame-tool-button.js';
import './note/note-tool-button.js';
import './brush/brush-tool-button.js';
import './eraser/eraser-tool-button.js';
import './shape/shape-tool-button.js';
import './template/template-tool-button.js';
import './note/note-senior-button.js';
import './mindmap/mindmap-tool-button.js';
import './link/link-tool-button.js';

import { html, type TemplateResult } from 'lit';

import type { Menu } from '../../../../_common/components/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { EdgelessTool } from '../../types.js';
import { buildConnectorDenseMenu } from './connector/connector-dense-menu.js';

export interface QuickTool {
  type?: EdgelessTool['type'];
  content: TemplateResult;
  /**
   * if not configured, the tool will not be shown in dense mode
   */
  menu?: Menu;
}
export interface SeniorTool {
  /**
   * Used to show in nav-button's tooltip
   */
  name: string;
  content: TemplateResult;
}

/**
 * Get quick-tool list
 */
export const getQuickTools = ({
  edgeless,
}: {
  edgeless: EdgelessRootBlockComponent;
}) => {
  const quickTools: QuickTool[] = [];

  // 🔧 Hands / Pointer
  quickTools.push({
    type: 'default',
    content: html`<edgeless-default-tool-button
      .edgeless=${edgeless}
    ></edgeless-default-tool-button>`,
  });

  // 🔧 Connector
  quickTools.push({
    type: 'connector',
    content: html`<edgeless-connector-tool-button
      .edgeless=${edgeless}
    ></edgeless-connector-tool-button>`,
    menu: buildConnectorDenseMenu(edgeless),
  });

  return quickTools;
};

export const getSeniorTools = ({
  edgeless,
  toolbarContainer,
}: {
  edgeless: EdgelessRootBlockComponent;
  toolbarContainer: HTMLElement;
}): SeniorTool[] => {
  const { doc } = edgeless;
  const tools: SeniorTool[] = [];

  if (!doc.readonly) {
    tools.push({
      name: 'Note',
      content: html`<edgeless-note-senior-button .edgeless=${edgeless}>
      </edgeless-note-senior-button>`,
    });
  }

  // Brush / Eraser
  tools.push({
    name: 'Pen',
    content: html`<div class="brush-and-eraser">
      <edgeless-brush-tool-button
        .edgeless=${edgeless}
      ></edgeless-brush-tool-button>

      <edgeless-eraser-tool-button
        .edgeless=${edgeless}
      ></edgeless-eraser-tool-button>
    </div> `,
  });

  // Shape
  tools.push({
    name: 'Shape',
    content: html`<edgeless-shape-tool-button
      .edgeless=${edgeless}
      .toolbarContainer=${toolbarContainer}
    ></edgeless-shape-tool-button>`,
  });

  return tools;
};
