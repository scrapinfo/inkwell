import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { generateHTML } from '@tiptap/html'
import DOMPurify from 'isomorphic-dompurify'
import type { JSONContent } from '@tiptap/core'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function isExternalHref(href: string): boolean {
  if (!href) return false
  if (/^(\/|#|mailto:|tel:)/i.test(href)) return false
  try {
    return new URL(href).host !== new URL(SITE_URL).host
  } catch {
    return false // not a parseable absolute URL — treat as internal/plain text
  }
}

/**
 * A Link extension that computes `rel` fresh from the href every time it
 * renders, rather than trusting whatever was stored. External links always
 * get "sponsored nofollow"; internal links just get the safety attributes.
 *
 * This is the mechanism behind "external links must auto-apply rel=sponsored
 * nofollow": the attribute is never part of the stored document, so there is
 * no path — live editor, public article page, or a future admin tool reusing
 * this same extension — that can render a link without it. The requirement
 * is enforced by the schema, not by remembering to apply it at every call site.
 *
 * We build this as a factory (not a module-level singleton) because
 * generateHTML() below needs its own instance for server-side rendering.
 */
function createSponsoredLinkExtension() {
  return Link.extend({
    renderHTML({ HTMLAttributes }) {
      const href = (HTMLAttributes.href as string) ?? ''
      const external = isExternalHref(href)
      return [
        'a',
        {
          ...HTMLAttributes,
          rel: external ? 'sponsored nofollow noopener noreferrer' : 'noopener noreferrer',
          target: external ? '_blank' : null,
        },
        0,
      ]
    },
  }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      class: 'text-ledger underline underline-offset-2 hover:text-ledger-dark',
    },
  })
}

/** Extensions for the live, editable editor (components/ArticleEditor.tsx). */
function createImageExtension() {
  return Image.configure({
    HTMLAttributes: { class: 'rounded-xl' },
  })
}

export function getEditorExtensions(placeholder = 'Start writing your article…') {
  return [
    // Tiptap 3's StarterKit bundles its own Link extension — disable it so
    // ours (with the rel enforcement above) is the only one in the schema.
    StarterKit.configure({
      link: false,
      heading: { levels: [2, 3, 4] },
    }),
    createSponsoredLinkExtension(),
    createImageExtension(),
    Placeholder.configure({ placeholder }),
  ]
}

/**
 * Convert a stored TipTap JSON document into sanitized HTML for public
 * rendering (app/[slug]/page.tsx, the admin preview). Runs server-side via
 * @tiptap/html, which uses a lightweight virtual DOM under the hood — no
 * browser or live editor instance required.
 */
export function articleJSONToSafeHTML(json: JSONContent): string {
  const html = generateHTML(json, [
    StarterKit.configure({ link: false, heading: { levels: [2, 3, 4] } }),
    createSponsoredLinkExtension(),
    createImageExtension(),
  ])
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] })
}
