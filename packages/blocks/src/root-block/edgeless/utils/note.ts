import {
  asyncFocusRichText,
  handleNativeRangeAtPoint,
  type NoteChildrenFlavour,
  type Point,
} from '../../../_common/utils/index.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  NOTE_MIN_HEIGHT,
} from './consts.js';

export type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  collapse: boolean;
};

export function addNote(
  edgeless: EdgelessRootBlockComponent,
  point: Point,
  options: NoteOptions,
  tip: string,
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT
) {
  const noteId = edgeless.addNoteWithPoint(point, {
    width,
    height,
  });

  const doc = edgeless.doc;

  const note = doc.getBlockById(noteId) as NoteBlockModel;

  let background = '';
  switch (tip) {
    case 'Major Step':
      background = '--affine-note-background-blue';
      break;
    case 'Minor Step':
      background = '--affine-note-background-white';
      break;
    case 'Automation Step':
      background = '--affine-note-background-purple';
      break;
    case 'Documentation':
      background = '--affine-note-background-white';
      break;
    case 'Decision Step':
    case 'End Step':
      background = '--affine-note-background-red';
      break;
    default:
      background = '--affine-note-background-default';
  }

  // Update the note's background color
  doc.updateBlock(note, () => {
    note.background = background;
  });

  const blockId = doc.addBlock(
    options.childFlavour,
    { type: options.childType },
    noteId
  );

  if (options.collapse && height > NOTE_MIN_HEIGHT) {
    doc.updateBlock(note, () => {
      note.edgeless.collapse = true;
      note.edgeless.collapsedHeight = height;
    });
  }

  // Rest of the function remains unchanged
  edgeless.tools.setEdgelessTool({ type: 'default' });
  requestAnimationFrame(() => {
    const blocks =
      (doc.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as BlockSuite.EdgelessBlockModelType[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      edgeless.service.selection.set({
        elements: [element.id],
        editing: true,
      });
      edgeless.updateComplete
        .then(() => {
          if (blockId) {
            asyncFocusRichText(edgeless.host, blockId)?.catch(console.error);
          } else {
            handleNativeRangeAtPoint(point.x, point.y);
          }
        })
        .catch(console.error);
    }
  });
}
