"use client";

import { useEffect, useRef, useState } from "react";

import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Eraser,
} from "lucide-react";

export default function ProductDescriptionEditor({
  value = "",
  onChange,
  placeholder = "Product description...",
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // =====================================================
  // TOOLBAR STATE
  // =====================================================

  const [textColor, setTextColor] = useState("#000000");
  const [blockType, setBlockType] = useState("p");
  const [fontSize, setFontSize] = useState("");

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  // =====================================================
  // LOAD VALUE
  // =====================================================

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) return;

    if (
      document.activeElement !== editor &&
      editor.innerHTML !== (value || "")
    ) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  // =====================================================
  // EMIT HTML
  // =====================================================

  function emitChange() {
    const editor = editorRef.current;

    if (!editor) return;

    onChange?.(editor.innerHTML);
  }

  // =====================================================
  // SELECTION
  // =====================================================

  function getSelectedElement() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let node = selection.anchorNode;

    if (!node) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    if (!(node instanceof Element)) {
      return null;
    }

    if (!editorRef.current?.contains(node)) {
      return null;
    }

    return node;
  }

  function saveSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    savedRangeRef.current = range.cloneRange();

    updateToolbarState();
  }

  function restoreSelection() {
    const range = savedRangeRef.current;

    if (!range) return;

    const selection = window.getSelection();

    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function prepareCommand() {
    editorRef.current?.focus();
    restoreSelection();
  }

  // =====================================================
  // READ CURRENT FORMATTING
  // =====================================================

  function updateToolbarState() {
    const element = getSelectedElement();

    if (!element) return;

    // -----------------------------------------
    // BOLD / ITALIC / UNDERLINE
    // -----------------------------------------

    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));

      setIsBulletList(document.queryCommandState("insertUnorderedList"));

      setIsNumberedList(document.queryCommandState("insertOrderedList"));
    } catch {
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsBulletList(false);
      setIsNumberedList(false);
    }

    // -----------------------------------------
    // BLOCK TYPE
    // -----------------------------------------

    const blockElement = element.closest("h2, h3, h4, p, div, li");

    if (blockElement) {
      const tag = blockElement.tagName.toLowerCase();

      if (tag === "h2" || tag === "h3" || tag === "h4") {
        setBlockType(tag);
      } else {
        setBlockType("p");
      }
    } else {
      setBlockType("p");
    }

    // -----------------------------------------
    // COMPUTED STYLE
    // -----------------------------------------

    const computedStyle = window.getComputedStyle(element);

    // FONT SIZE

    const size = Math.round(parseFloat(computedStyle.fontSize || "16"));

    const supportedSizes = [12, 14, 16, 18, 20, 24, 28, 32];

    if (supportedSizes.includes(size)) {
      setFontSize(`${size}px`);
    } else {
      setFontSize("");
    }

    // COLOR

    const rgb = computedStyle.color;

    const hex = rgbToHex(rgb);

    if (hex) {
      setTextColor(hex);
    }
  }

  // =====================================================
  // RGB → HEX
  // =====================================================

  function rgbToHex(rgb) {
    if (!rgb) return null;

    if (rgb.startsWith("#")) {
      return rgb;
    }

    const match = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);

    if (!match) return null;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);

    return (
      "#" +
      [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")
    );
  }

  // =====================================================
  // BASIC COMMAND
  // =====================================================

  function runCommand(command, commandValue = null) {
    prepareCommand();

    document.execCommand(command, false, commandValue);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // BLOCK
  // =====================================================

  function handleBlockChange(event) {
    const block = event.target.value;

    prepareCommand();

    const tag = block === "p" ? "P" : block.toUpperCase();

    document.execCommand("formatBlock", false, tag);

    setBlockType(block);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // FONT SIZE
  // =====================================================

  function handleFontSize(event) {
    const size = event.target.value;

    if (!size) return;

    prepareCommand();

    document.execCommand("fontSize", false, "7");

    const editor = editorRef.current;

    if (!editor) return;

    const generatedFonts = editor.querySelectorAll('font[size="7"]');

    generatedFonts.forEach((font) => {
      const span = document.createElement("span");

      span.style.fontSize = size;

      while (font.firstChild) {
        span.appendChild(font.firstChild);
      }

      font.replaceWith(span);
    });

    setFontSize(size);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // COLOR
  // =====================================================

  function handleColor(event) {
    const color = event.target.value;

    setTextColor(color);

    prepareCommand();

    document.execCommand("foreColor", false, color);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // LINK
  // =====================================================

  function handleLink() {
    restoreSelection();

    const url = window.prompt("Enter link URL:");

    if (!url) return;

    const normalizedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    prepareCommand();

    document.execCommand("createLink", false, normalizedUrl);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // CLEAR
  // =====================================================

  function clearFormatting() {
    prepareCommand();

    document.execCommand("removeFormat", false);

    saveSelection();
    emitChange();
    updateToolbarState();
  }

  // =====================================================
  // BUTTON STYLE
  // =====================================================

  function toolbarButton(active = false) {
    return `
      flex h-9 w-9 items-center justify-center
      rounded-md border
      transition
      ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
      }
    `;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
      {/* TOOLBAR */}

      <div
        className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2"
        onMouseDown={saveSelection}
      >
        {/* BLOCK */}

        <select
          value={blockType}
          onMouseDown={saveSelection}
          onChange={handleBlockChange}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-500"
        >
          <option value="p">Normal</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        {/* SIZE */}

        <select
          value={fontSize}
          onMouseDown={saveSelection}
          onChange={handleFontSize}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-500"
        >
          <option value="">Size</option>

          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        <div className="mx-1 h-6 w-px bg-gray-300" />

        {/* BOLD */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={() => runCommand("bold")}
          className={toolbarButton(isBold)}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        {/* ITALIC */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={() => runCommand("italic")}
          className={toolbarButton(isItalic)}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        {/* UNDERLINE */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={() => runCommand("underline")}
          className={toolbarButton(isUnderline)}
          title="Underline"
        >
          <Underline size={16} />
        </button>

        <div className="mx-1 h-6 w-px bg-gray-300" />

        {/* BULLET LIST */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={() => runCommand("insertUnorderedList")}
          className={toolbarButton(isBulletList)}
          title="Bullet list"
        >
          <List size={17} />
        </button>

        {/* NUMBER LIST */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={() => runCommand("insertOrderedList")}
          className={toolbarButton(isNumberedList)}
          title="Numbered list"
        >
          <ListOrdered size={17} />
        </button>

        <div className="mx-1 h-6 w-px bg-gray-300" />

        {/* COLOR */}

        <label
          onMouseDown={saveSelection}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-100"
          title={`Text color ${textColor}`}
        >
          <span
            className="h-5 w-5 rounded-sm border border-gray-400"
            style={{
              backgroundColor: textColor,
            }}
          />

          <input
            type="color"
            value={textColor}
            onChange={handleColor}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {/* LINK */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={handleLink}
          className={toolbarButton(false)}
          title="Insert link"
        >
          <LinkIcon size={16} />
        </button>

        {/* CLEAR */}

        <button
          type="button"
          onMouseDown={saveSelection}
          onClick={clearFormatting}
          className="ml-auto flex h-9 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-red-500 hover:bg-red-50"
        >
          <Eraser size={15} />
          Clear
        </button>
      </div>

      {/* EDITOR */}

      <div className="relative">
        {!value && (
          <div className="pointer-events-none absolute left-4 top-3 text-base text-gray-400">
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            saveSelection();
            emitChange();
          }}
          onKeyUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          onMouseUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          onFocus={() => {
            saveSelection();
            updateToolbarState();
          }}
          className="
            min-h-[150px]
            w-full
            px-4
            py-3
            text-base
            leading-6
            text-gray-800
            outline-none

            [&_p]:m-0
            [&_div]:m-0

            [&_h2]:m-0
            [&_h2]:text-2xl
            [&_h2]:font-bold

            [&_h3]:m-0
            [&_h3]:text-xl
            [&_h3]:font-semibold

            [&_h4]:m-0
            [&_h4]:text-lg
            [&_h4]:font-semibold

            [&_ul]:my-1
            [&_ul]:ml-6
            [&_ul]:list-disc

            [&_ol]:my-1
            [&_ol]:ml-6
            [&_ol]:list-decimal

            [&_li]:m-0

            [&_a]:text-blue-600
            [&_a]:underline
          "
        />
      </div>
    </div>
  );
}
