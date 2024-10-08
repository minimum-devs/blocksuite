import './database-convert-view.js';

import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import { toast } from '../../components/toast.js';
import { CopyIcon } from '../../icons/index.js';

export interface QuickActionConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  showWhen: (host: EditorHost) => boolean;
  enabledWhen: (host: EditorHost) => boolean;
  action: (host: EditorHost) => void;
}

export const quickActionConfig: QuickActionConfig[] = [
  {
    id: 'copy',
    name: 'Copy',
    disabledToolTip: undefined,
    icon: CopyIcon,
    hotkey: undefined,
    showWhen: () => true,
    enabledWhen: () => true,
    action: host => {
      host.std.command
        .chain()
        .getSelectedModels()
        .with({
          onCopy: () => {
            toast(host, 'Copied to clipboard');
          },
        })
        .copySelectedModels()
        .run();
    },
  },
];
