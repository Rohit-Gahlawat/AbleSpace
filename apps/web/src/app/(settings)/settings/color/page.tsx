"use client";

import { Check } from "lucide-react";

import { SettingsCard, SettingsHeading } from "@/components/settings-row";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { ACCENTS, ACCENT_LABEL, ACCENT_SWATCH } from "@/lib/theme";

export default function ColorSettingsPage() {
  const { accent, setAccent } = useTheme();

  return (
    <>
      <SettingsHeading>Color</SettingsHeading>

      <p className="text-muted-foreground mb-4 text-sm">
        Sets the accent used for primary buttons, focus rings and selected
        states. It applies to both light and dark themes.
      </p>

      <SettingsCard>
        {ACCENTS.map((option) => {
          const swatch = ACCENT_SWATCH[option];
          const isActive = accent === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setAccent(option)}
              aria-pressed={isActive}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                "border-b last:border-b-0",
                "hover:bg-accent/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-4 shrink-0 rounded",
                  swatch ? "" : "border border-dashed",
                )}
                style={swatch ? { backgroundColor: swatch } : undefined}
              />
              <span className="text-sm font-medium">{ACCENT_LABEL[option]}</span>
              {isActive && <Check className="ml-auto size-4 shrink-0" />}
            </button>
          );
        })}
      </SettingsCard>
    </>
  );
}
