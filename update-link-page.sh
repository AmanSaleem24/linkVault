#!/bin/bash
set -e

# We will use Node.js to update the file to avoid sed quoting issues and make accurate multi-line replacements.
node << 'JS_EOF'
const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'src/app/(dashboard)/link/[id]/page.tsx')
let content = fs.readFileSync(file, 'utf8')

// 1. Add ChevronLeft to lucide-react imports
content = content.replace(
  "import {",
  "import {\n  ChevronLeft,"
)

// 2. FaviconImg styles
content = content.replace(
  /className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden"/g,
  'className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 overflow-hidden shadow-sm"'
)

// 3. Main layout replacements
content = content.replace(
  /\{\/\* ── Back Link ──────────────────────────────────────────────────────── \*\/\}.*?\{\/\* ── Summary Stats ────────────────────────────────────────────────── \*\/\}/s,
  `{/* ── Back Link ──────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/link')}
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to list
      </button>

      {/* ── Link Info Card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <FaviconImg url={link.originalUrl} />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
                  {getLinkTitle(link.originalUrl) || link.originalUrl}
                </h1>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-indigo-700">{shortUrl.replace(/^https?:\\/\\//, '')}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded p-1 text-indigo-600/70 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                      title="Copy short link"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[13px] text-slate-500">
                    <CornerDownRight className="size-3.5" />
                    <span className="truncate">{link.originalUrl}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  <DropdownMenuItem onClick={handleCopy} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Copy className="size-4 text-slate-500" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(link.originalUrl, '_blank')} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Globe className="size-4 text-slate-500" /> Open link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => router.push(\`/link/\${link.id}/edit\`)}
                title="Edit"
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="size-4" />
              </button>

              <button
                onClick={handleShare}
                title="Share"
                className="inline-flex items-center gap-2 h-9 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Tag className="size-4" />
            <span>No tags</span>
          </div>
          <span className="text-sm font-medium text-slate-500">
            {new Date(link.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
          </span>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}`
)

// 4. Update "Engagements over time" header buttons
content = content.replace(
  /<button\s+onClick=\{handleUpgrade\}\s+className="hidden sm:inline-flex items-center gap-1\.5 rounded-lg border border-slate-200 bg-white px-3 py-1\.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors"\s+>\s+<Sparkles className="size-3\.5 text-brand-400" \/>\s+What's driving engagement\?\s+<\/button>/,
  `<button
              onClick={handleUpgrade}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Sparkles className="size-3.5 text-fuchsia-500" />
              What's driving engagement?
            </button>`
)

content = content.replace(
  /className="inline-flex items-center gap-1\.5 rounded-full bg-slate-900 px-3 py-1\.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"/g,
  'className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"'
)

// 5. Update Locations header for the "Countries / Cities" toggle
content = content.replace(
  /<h2 className="text-lg font-bold text-slate-900">Locations<\/h2>\s*\{!isPro && \(\s*<button\s+onClick=\{handleUpgrade\}\s+className="inline-flex items-center gap-1\.5 rounded-full bg-slate-800 px-3\.5 py-1\.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"\s+>\s+<Lock className="size-3\.5" \/>\s+Upgrade\s+<\/button>\s*\)\}/s,
  `<h2 className="text-lg font-bold text-slate-900">Locations</h2>
          <div className="flex items-center gap-3">
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <Lock className="size-3.5" />
                Upgrade
              </button>
            )}
            <div className="flex items-center rounded-full bg-slate-100 p-1">
              <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Countries</button>
              <button className="rounded-full px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Cities</button>
            </div>
          </div>`
)

// 6. Update chart colors
content = content.replace(
  /fill=\{entry\.count > 0 \? '#14b8a6' : '#e2e8f0'\}/,
  "fill={entry.count > 0 ? '#06b6d4' : '#e2e8f0'}"
)

content = content.replace(
  /className="h-full rounded-full bg-brand-400 transition-all"/,
  'className="h-full rounded-full bg-[#8b5cf6] transition-all"'
)

content = content.replace(
  /colors=\{/g,
  "colors={['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0']} // "
)

// 7. Update SegmentChart styling
content = content.replace(
  /const size = 120\s*const strokeWidth = 24/,
  "const size = 150\n  const strokeWidth = 32"
)

fs.writeFileSync(file, content)
JS_EOF

node << 'JS_EOF'
const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'src/app/(dashboard)/link/[id]/page.tsx')
let content = fs.readFileSync(file, 'utf8')

// Adjust the colors logic that might have been messed up by the simple replace
content = content.replace(
  /colors=\{\['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0'\]\} \/\/ \['#f97316', '#14b8a6', '#3D52A0', '#3b82f6', '#ef4444'\]\}/g,
  "colors={['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0']}"
)

// For referrers and devices segment charts, the initial replace would have done this:
content = content.replace(
  /colors=\{\['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0'\]\} \/\/ \['#3D52A0', '#14b8a6', '#f97316', '#3b82f6', '#ef4444'\]\}/g,
  "colors={['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0']}"
)

fs.writeFileSync(file, content)
JS_EOF
