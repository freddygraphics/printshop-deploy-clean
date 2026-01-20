"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";

import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";

/* =========================
   BOTÓN REUTILIZABLE
========================= */
function Btn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-xs border rounded
        ${active ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white"}
        hover:bg-gray-100`}
    >
      {children}
    </button>
  );
}

export default function JobDescriptionEditor({ value, onChange }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================
     TIPTAP EDITOR
  ========================= */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[160px] p-3 text-sm outline-none prose max-w-none",
      },
    },
  });

  // sincronizar cuando cambia el job
  useEffect(() => {
    if (!editor || !mounted) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor, mounted]);

  if (!mounted || !editor) return null;

  /* =========================
     ACTIONS
  ========================= */
  function setLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function clearFormatting() {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="border rounded-md bg-white overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-2 py-1">
        {/* LEFT — TEXT */}
        <div className="flex items-center gap-1">
          {/* Tt / Headings */}
          <select
            className="text-xs border rounded px-1 py-0.5 bg-white"
            onChange={(e) => {
              const level = Number(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
          >
            <option value="0">Normal</option>
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
          </select>

          <Btn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </Btn>

          <Btn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </Btn>

          <Btn
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            U
          </Btn>
        </div>

        {/* CENTER — LISTS */}
        <div className="flex items-center gap-1">
          <Btn
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            •
          </Btn>

          <Btn
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </Btn>
        </div>

        {/* RIGHT — ACTIONS */}
        <div className="flex items-center gap-1">
          {/* TEXT COLOR */}
          <input
            type="color"
            title="Text color"
            className="h-7 w-7 cursor-pointer border rounded"
            onChange={(e) => {
              if (editor.state.selection.empty) return;

              editor.chain().focus().setColor(e.target.value).run();
            }}
          />

          {/* LINKS */}
          <Btn active={editor.isActive("link")} onClick={setLink}>
            🔗
          </Btn>

          {/* CLEAR */}
          <Btn onClick={clearFormatting}>
            <span className="text-red-600">Clear</span>
          </Btn>
        </div>
      </div>

      {/* EDITOR */}
      <EditorContent editor={editor} />
    </div>
  );
}
