import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Code2, Link as LinkIcon, Unlink, Undo2, Redo2, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon, Table as TableIcon,
  Highlighter, Palette, Eraser, Loader2, Type,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

const BUCKET = "site-media";
const FONT_SIZES = ["", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];

export function RichEditor({ value, onChange, minHeight = 200 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-md" } }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-3 py-2 min-h-[var(--rich-min)] dark:prose-invert",
        style: `--rich-min:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !editor) return;
    setUploading(true);
    try {
      const ext = (f.name.split(".").pop() || "bin").toLowerCase();
      const path = `editor/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, f, { cacheControl: "3600", upsert: false, contentType: f.type || undefined });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link")?.href ?? "";
    const url = window.prompt("Link URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }

  const Btn = ({
    onClick, active, children, label, disabled,
  }: { onClick: () => void; active?: boolean; children: any; label: string; disabled?: boolean }) => (
    <Button
      type="button" variant={active ? "default" : "ghost"} size="sm" disabled={disabled}
      className="h-8 w-8 p-0" onClick={onClick} aria-label={label} title={label}
    >
      {children}
    </Button>
  );

  const Sep = () => <div className="mx-1 h-5 w-px bg-border" />;

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 p-1">
        <Btn label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Btn>
        <Btn label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Btn>
        <Btn label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Btn>
        <Sep />
        <Btn label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Btn>
        <Btn label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Btn>
        <Btn label="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })}><Heading4 className="h-4 w-4" /></Btn>
        <Sep />
        <Btn label="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Btn>
        <Btn label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Btn>
        <Btn label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><Code2 className="h-4 w-4" /></Btn>
        <Btn label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
        <Sep />
        <Btn label="Align start" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}><AlignLeft className="h-4 w-4" /></Btn>
        <Btn label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}><AlignCenter className="h-4 w-4" /></Btn>
        <Btn label="Align end" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}><AlignRight className="h-4 w-4" /></Btn>
        <Btn label="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })}><AlignJustify className="h-4 w-4" /></Btn>
        <Sep />
        <label className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer" title="Text colour">
          <Palette className="h-4 w-4" />
          <input
            type="color"
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            value={editor.getAttributes("textStyle")?.color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            aria-label="Text colour"
          />
        </label>
        <label className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer" title="Highlight">
          <Highlighter className="h-4 w-4" />
          <input
            type="color"
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            value={editor.getAttributes("highlight")?.color || "#fff59d"}
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            aria-label="Highlight colour"
          />
        </label>
        <div className="inline-flex items-center gap-1">
          <Type className="h-4 w-4 text-muted-foreground" />
          <select
            className="h-8 rounded-md border border-input bg-background px-1 text-xs"
            value={editor.getAttributes("textStyle")?.fontSize || ""}
            onChange={(e) =>
              e.target.value
                ? editor.chain().focus().setFontSize(e.target.value).run()
                : editor.chain().focus().unsetFontSize().run()
            }
            aria-label="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s || "default"} value={s}>{s || "Default"}</option>
            ))}
          </select>
        </div>
        <Sep />
        <Btn label="Link" onClick={setLink} active={editor.isActive("link")}><LinkIcon className="h-4 w-4" /></Btn>
        <Btn label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")}><Unlink className="h-4 w-4" /></Btn>
        <Btn label="Insert image" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Btn>
        <Btn label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Btn>
        <Sep />
        <Btn label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="h-4 w-4" /></Btn>
        <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
        <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
