'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code2,
  Link2,
  ImagePlus,
} from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import { getEditorExtensions } from '@/lib/tiptap-extensions'
import { uploadMedia } from '@/lib/uploadMedia'

type SaveResult = { error?: string } | void

type ArticleEditorProps = {
  userId: string
  initialTitle?: string
  initialContent?: JSONContent | null
  initialCategoryId?: string | null
  categories: { id: string; name: string }[]
  onSaveDraft: (data: { title: string; content: JSONContent; categoryId: string | null }) => Promise<SaveResult>
  onSubmitForReview?: (data: {
    title: string
    content: JSONContent
    categoryId: string | null
  }) => Promise<SaveResult>
  submitLabel?: string
}

export default function ArticleEditor({
  userId,
  initialTitle = '',
  initialContent = null,
  initialCategoryId = null,
  categories,
  onSaveDraft,
  onSubmitForReview,
  submitLabel = 'Submit for review',
}: ArticleEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [isPending, startTransition] = useTransition()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [linkMenuOpen, setLinkMenuOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: initialContent ?? '',
    // Required in Next.js / any SSR framework — without it the editor tries
    // to render on the server render pass and the client hydration mismatches.
    immediatelyRender: false,
    // Required for toolbar buttons (Bold/H2/etc.) to correctly reflect
    // active state as the cursor moves — Tiptap 3 no longer re-renders on
    // every transaction by default.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none min-h-[400px] px-5 py-4 focus:outline-none',
      },
    },
  })

  const applyLink = useCallback(() => {
    if (!editor) return
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkMenuOpen(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleImageSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = '' // allow re-selecting the same file later
      if (!file || !editor) return

      setIsUploadingImage(true)
      const result = await uploadMedia(file, userId)
      setIsUploadingImage(false)

      if (result.error) {
        setStatusMessage(result.error)
        return
      }
      if (result.url) {
        editor.chain().focus().setImage({ src: result.url }).run()
      }
    },
    [editor, userId]
  )

  if (!editor) return null

  const runSave = (action: typeof onSaveDraft) => {
    setStatusMessage(null)
    startTransition(async () => {
      const result = await action({ title, content: editor.getJSON(), categoryId })
      setStatusMessage(result?.error ?? 'Draft saved.')
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Article title"
        className="w-full border-b border-line px-5 py-4 font-display text-2xl font-medium text-ink-950 placeholder:text-ink-500/40 focus:outline-none"
      />

      <div className="border-b border-line px-5 py-3">
        <label className="text-xs font-medium text-ink-500">
          Category{' '}
          <select
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="ml-2 rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-ledger/40"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Toolbar
        editor={editor}
        isUploadingImage={isUploadingImage}
        onToggleLinkMenu={() => {
          setLinkUrl(editor.getAttributes('link').href || '')
          setLinkMenuOpen((open) => !open)
        }}
        onInsertImage={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageSelected}
        className="hidden"
      />

      {linkMenuOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-5 py-3">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ledger/40"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-lg bg-ink-950 px-3 py-1.5 text-sm font-medium text-paper hover:bg-ink-700"
          >
            Apply
          </button>
          <span className="text-xs text-ink-500">
            External links automatically get rel="sponsored nofollow"
          </span>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        <span className="text-sm text-ink-500" role="status">
          {statusMessage}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runSave(onSaveDraft)}
            disabled={isPending || !title.trim()}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper disabled:opacity-50"
          >
            Save draft
          </button>
          {onSubmitForReview && (
            <button
              type="button"
              onClick={() => runSave(onSubmitForReview)}
              disabled={isPending || !title.trim()}
              className="rounded-lg bg-ledger px-4 py-2 text-sm font-medium text-white hover:bg-ledger-dark disabled:opacity-50"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Toolbar({
  editor,
  onToggleLinkMenu,
  onInsertImage,
  isUploadingImage,
}: {
  editor: Editor
  onToggleLinkMenu: () => void
  onInsertImage: () => void
  isUploadingImage: boolean
}) {
  const buttons: Array<{
    label: string
    icon: React.ComponentType<{ size?: number }>
    active: boolean
    onClick: () => void
  }> = [
    {
      label: 'Bold',
      icon: Bold,
      active: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Heading',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Subheading',
      icon: Heading3,
      active: editor.isActive('heading', { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Quote',
      icon: Quote,
      active: editor.isActive('blockquote'),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Bullet list',
      icon: List,
      active: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Code block',
      icon: Code2,
      active: editor.isActive('codeBlock'),
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: 'Link',
      icon: Link2,
      active: editor.isActive('link'),
      onClick: onToggleLinkMenu,
    },
    {
      label: isUploadingImage ? 'Uploading…' : 'Insert image',
      icon: ImagePlus,
      active: false,
      onClick: onInsertImage,
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 border-b border-line bg-paper px-3 py-2">
      {buttons.map(({ label, icon: Icon, active, onClick }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={active}
          disabled={label === 'Uploading…'}
          onClick={onClick}
          className={`rounded-md p-2 transition disabled:opacity-40 ${
            active ? 'bg-ink-950 text-paper' : 'text-ink-700 hover:bg-line/60'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
