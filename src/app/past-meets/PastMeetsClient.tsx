"use client"

import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { Copy, Check, Printer } from "lucide-react"
import { Streamdown } from "streamdown"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@/components/ui/multi-accordion"
import SuggestiveSearch from "@/components/ui/suggestive-search"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

type Meeting = {
  id: string
  title: string
  content: string
  createdAt: string
}

const PAGE_SIZE = 5

export default function PastMeetsClient({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handlePrint = (meet: Meeting) => {
    const win = window.open('', '_blank')
    if (!win) return
    const el = document.getElementById(`meet-content-${meet.id}`)
    const htmlContent = el ? el.innerHTML : meet.content

    win.document.write(`
      <html>
        <head>
          <title>${meet.title}</title>
          <style>
            @media print {
              @page { margin: 20mm; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.75rem; margin-top: 1.5rem; }
            h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; margin-top: 1rem; }
            p { margin-bottom: 1rem; }
            ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
            ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
            li { margin-bottom: 0.25rem; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${meet.title}</h1>
          <p style="color: #666; margin-bottom: 2rem;"><em>${format(new Date(meet.createdAt), 'MMM d, yyyy - h:mm a')}</em></p>
          <div class="content">
            ${htmlContent}
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 250)
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const queryTokens = normalizedQuery.length > 0 ? normalizedQuery.split(/\s+/) : []

  const filteredMeetings = useMemo(() => {
    if (queryTokens.length === 0) return initialMeetings

    return initialMeetings.filter(meet => {
      const date = new Date(meet.createdAt)
      const formattedDate = format(date, "MMM d, yyyy - h:mm a").toLowerCase()
      const isoDate = format(date, "yyyy-MM-dd").toLowerCase()
      const slashDate = format(date, "dd/MM/yyyy").toLowerCase()
      const compactDate = format(date, "yyyyMMdd").toLowerCase()
      const searchIndex = `${meet.title} ${meet.content} ${formattedDate} ${isoDate} ${slashDate} ${compactDate}`.toLowerCase()

      return queryTokens.every((token) => searchIndex.includes(token))
    })
  }, [initialMeetings, queryTokens])

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)

  const paginatedMeetings = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE
    return filteredMeetings.slice(start, start + PAGE_SIZE)
  }, [filteredMeetings, activePage])

  const visiblePages = useMemo(() => {
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    let start = Math.max(1, activePage - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [activePage, totalPages])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  const hasNoMeetings = initialMeetings.length === 0
  const hasNoMatches = filteredMeetings.length === 0 && !hasNoMeetings

  return (
    <div className="w-full flex justify-center flex-col items-center">
      <div className="relative mb-8 w-full max-w-2xl">
        <SuggestiveSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              clearSearch()
            }
          }}
          suggestions={[
            "Search by title",
            "Search by content",
            "Search by date",
            "Try: weekly sync",
          ]}
          effect="typewriter"
          showLeading={false}
          showTrailing={!searchQuery}
          className="w-full bg-background/50 border-border px-4 py-3 rounded-2xl md:text-lg focus-within:border-indigo-500/60"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      <div className="w-full flex flex-col gap-6 items-center">
        {hasNoMeetings ? (
          <Card className="w-full max-w-4xl bg-background/60 border-border text-center">
            <CardContent className="py-14 px-6 space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">This is your first meet.</h2>
              <p className="text-muted-foreground">You do not have any saved meetings yet. Start your first meeting now.</p>
              <Button asChild className="rounded-full px-6">
                <Link href="/record">Start First Meet</Link>
              </Button>
            </CardContent>
          </Card>
        ) : hasNoMatches ? (
          <Card className="w-full max-w-4xl bg-background/60 border-border text-center">
            <CardContent className="py-12 px-6 space-y-2">
              <p className="text-lg text-foreground">No meetings match your search.</p>
              <p className="text-sm text-muted-foreground">Try a different title, keyword, or date.</p>
            </CardContent>
          </Card>
        ) : (
                    <div className="w-full max-w-4xl">
            <Accordion multiple>
              {paginatedMeetings.map((meet, idx) => {
                const meetingNumber = (activePage - 1) * PAGE_SIZE + idx + 1

                return (
                  <AccordionItem key={meet.id} value={meet.id}>
                    <AccordionHeader className="bg-transparent hover:bg-background/20 transition-colors border-0">
                      <div className="flex items-start gap-4 flex-1 text-left w-full min-w-0 pr-4">
                        <span className="mt-0.5 text-sm md:text-base font-semibold text-indigo-500 min-w-6">
                          {meetingNumber}.
                        </span>

                        <div className="flex-1 min-w-0 pr-8" suppressHydrationWarning>
                          <p className="text-base md:text-lg font-semibold text-foreground line-clamp-2">
                            {meet.title}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                            {mounted ? format(new Date(meet.createdAt), 'MMM d, yyyy - h:mm a') : '...'}
                          </p>
                        </div>
                      </div>
                    </AccordionHeader>

                    <AccordionPanel className="border-t border-border/60 bg-transparent text-sm md:text-base leading-relaxed text-foreground [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-semibold break-words">
                      <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCopy(meet.id, meet.content); }}>
                          {copiedId === meet.id ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                          {copiedId === meet.id ? "Copied" : "Copy"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrint(meet); }}>
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                      </div>
                      <article
                        id={`meet-content-${meet.id}`}
                        data-lenis-prevent
                        data-lenis-prevent-wheel
                        className="max-h-[55vh] overflow-y-auto overscroll-contain touch-pan-y pr-1 md:pr-2 [scrollbar-width:thin]"
                      >
                        <Streamdown mode="static">{meet.content}</Streamdown>
                      </article>
                    </AccordionPanel>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        )}
      </div>

      {!hasNoMeetings && filteredMeetings.length > 0 && (
        <div className="w-full max-w-4xl mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {(activePage - 1) * PAGE_SIZE + 1}-{Math.min(activePage * PAGE_SIZE, filteredMeetings.length)} of {filteredMeetings.length}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
              disabled={activePage === 1}
            >
              Previous
            </Button>

            {visiblePages.map((page) => (
              <Button
                key={page}
                size="sm"
                variant={page === activePage ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.min(page, totalPages) + 1))}
              disabled={activePage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
