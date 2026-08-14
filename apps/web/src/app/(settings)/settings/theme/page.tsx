"use client";

import { Check, Moon, Sun } from "lucide-react";

import { SettingsCard, SettingsHeading } from "@/components/settings-row";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

const OPTIONS: {
  value: Theme;
  label: string;
  icon: typeof Sun;
  hint: string;
}[] = [
  { value: "light", label: "Light", icon: Sun, hint: "The default appearance" },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    hint: "Easier on the eyes in low light",
  },
];

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SettingsHeading>Theme</SettingsHeading>

      <SettingsCard>
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={isActive}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                "border-b last:border-b-0",
                "hover:bg-accent/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              <Icon className="text-muted-foreground size-4 shrink-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  {option.hint}
                </span>
              </span>
              {isActive && <Check className="ml-auto size-4 shrink-0" />}
            </button>
          );
        })}
      </SettingsCard>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <ThemePreview
            key={option.value}
            value={option.value}
            active={theme === option.value}
            onSelect={() => setTheme(option.value)}
          />
        ))}
      </div>
    </>
  );
}

function ThemePreview({
  value,
  active,
  onSelect,
}: {
  value: Theme;
  active: boolean;
  onSelect: () => void;
}) {
  const isDark = value === "dark";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Use ${value} theme`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors",
        active ? "ring-ring ring-2" : "hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "flex h-20 flex-col gap-1.5 rounded-md border p-2",
          isDark ? "bg-neutral-900" : "bg-white",
        )}
      >
        <span
          className={cn(
            "h-2 w-12 rounded-full",
            isDark ? "bg-neutral-700" : "bg-neutral-200",
          )}
        />
        <span
          className={cn(
            "h-2 w-20 rounded-full",
            isDark ? "bg-neutral-800" : "bg-neutral-100",
          )}
        />
        <span
          className={cn(
            "mt-auto h-4 w-14 rounded",
            isDark ? "bg-neutral-100" : "bg-neutral-900",
          )}
        />
      </span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </button>
  );
}
