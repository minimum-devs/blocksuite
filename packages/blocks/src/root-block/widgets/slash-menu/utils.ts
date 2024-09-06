import type { EditorHost } from '@blocksuite/block-std';
import { assertType } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import type { TextConversionConfig } from '../../../_common/configs/text-conversion.js';
import type { AffineTextAttributes } from '../../../_common/inline/presets/affine-inline-specs.js';
import { isInsideBlockByFlavour } from '../../../_common/utils/index.js';
import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import { StrokeStyle } from '../../../surface-block/consts.js';
import type {
  SlashMenuActionItem,
  SlashMenuContext,
  SlashMenuGroupDivider,
  SlashMenuItem,
  SlashMenuItemGenerator,
  SlashMenuStaticItem,
  SlashSubMenu,
} from './config.js';
import { slashMenuToolTips } from './tooltips/index.js';

export function isGroupDivider(
  item: SlashMenuStaticItem
): item is SlashMenuGroupDivider {
  return 'groupName' in item;
}

export function notGroupDivider(
  item: SlashMenuStaticItem
): item is Exclude<SlashMenuStaticItem, SlashMenuGroupDivider> {
  return !isGroupDivider(item);
}

export function isActionItem(
  item: SlashMenuStaticItem
): item is SlashMenuActionItem {
  return 'action' in item;
}

export function isSubMenuItem(item: SlashMenuStaticItem): item is SlashSubMenu {
  return 'subMenu' in item;
}

export function isMenuItemGenerator(
  item: SlashMenuItem
): item is SlashMenuItemGenerator {
  return typeof item === 'function';
}

export function slashItemClassName(item: SlashMenuStaticItem) {
  const name = isGroupDivider(item) ? item.groupName : item.name;

  return name.split(' ').join('-').toLocaleLowerCase();
}

export function filterEnabledSlashMenuItems(
  items: SlashMenuItem[],
  context: SlashMenuContext
): SlashMenuStaticItem[] {
  const result = items
    .map(item => (isMenuItemGenerator(item) ? item(context) : item))
    .flat()
    .filter(item => (item.showWhen ? item.showWhen(context) : true))
    .map(item => {
      if (isSubMenuItem(item)) {
        return {
          ...item,
          subMenu: filterEnabledSlashMenuItems(item.subMenu, context),
        };
      } else {
        return { ...item };
      }
    });
  return result;
}

export function getFirstNotDividerItem(
  items: SlashMenuStaticItem[]
): SlashMenuActionItem | SlashSubMenu | null {
  const firstItem = items.find(item => !isGroupDivider(item));
  assertType<SlashMenuActionItem | SlashSubMenu | undefined>(firstItem);
  return firstItem ?? null;
}

export function insertContent(
  editorHost: EditorHost,
  model: BlockModel,
  text: string,
  attributes?: AffineTextAttributes
) {
  if (!model.text) {
    throw new Error("Can't insert text! Text not found");
  }
  const inlineEditor = getInlineEditorByModel(editorHost, model);
  if (!inlineEditor) {
    throw new Error("Can't insert text! Inline editor not found");
  }
  const inlineRange = inlineEditor.getInlineRange();
  const index = inlineRange ? inlineRange.index : model.text.length;
  model.text.insert(text, index, attributes as Record<string, unknown>);
  // Update the caret to the end of the inserted text
  inlineEditor.setInlineRange({
    index: index + text.length,
    length: 0,
  });
}

export function formatDate(date: Date) {
  // yyyy-mm-dd
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const strTime = `${year}-${month}-${day}`;
  return strTime;
}

export function formatTime(date: Date) {
  // mm-dd hh:mm
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const strTime = `${month}-${day} ${hours}:${minutes}`;
  return strTime;
}

export function insideDatabase(model: BlockModel) {
  return isInsideBlockByFlavour(model.doc, model, 'affine:database');
}

export function insideEdgelessText(model: BlockModel) {
  return isInsideBlockByFlavour(model.doc, model, 'affine:edgeless-text');
}

export function createDatabaseBlockInNextLine(model: BlockModel) {
  let parent = model.doc.getParent(model);
  while (parent && parent.flavour !== 'affine:note') {
    model = parent;
    parent = model.doc.getParent(parent);
  }
  if (!parent) {
    return;
  }
  const index = parent.children.indexOf(model);

  return model.doc.addBlock('affine:database', {}, parent, index + 1);
}

export function tryRemoveEmptyLine(model: BlockModel) {
  if (!model.text?.length) {
    model.doc.deleteBlock(model);
  }
}

export function createConversionItem(
  config: TextConversionConfig
): SlashMenuActionItem {
  const { name, type, description, icon, flavour } = config;
  return {
    name,
    description,
    icon,
    tooltip: slashMenuToolTips[name],
    showWhen: ({ model }) => model.doc.schema.flavourSchemaMap.has(flavour),
    action: ({ rootElement, model }) => {
      if (!model) return;
      model.doc.captureSync();

      let background = '';
      let borderSize = 0;
      let borderStyle = StrokeStyle.None;
      let borderRadius = 16;

      switch (name) {
        case 'Major Step':
          background = '--affine-note-background-blue';
          break;
        case 'Minor Step':
          background = '--affine-note-background-white';
          borderSize = 4;
          borderStyle = StrokeStyle.Solid;
          break;
        case 'Automation Step':
          background = '--affine-note-background-purple';
          break;
        case 'Documentation':
          background = '--affine-note-background-white';
          break;
        case 'Decision Step':
          background = '--affine-note-background-orange';
          borderSize = 2;
          borderStyle = StrokeStyle.Dash;
          borderRadius = 999;
          break;
        case 'End Step':
          background = '--affine-note-background-red';
          break;
        default:
          background = '--affine-note-background-default';
      }

      // Get the parent note of the current paragraph
      const parentNote = model.doc.getParent(model.id);
      if (parentNote) {
        const hasAnotherParagraph = parentNote.children?.some(
          child => child.flavour === 'affine:paragraph' && child.id !== model.id
        );
        if (hasAnotherParagraph) {
          const rootModel = rootElement.host.std.doc.root;
          if (!rootModel) return;
          const rootId = rootModel.id;
          // Get all existing notes to calculate their positions
          const existingNotes =
            rootElement.host.std.doc.getBlocksByFlavour('affine:note');
          // Calculate a new position for the new note to avoid overlap
          let newX = 0; // Default x position
          let newY = 0; // Default y position
          const noteWidth = 304;
          const noteHeight = 95;
          const margin = 20; // Margin between notes
          existingNotes.forEach(note => {
            const [x, y, width, height] = note.model.xywh
              .replace(/[[\]]/g, '') // Remove brackets
              .split(',')
              .map(Number);
            // Check if the new note would overlap with an existing note
            if (newX < x + width + margin && newY < y + height + margin) {
              // Move the new note down or to the right to avoid overlap
              newX = x + width + margin;
              newY = y + height + margin;
            }
          });

          const xywh = `[${newX},${newY},${noteWidth},${noteHeight}]`;

          // Create the new note at the calculated position with the determined properties
          const newNoteId = rootElement.host.std.doc.addBlock(
            'affine:note',
            {
              xywh,
              background,
              edgeless: {
                style: {
                  borderSize,
                  borderStyle,
                  borderRadius,
                },
              },
            },
            rootId
          );
          const text = new rootElement.host.std.doc.Text('');
          // Create a new paragraph inside the new note
          const newParagraphId = rootElement.host.std.doc.addBlock(
            'affine:paragraph',
            { text, type: type },
            newNoteId
          );
          console.log(
            `New note with paragraph created at position: ${xywh} with background: ${background}`
          );
          // Focus on the text inside the newly created paragraph block
          const selection = rootElement.host.selection;
          selection.update(() => {
            return [
              selection.create('text', {
                from: {
                  blockId: newParagraphId,
                  index: 0,
                  length: text.length,
                },
                to: null,
              }),
            ];
          });
          console.log(
            `Focused on text inside the paragraph block with ID: ${newParagraphId}`
          );
        } else {
          // Update the existing block with new type and style
          model.doc.updateBlock(parentNote, {
            background,
            edgeless: {
              style: {
                borderSize,
                borderStyle,
                borderRadius,
              },
            },
          });
          model.doc.updateBlock(model, { type: type });
          console.log(`Block updated with type: ${type} and new style`);
        }
      } else {
        console.error('Parent block (note) not found');
      }
    },
  };
}
