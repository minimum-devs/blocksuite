import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { Slice, Text } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toggleEmbedCardCreateModal } from '../../../_common/components/embed-card/modal/embed-card-create-modal.js';
import { toast } from '../../../_common/components/toast.js';
import {
  basicTextConversionConfigs,
  textConversionConfigs,
} from '../../../_common/configs/text-conversion.js';
import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  CopyIcon,
  DatabaseKanbanViewIcon20,
  DatabaseTableViewIcon20,
  DeleteIcon,
  FileIcon,
  FrameIcon,
  ImageIcon20,
  LinkIcon,
  NowIcon,
  PasteIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '../../../_common/icons/index.js';
import {
  getBlockComponentByPath,
  getImageFilesFromLocal,
  matchFlavours,
  openFileOrFiles,
} from '../../../_common/utils/index.js';
import { addSiblingAttachmentBlocks } from '../../../attachment-block/utils.js';
import type { DataViewBlockComponent } from '../../../data-view-block/index.js';
import { GroupingIcon } from '../../../database-block/data-view/common/icons/index.js';
import { viewPresets } from '../../../database-block/data-view/index.js';
import { FigmaIcon } from '../../../embed-figma-block/styles.js';
import { GithubIcon } from '../../../embed-github-block/styles.js';
import { LoomIcon } from '../../../embed-loom-block/styles.js';
import { YoutubeIcon } from '../../../embed-youtube-block/styles.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import { addSiblingImageBlock } from '../../../image-block/utils.js';
import { NoteBlockModel } from '../../../note-block/note-model.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import { CanvasElementType } from '../../../surface-block/index.js';
import { getSurfaceBlock } from '../../../surface-ref-block/utils.js';
import type { RootBlockComponent } from '../../types.js';
import { type SlashMenuTooltip, slashMenuToolTips } from './tooltips/index.js';
import { createConversionItem } from './utils.js';
import {
  createDatabaseBlockInNextLine,
  formatDate,
  formatTime,
  insertContent,
  insideDatabase,
  insideEdgelessText,
  tryRemoveEmptyLine,
} from './utils.js';

export type SlashMenuConfig = {
  triggerKeys: string[];
  ignoreBlockTypes: BlockSuite.Flavour[];
  items: SlashMenuItem[];
  maxHeight: number;
  tooltipTimeout: number;
};

export type SlashMenuStaticConfig = Omit<SlashMenuConfig, 'items'> & {
  items: SlashMenuStaticItem[];
};

export type SlashMenuItem = SlashMenuStaticItem | SlashMenuItemGenerator;

export type SlashMenuStaticItem =
  | SlashMenuGroupDivider
  | SlashMenuActionItem
  | SlashSubMenu;

export type SlashMenuGroupDivider = {
  groupName: string;
  showWhen?: (ctx: SlashMenuContext) => boolean;
};

export type SlashMenuActionItem = {
  name: string;
  description?: string;
  icon?: TemplateResult;
  tooltip?: SlashMenuTooltip;
  alias?: string[];
  showWhen?: (ctx: SlashMenuContext) => boolean;
  action: (ctx: SlashMenuContext) => void | Promise<void>;

  customTemplate?: TemplateResult<1>;
};

export type SlashSubMenu = {
  name: string;
  description?: string;
  icon?: TemplateResult;
  alias?: string[];
  showWhen?: (ctx: SlashMenuContext) => boolean;
  subMenu: SlashMenuStaticItem[];
};

export type SlashMenuItemGenerator = (
  ctx: SlashMenuContext
) => (SlashMenuGroupDivider | SlashMenuActionItem | SlashSubMenu)[];

export type SlashMenuContext = {
  rootElement: RootBlockComponent;
  model: BlockModel;
};

export const defaultSlashMenuConfig: SlashMenuConfig = {
  triggerKeys: ['/', '、'],
  ignoreBlockTypes: ['affine:code'],
  maxHeight: 344,
  tooltipTimeout: 800,
  items: [
    { groupName: 'Basic' },
    ...basicTextConversionConfigs
      .filter(
        i =>
          i.type &&
          [
            'h1',
            'h2',
            'h3',
            'text',
            'bulleted',
            'numbered',
            'quote',
            'divider',
          ].includes(i.type)
      )
      .map(createConversionItem),
    { groupName: 'Task Types' },
    ...textConversionConfigs
      .filter(i => i.type && ['h1', 'h3', 'text'].includes(i.type))
      .map(createConversionItem),
    { groupName: 'Content & Media' },
    {
      name: 'Image',
      description: 'Insert an image.',
      icon: ImageIcon20,
      tooltip: slashMenuToolTips['Image'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:image') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parent = rootElement.doc.getParent(model);
        if (!parent) {
          return;
        }

        const imageFiles = await getImageFilesFromLocal();
        if (!imageFiles.length) return;

        const imageService = rootElement.host.spec.getService('affine:image');
        const maxFileSize = imageService.maxFileSize;

        addSiblingImageBlock(rootElement.host, imageFiles, maxFileSize, model);
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Link',
      description: 'Add a bookmark for reference.',
      icon: LinkIcon,
      tooltip: slashMenuToolTips['Link'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:bookmark') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Links',
          'The added link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Attachment',
      description: 'Attach a file to document.',
      icon: FileIcon,
      tooltip: slashMenuToolTips['Attachment'],
      alias: ['file'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:attachment') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const file = await openFileOrFiles();
        if (!file) return;

        const attachmentService =
          rootElement.host.spec.getService('affine:attachment');
        assertExists(attachmentService);
        const maxFileSize = attachmentService.maxFileSize;

        await addSiblingAttachmentBlocks(
          rootElement.host,
          [file],
          maxFileSize,
          model
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'YouTube',
      description: 'Embed a YouTube video.',
      icon: YoutubeIcon,
      tooltip: slashMenuToolTips['YouTube'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-youtube') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'YouTube',
          'The added YouTube video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'GitHub',
      description: 'Link to a GitHub repository.',
      icon: GithubIcon,
      tooltip: slashMenuToolTips['Github'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-github') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'GitHub',
          'The added GitHub issue or pull request link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Figma',
      description: 'Embed a Figma document.',
      icon: FigmaIcon,
      tooltip: slashMenuToolTips['Figma'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-figma') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Figma',
          'The added Figma link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Loom',
      icon: LoomIcon,
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-loom') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Loom',
          'The added Loom video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    ({ model, rootElement }) => {
      const { doc } = rootElement;

      const surfaceModel = getSurfaceBlock(doc);
      const noteModel = doc.getParent(model);
      if (!(noteModel instanceof NoteBlockModel)) return [];

      if (!surfaceModel) return [];

      const frameModels = doc
        .getBlocksByFlavour('affine:frame')
        .map(block => block.model) as FrameBlockModel[];

      const frameItems = frameModels.map<SlashMenuActionItem>(frameModel => ({
        name: 'Frame: ' + frameModel.title,
        icon: FrameIcon,
        showWhen: () => !insideDatabase(model),
        action: () => {
          const insertIdx = noteModel.children.indexOf(model);
          const surfaceRefProps = {
            flavour: 'affine:surface-ref',
            reference: frameModel.id,
            refFlavour: 'affine:frame',
          };

          doc.addSiblingBlocks(
            model,
            [surfaceRefProps],
            insertIdx === 0 ? 'before' : 'after'
          );

          if (
            matchFlavours(model, ['affine:paragraph']) &&
            model.text.length === 0
          ) {
            doc.deleteBlock(model);
          }
        },
      }));

      const groupElements = Array.from(
        surfaceModel.elements.getValue()?.values() ?? []
      ).filter(element => element.get('type') === CanvasElementType.GROUP);

      const groupItems = groupElements.map(element => ({
        name: 'Group: ' + element.get('title'),
        icon: GroupingIcon,
        action: () => {
          const { doc } = rootElement;
          const noteModel = doc.getParent(model) as NoteBlockModel;
          const insertIdx = noteModel.children.indexOf(model);
          const surfaceRefProps = {
            flavour: 'affine:surface-ref',
            reference: element.get('id'),
            refFlavour: 'group',
          };

          doc.addSiblingBlocks(
            model,
            [surfaceRefProps],
            insertIdx === 0 ? 'before' : 'after'
          );

          if (
            matchFlavours(model, ['affine:paragraph']) &&
            model.text.length === 0
          ) {
            doc.deleteBlock(model);
          }
        },
      }));

      const items = [...frameItems, ...groupItems];
      if (items.length !== 0) {
        return [
          {
            groupName: 'Document Group & Frame',
          },
          ...items,
        ];
      } else {
        return [];
      }
    },
    { groupName: 'Date' },
    () => {
      const now = new Date();
      const tomorrow = new Date();
      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return [
        {
          name: 'Today',
          icon: TodayIcon,
          tooltip: slashMenuToolTips['Today'],
          description: formatDate(now),
          action: ({ rootElement, model }) => {
            insertContent(rootElement.host, model, formatDate(now));
          },
        },
        {
          name: 'Tomorrow',
          icon: TomorrowIcon,
          tooltip: slashMenuToolTips['Tomorrow'],
          description: formatDate(tomorrow),
          action: ({ rootElement, model }) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            insertContent(rootElement.host, model, formatDate(tomorrow));
          },
        },
        {
          name: 'Yesterday',
          icon: YesterdayIcon,
          tooltip: slashMenuToolTips['Yesterday'],
          description: formatDate(yesterday),
          action: ({ rootElement, model }) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            insertContent(rootElement.host, model, formatDate(yesterday));
          },
        },
        {
          name: 'Now',
          icon: NowIcon,
          tooltip: slashMenuToolTips['Now'],
          description: formatTime(now),
          action: ({ rootElement, model }) => {
            insertContent(rootElement.host, model, formatTime(now));
          },
        },
      ];
    },
    { groupName: 'Database' },
    {
      name: 'Table View',
      description: 'Display items in a table format.',
      alias: ['database'],
      icon: DatabaseTableViewIcon20,
      tooltip: slashMenuToolTips['Table View'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model),
      action: ({ rootElement, model }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootElement.std.spec.getService('affine:database');
        service.initDatabaseBlock(
          rootElement.doc,
          model,
          id,
          viewPresets.tableViewConfig,
          false
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Todo',
      alias: ['todo view'],
      icon: DatabaseTableViewIcon20,
      tooltip: slashMenuToolTips['Todo'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model) &&
        !!model.doc.awarenessStore.getFlag('enable_block_query'),

      action: ({ model, rootElement }) => {
        const parent = rootElement.doc.getParent(model);
        assertExists(parent);
        const index = parent.children.indexOf(model);
        const id = rootElement.doc.addBlock(
          'affine:data-view',
          {},
          rootElement.doc.getParent(model),
          index + 1
        );
        const dataViewModel = rootElement.doc.getBlock(id)!;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        Promise.resolve().then(() => {
          const dataView = getBlockComponentByPath(
            rootElement.host,
            dataViewModel.model.id
          ) as DataViewBlockComponent;
          dataView.viewSource.viewAdd('table');
        });
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Kanban View',
      description: 'Visualize data in a dashboard.',
      alias: ['database'],
      icon: DatabaseKanbanViewIcon20,
      tooltip: slashMenuToolTips['Kanban View'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model),
      action: ({ model, rootElement }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootElement.std.spec.getService('affine:database');
        service.initDatabaseBlock(
          rootElement.doc,
          model,
          id,
          viewPresets.kanbanViewConfig,
          false
        );
        tryRemoveEmptyLine(model);
      },
    },

    // ---------------------------------------------------------
    { groupName: 'Actions' },
    {
      name: 'Move Up',
      description: 'Shift this line up.',
      icon: ArrowUpBigIcon,
      tooltip: slashMenuToolTips['Move Up'],
      action: ({ rootElement, model }) => {
        const doc = rootElement.doc;
        const previousSiblingModel = doc.getPrev(model);
        if (!previousSiblingModel) return;

        const parentModel = doc.getParent(previousSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([model], parentModel, previousSiblingModel, true);
      },
    },
    {
      name: 'Move Down',
      description: 'Shift this line down.',
      icon: ArrowDownBigIcon,
      tooltip: slashMenuToolTips['Move Down'],
      action: ({ rootElement, model }) => {
        const doc = rootElement.doc;
        const nextSiblingModel = doc.getNext(model);
        if (!nextSiblingModel) return;

        const parentModel = doc.getParent(nextSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([model], parentModel, nextSiblingModel, false);
      },
    },
    {
      name: 'Copy',
      description: 'Copy this line to clipboard.',
      icon: PasteIcon,
      tooltip: slashMenuToolTips['Copy'],
      action: ({ rootElement, model }) => {
        const slice = Slice.fromModels(rootElement.std.doc, [model]);

        rootElement.std.clipboard
          .copy(slice)
          .then(() => {
            toast(rootElement.host, 'Copied to clipboard');
          })
          .catch(e => {
            console.error(e);
          });
      },
    },
    {
      name: 'Duplicate',
      description: 'Create a duplicate of this line.',
      icon: CopyIcon,
      tooltip: slashMenuToolTips['Copy'],
      action: ({ rootElement, model }) => {
        if (!model.text || !(model.text instanceof Text)) {
          throw new Error("Can't duplicate a block without text");
        }
        const parent = rootElement.doc.getParent(model);
        if (!parent) {
          throw new Error('Failed to duplicate block! Parent not found');
        }
        const index = parent.children.indexOf(model);

        // TODO add clone model util
        rootElement.doc.addBlock(
          model.flavour as never,
          {
            type: (model as ParagraphBlockModel).type,
            text: rootElement.doc.Text.fromDelta(model.text.toDelta()),
            // @ts-expect-error
            checked: model.checked,
          },
          rootElement.doc.getParent(model),
          index
        );
      },
    },
    {
      name: 'Delete',
      description: 'Remove this line permanently.',
      alias: ['remove'],
      icon: DeleteIcon,
      tooltip: slashMenuToolTips['Delete'],
      action: ({ rootElement, model }) => {
        rootElement.doc.deleteBlock(model);
      },
    },
  ],
};
