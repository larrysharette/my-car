"use client"

import { useState, useTransition } from "react"
import { BookmarkSimple, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { addUserBookmark, removeUserBookmark } from "~/server/actions/service-manual"

type Bookmark = {
  id: string
  title: string
  pageNumber: number
  category?: string | null
}

export function ManualBookmarksPanel({
  suggestedBookmarks,
  userBookmarks,
  manualId,
  currentPage,
  onJumpToPage,
  onUserBookmarksChange,
  embedded = false,
  className,
}: {
  suggestedBookmarks: Bookmark[]
  userBookmarks: Bookmark[]
  manualId: string
  currentPage: number
  onJumpToPage: (page: number) => void
  onUserBookmarksChange: (bookmarks: Bookmark[]) => void
  embedded?: boolean
  className?: string
}) {
  const [title, setTitle] = useState("")
  const [pending, startTransition] = useTransition()

  const groupedSuggested = suggestedBookmarks.reduce<Record<string, Bookmark[]>>(
    (acc, bookmark) => {
      const key = bookmark.category?.trim() || "Suggested"
      acc[key] = acc[key] ?? []
      acc[key].push(bookmark)
      return acc
    },
    {}
  )

  function saveBookmark() {
    const bookmarkTitle = title.trim() || `Page ${currentPage}`
    startTransition(async () => {
      const result = await addUserBookmark({
        manualId,
        title: bookmarkTitle,
        pageNumber: currentPage,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onUserBookmarksChange([
        {
          id: result.data.id,
          title: result.data.title,
          pageNumber: result.data.pageNumber,
        },
        ...userBookmarks,
      ])
      setTitle("")
      toast.success("Bookmark saved")
    })
  }

  function deleteBookmark(bookmarkId: string) {
    startTransition(async () => {
      const result = await removeUserBookmark(bookmarkId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onUserBookmarksChange(userBookmarks.filter((bookmark) => bookmark.id !== bookmarkId))
      toast.success("Bookmark removed")
    })
  }

  return (
    <div
      className={cn(
        embedded ? "space-y-4 p-3" : "space-y-4 rounded-lg border bg-card p-3",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium">My bookmarks</p>
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Page ${currentPage} label (optional)`}
            className="h-11"
          />
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0"
            disabled={pending}
            onClick={saveBookmark}
            aria-label="Save bookmark"
          >
            <BookmarkSimple className="size-4" />
          </Button>
        </div>
        {userBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personal bookmarks yet.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {userBookmarks.map((bookmark) => (
              <li key={bookmark.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onJumpToPage(bookmark.pageNumber)}
                  className="hover:bg-accent min-h-11 flex-1 touch-manipulation rounded-md px-2 py-1.5 text-left text-sm"
                >
                  <span className="font-medium">{bookmark.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    Page {bookmark.pageNumber}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => deleteBookmark(bookmark.id)}
                  aria-label="Delete bookmark"
                >
                  <Trash className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Suggested</p>
        {suggestedBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggested bookmarks for this manual.</p>
        ) : (
          <div className="max-h-[40dvh] space-y-3 overflow-y-auto md:max-h-56">
            {Object.entries(groupedSuggested).map(([category, bookmarks]) => (
              <div key={category} className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {category}
                </p>
                <ul className="space-y-1">
                  {bookmarks.map((bookmark) => (
                    <li key={bookmark.id}>
                      <button
                        type="button"
                        onClick={() => onJumpToPage(bookmark.pageNumber)}
                        className="hover:bg-accent min-h-11 w-full touch-manipulation rounded-md px-2 py-1.5 text-left text-sm"
                      >
                        <span className="font-medium">{bookmark.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          Page {bookmark.pageNumber}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
