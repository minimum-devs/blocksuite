import {
  DocumentationTaskIcon,
  MajorTaskIcon,
  MinorTaskIcon,
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
    name: 'Major Task',
    description: 'Major Task',
    icon: MajorTaskIcon,
    tooltip: 'Drag / Click to insert major task block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Minor Task',
    description: 'Minor Task',
    icon: MinorTaskIcon,
    tooltip: 'Drag / Click to insert minor task block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Documentation',
    description: 'Documentation',
    icon: DocumentationTaskIcon,
    tooltip: 'Drag / Click to insert documentation block',
  },
];

export const BLOCKHUB_LIST_ITEMS: BlockHubItem[] = [];

export const BLOCKHUB_FILE_ITEMS: BlockHubItem[] = [];
