"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, clearToken, getToken } from "@/lib/api";
import type { User, Workspace } from "@/lib/types";

type SessionContextValue = {
  user: User;
  workspace: Workspace;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type Profile = User & { workspace: Workspace | null };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out">(
    "loading",
  );

  const load = useCallback(async () => {
    await Promise.resolve();

    if (!getToken()) {
      setStatus("signed-out");
      return;
    }

    try {
      setProfile(await api<Profile>("/auth/me"));
      setStatus("ready");
    } catch {
      clearToken();
      setStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "ready" || !profile?.workspace) {
    return <div className="flex flex-1" aria-busy="true" />;
  }

  return (
    <SessionContext
      value={{
        user: profile,
        workspace: profile.workspace,
        refresh: load,
      }}
    >
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return context;
}
