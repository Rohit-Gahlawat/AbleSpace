"use client";

import { useState } from "react";
import { MoreHorizontal, Paperclip, SendHorizontal, SmilePlus } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

export function TaskComments({
  taskId,
  comments,
  onChange,
}: {
  taskId: string;
  comments: Comment[];
  onChange: (comments: Comment[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(body: string, parentId?: string) {
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await api<Comment>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed, parentId }),
      });
      const refreshed = await api<Comment[]>(`/tasks/${taskId}/comments`);
      onChange(refreshed);
      setDraft("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not post the comment",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Comments</h2>

      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <UserAvatar user={comment.author} />
              <span className="text-sm font-medium">{comment.author.name}</span>
              <span className="text-muted-foreground text-xs">
                {relativeTime(comment.createdAt)}
              </span>
              <div className="ml-auto flex items-center">
                <Button variant="ghost" size="icon-sm" aria-label="React">
                  <SmilePlus />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Comment actions">
                  <MoreHorizontal />
                </Button>
              </div>
            </div>

            <p className="mt-1.5 text-sm leading-relaxed">{comment.body}</p>

            <ReplyBox
              disabled={sending}
              onSubmit={(value) => void submit(value, comment.id)}
            />

            {comment.replies.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2 border-l pl-3">
                {comment.replies.map((reply) => (
                  <li key={reply.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={reply.author} className="size-4" />
                      <span className="text-xs font-medium">
                        {reply.author.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {relativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{reply.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(draft);
        }}
        className="relative"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment..."
          className="pr-16"
          disabled={sending}
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Attach file"
          >
            <Paperclip />
          </Button>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Post comment"
            disabled={sending || !draft.trim()}
          >
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </section>
  );
}

function ReplyBox({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
        setValue("");
      }}
      className="relative mt-2"
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Leave a reply..."
        className="h-8 pr-16 text-sm"
        disabled={disabled}
      />
      <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach file">
          <Paperclip />
        </Button>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Post reply"
          disabled={disabled || !value.trim()}
        >
          <SendHorizontal />
        </Button>
      </div>
    </form>
  );
}

function relativeTime(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (seconds >= secondsInUnit) {
      return formatter.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}
