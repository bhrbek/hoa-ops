"use client"

import * as React from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadImage } from "@/app/actions/storage"

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  className?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-slate-100 transition-colors disabled:opacity-50",
        isActive && "bg-slate-200 text-slate-900"
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-slate-200 mx-1" />
}

interface EditorToolbarProps {
  editor: Editor
  onImageUpload: () => void
  isUploading: boolean
}

function EditorToolbar({ editor, onImageUpload, isUploading }: EditorToolbarProps) {
  const addLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg flex-wrap">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link, Image, Table */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive("link")}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onImageUpload}
        disabled={isUploading}
        title="Upload Image"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </ToolbarButton>
      <ToolbarButton
        onClick={insertTable}
        isActive={editor.isActive("table")}
        title="Insert Table"
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  minHeight = "150px",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto my-4",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-slate-300",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-slate-300 bg-slate-100 p-2 font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-slate-300 p-2",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-4",
          "prose-headings:text-slate-900 prose-headings:font-bold",
          "prose-p:text-slate-700 prose-p:leading-relaxed",
          "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-li:text-slate-700",
          "prose-img:rounded-lg prose-img:shadow-sm"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const { url } = await uploadImage(formData)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (!editor) {
    return (
      <div className={cn("border border-slate-200 rounded-lg bg-white", className)}>
        <div className="h-10 bg-slate-50 rounded-t-lg border-b border-slate-200" />
        <div className="p-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-slate-200 rounded-lg bg-white overflow-hidden", className)}>
      <EditorToolbar
        editor={editor}
        onImageUpload={handleImageUpload}
        isUploading={isUploading}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

// Export a display-only version for rendering HTML content
export function RichTextDisplay({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  // Only import DOMPurify on client side
  const [sanitizedContent, setSanitizedContent] = React.useState("")

  React.useEffect(() => {
    import("dompurify").then((DOMPurify) => {
      setSanitizedContent(DOMPurify.default.sanitize(content))
    })
  }, [content])

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:text-slate-900 prose-headings:font-bold",
        "prose-p:text-slate-700 prose-p:leading-relaxed",
        "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:text-slate-700",
        "prose-img:rounded-lg prose-img:shadow-sm",
        "prose-table:border-collapse",
        "prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2",
        "prose-td:border prose-td:border-slate-300 prose-td:p-2",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
