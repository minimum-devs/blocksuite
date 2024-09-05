import type { TemplateResult } from 'lit';

import {
  AutomationStepIcon,
  DecisionStepIcon,
  DocumentationIcon,
  EndStepIcon,
  MajorStepIcon,
  MinorStepIcon,
} from '../icons/index.js';

/**
 * Text primitive entries used in slash menu and format bar,
 * which are also used for registering hotkeys for converting block flavours.
 */
export interface TextConversionConfig {
  flavour: BlockSuite.Flavour;
  type?: string;
  name: string;
  description?: string;
  hotkey: string[] | null;
  icon: TemplateResult<1>;
}

export const textConversionConfigs: TextConversionConfig[] = [
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Major Step',
    description: 'Add a major step',
    icon: MajorStepIcon,
    hotkey: null,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Minor Step',
    description: 'Add a minor step',
    icon: MinorStepIcon,
    hotkey: null,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Automation Step',
    description: 'Add an automation step',
    icon: AutomationStepIcon,
    hotkey: null,
  },
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Documentation',
    description: 'Add a documentation note',
    icon: DocumentationIcon,
    hotkey: null,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Decision Step',
    description: 'Add a decision step',
    icon: DecisionStepIcon,
    hotkey: null,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'End Step',
    description: 'Add an end step',
    icon: EndStepIcon,
    hotkey: null,
  },
];
