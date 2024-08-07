import type { EditorHost } from '@blocksuite/block-std';
import type { InlineRange, VLine } from '@blocksuite/inline';
import type { BlockModel } from '@blocksuite/store';

import { IS_FIREFOX } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';

import type { SelectionPosition } from '../types.js';

import { matchFlavours } from './model.js';
import {
  asyncGetRichText,
  buildPath,
  getDocTitleInlineEditor,
  getPageRootByElement,
} from './query.js';
import { Rect } from './rect.js';

declare global {
  interface Document {
    // firefox API
    caretPositionFromPoint(
      x: number,
      y: number
    ): {
      offsetNode: Node;
      offset: number;
    };
  }
}

export async function asyncSetInlineRange(
  editorHost: EditorHost,
  model: BlockModel,
  inlineRange: InlineRange
) {
  const richText = await asyncGetRichText(editorHost, model.id);
  if (!richText) {
    return;
  }

  await richText.updateComplete;
  const inlineEditor = richText.inlineEditor;
  if (!inlineEditor) {
    return;
  }
  inlineEditor.setInlineRange(inlineRange);
}

export async function asyncFocusRichText(
  editorHost: EditorHost,
  id: string,
  offset: number = 0
) {
  const selection = editorHost.std.selection;
  selection.setGroup('note', [
    selection.create('text', {
      from: { blockId: id, index: offset, length: 0 },
      to: null,
    }),
  ]);
  await editorHost.updateComplete;
}

/**
 * A wrapper for the browser's `caretPositionFromPoint` and `caretRangeFromPoint`,
 * but adapted for different browsers.
 */
export function caretRangeFromPoint(
  clientX: number,
  clientY: number
): Range | null {
  if (IS_FIREFOX) {
    const caret = document.caretPositionFromPoint(clientX, clientY);
    // TODO handle caret is covered by popup
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }

  const range = document.caretRangeFromPoint(clientX, clientY);

  if (!range) {
    return null;
  }

  // See https://github.com/toeverything/blocksuite/issues/1382
  const rangeRects = range?.getClientRects();
  if (
    rangeRects &&
    rangeRects.length === 2 &&
    range.startOffset === range.endOffset &&
    clientY < rangeRects[0].y + rangeRects[0].height
  ) {
    const deltaX = (rangeRects[0].x | 0) - (rangeRects[1].x | 0);

    if (deltaX > 0) {
      range.setStart(range.startContainer, range.startOffset - 1);
      range.setEnd(range.endContainer, range.endOffset - 1);
    }
  }
  return range;
}

function setStartRange(editableContainer: Element) {
  const newRange = document.createRange();
  let firstNode = editableContainer.firstChild;
  while (firstNode?.firstChild) {
    firstNode = firstNode.firstChild;
  }
  if (firstNode) {
    newRange.setStart(firstNode, 0);
    newRange.setEnd(firstNode, 0);
  }
  return newRange;
}

function setEndRange(editableContainer: Element) {
  const newRange = document.createRange();
  let lastNode = editableContainer.lastChild;
  while (lastNode?.lastChild) {
    lastNode = lastNode.lastChild;
  }
  if (lastNode) {
    newRange.setStart(lastNode, lastNode.textContent?.length || 0);
    newRange.setEnd(lastNode, lastNode.textContent?.length || 0);
  }
  return newRange;
}

function setNewTop(y: number, editableContainer: Element, zoom = 1) {
  const SCROLL_THRESHOLD = 100;

  const scrollContainer = editableContainer.closest('.affine-page-viewport');
  const { top, bottom } = Rect.fromDOM(editableContainer);
  const { clientHeight } = document.documentElement;
  const lineHeight =
    (Number(
      window.getComputedStyle(editableContainer).lineHeight.replace(/\D+$/, '')
    ) || 16) * zoom;

  const compare = bottom < y;
  switch (compare) {
    case true: {
      let finalBottom = bottom;
      if (bottom < SCROLL_THRESHOLD && scrollContainer) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop - SCROLL_THRESHOLD + bottom;
        // set scroll may have an animation, wait for over
        requestAnimationFrame(() => {
          finalBottom = editableContainer.getBoundingClientRect().bottom;
        });
      }
      return finalBottom - lineHeight / 2;
    }
    case false: {
      let finalTop = top;
      if (scrollContainer && top > clientHeight - SCROLL_THRESHOLD) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop + (top + SCROLL_THRESHOLD - clientHeight);
        // set scroll may has a animation, wait for over
        requestAnimationFrame(() => {
          finalTop = editableContainer.getBoundingClientRect().top;
        });
      }
      return finalTop + lineHeight / 2;
    }
  }
}

/**
 * As the title is a text area, this function does not yet have support for `SelectionPosition`.
 */
export function focusTitle(editorHost: EditorHost, index = Infinity, len = 0) {
  const titleInlineEditor = getDocTitleInlineEditor(editorHost);
  if (!titleInlineEditor) {
    return;
  }

  if (index > titleInlineEditor.yText.length) {
    index = titleInlineEditor.yText.length;
  }
  titleInlineEditor.setInlineRange({ index, length: len });
}

function focusRichText(
  editableContainer: Element,
  position: SelectionPosition = 'end',
  zoom = 1
) {
  const isPageRoot = !!getPageRootByElement(editableContainer);
  if (isPageRoot) {
    editableContainer
      .querySelector<VLine>('v-line')
      ?.scrollIntoView({ block: 'nearest' });
  }

  // TODO optimize how get scroll container
  const { left, right } = Rect.fromDOM(editableContainer);

  let range: Range | null = null;
  switch (position) {
    case 'start':
      range = setStartRange(editableContainer);
      break;
    case 'end':
      range = setEndRange(editableContainer);
      break;
    default: {
      const { x, y } = position;
      let newLeft = x;
      const newTop = setNewTop(y, editableContainer, zoom);
      if (x <= left) {
        newLeft = left + 1;
      }
      if (x >= right) {
        newLeft = right - 1;
      }
      range = caretRangeFromPoint(newLeft, newTop);
      break;
    }
  }
  resetNativeSelection(range);
}

/**
 * @deprecated Use `selectionManager.set` instead.
 */
export function focusBlockByModel(
  editorHost: EditorHost,
  model: BlockModel,
  position: SelectionPosition = 'end',
  zoom = 1
) {
  if (matchFlavours(model, ['affine:note', 'affine:page'])) {
    console.error("Can't focus note or doc!");
    return;
  }

  const element = editorHost.view.viewFromPath('block', buildPath(model));
  const editableContainer = element?.querySelector('[contenteditable]');
  if (editableContainer) {
    focusRichText(editableContainer, position, zoom);
  }
}

export function resetNativeSelection(range: Range | null) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  range && selection.addRange(range);
}

export function getCurrentNativeRange(selection = window.getSelection()) {
  // When called on an <iframe> that is not displayed (e.g., where display: none is set) Firefox will return null
  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection for more details
  if (!selection) {
    console.error('Failed to get current range, selection is null');
    return null;
  }
  if (selection.rangeCount === 0) {
    return null;
  }
  if (selection.rangeCount > 1) {
    console.warn('getCurrentNativeRange may be wrong, rangeCount > 1');
  }
  return selection.getRangeAt(0);
}

export function handleNativeRangeAtPoint(x: number, y: number) {
  const range = caretRangeFromPoint(x, y);
  const startContainer = range?.startContainer;
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }
}
