import {
  AutomationStepIcon,
  DecisionStepIcon,
  DocumentationIcon,
  EndStepIcon,
  MajorStepIcon,
  MinorStepIcon,
} from '../../../_common/icons/index.js';

export const TRANSITION_DELAY = 200;
export const BOTTOM_OFFSET = 70;
export const RIGHT_OFFSET = 24;
export const TOP_DISTANCE = 24;

export type BlockHubItem = {
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  tooltip: string;
};

export const BLOCKHUB_TEXT_ITEMS: BlockHubItem[] = [
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Major Step',
    description: 'Major Step',
    icon: MajorStepIcon,
    tooltip: 'Drag / Click to insert Major Step block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Minor Step',
    description: 'Minor Step',
    icon: MinorStepIcon,
    tooltip: 'Drag / Click to insert Minor Step block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Automation Step',
    description: 'Automation Step',
    icon: AutomationStepIcon,
    tooltip: 'Drag / Click to insert Automation Step block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Documentation',
    description: 'Documentation',
    icon: DocumentationIcon,
    tooltip: 'Drag / Click to insert documentation block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Decision Step',
    description: 'Decision Step',
    icon: DecisionStepIcon,
    tooltip: 'Drag / Click to insert Decision Step block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'End Step',
    description: 'End Step',
    icon: EndStepIcon,
    tooltip: 'Drag / Click to insert End Step block',
  },
];

export const BLOCKHUB_LIST_ITEMS: BlockHubItem[] = [];

export const BLOCKHUB_FILE_ITEMS: BlockHubItem[] = [];
