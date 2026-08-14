"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Palette, Search, Sun, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/settings/profile", label: "Profile", icon: UserRound },
  { href: "/settings/theme", label: "Theme", icon: Sun },
  { href: "/settings/color", label: "Color", icon: Palette },
] as const;

export function SettingsSidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const items = NAV.filter((item) => item.label.toLowerCase().includes(term));

  return (
    <aside
      className={cn(
        "bg-sidebar flex shrink-0 flex-col gap-3 p-3",
        "w-full border-b md:w-64 md:border-r md:border-b-0",
      )}
    >
      <Link
        href="/tasks"
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium",
          "hover:bg-sidebar-accent transition-colors",
        )}
      >
        <ArrowLeft className="size-4" />
        Back to app
      </Link>

      <div className="relative hidden md:block">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="h-8 pl-8"
          aria-label="Search settings"
        />
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        {items.length === 0 && (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">
            No settings match &ldquo;{query}&rdquo;.
          </p>
        )}
      </nav>
    </aside>
  );
}
