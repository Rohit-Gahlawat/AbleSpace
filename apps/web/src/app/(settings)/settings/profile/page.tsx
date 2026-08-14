"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  SettingsCard,
  SettingsHeading,
  SettingsRow,
  SettingsSection,
} from "@/components/settings-row";
import { useSession } from "@/components/session-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, clearToken } from "@/lib/api";
import type { User } from "@/lib/types";

export default function ProfileSettingsPage() {
  const { user, refresh } = useSession();
  const router = useRouter();

  const [leaving, setLeaving] = useState(false);

  async function commit(
    field: "name" | "title" | "username",
    input: HTMLInputElement,
  ) {
    const current = field === "title" ? (user.title ?? "") : user[field];
    const value = input.value.trim();
    if (value === current) return;

    try {
      await api<User>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      await refresh();
      toast.success("Profile updated");
    } catch (error) {
      input.value = current;
      toast.error(
        error instanceof Error ? error.message : "Could not update your profile",
      );
    }
  }

  async function leaveWorkspace() {
    setLeaving(true);
    try {
      await api<void>("/auth/leave-workspace", { method: "POST" });
      clearToken();
      router.replace("/login");
    } catch (error) {
      setLeaving(false);
      toast.error(
        error instanceof Error ? error.message : "Could not leave the workspace",
      );
    }
  }

  return (
    <>
      <SettingsHeading>Profile</SettingsHeading>

      <SettingsCard>
        <SettingsRow label="Profile picture">
          <UserAvatar user={user} className="size-9" />
        </SettingsRow>

        <SettingsRow label="Email">
          <span className="text-muted-foreground text-sm">{user.email}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit email"
            title="Guest accounts cannot change their email"
            disabled
          >
            <Pencil />
          </Button>
        </SettingsRow>

        <SettingsRow label="Full name">
          <Input
            key={user.name}
            defaultValue={user.name}
            onBlur={(event) => void commit("name", event.target)}
            className="h-8 w-full sm:w-52"
            aria-label="Full name"
          />
        </SettingsRow>

        <SettingsRow label="Title" description="Your job title or role">
          <Input
            key={user.title ?? ""}
            defaultValue={user.title ?? ""}
            onBlur={(event) => void commit("title", event.target)}
            className="h-8 w-full sm:w-52"
            aria-label="Title"
          />
        </SettingsRow>

        <SettingsRow
          label="Username"
          description="One word, like a nickname or first name"
        >
          <Input
            key={user.username}
            defaultValue={user.username}
            onBlur={(event) => void commit("username", event.target)}
            className="h-8 w-full sm:w-52"
            aria-label="Username"
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsSection>Workspace access</SettingsSection>

      <SettingsCard>
        <SettingsRow label="Remove yourself from the workspace">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
              >
                Leave Workspace
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave this workspace?</DialogTitle>
                <DialogDescription>
                  You will lose access to its tasks and projects and be signed
                  out. A guest workspace cannot be rejoined afterwards.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={leaving}
                  onClick={() => void leaveWorkspace()}
                >
                  {leaving ? "Leaving…" : "Leave Workspace"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SettingsRow>
      </SettingsCard>
    </>
  );
}
