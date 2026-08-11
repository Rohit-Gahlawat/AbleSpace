"use client";

import { Check, Moon, Palette, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS, ACCENT_LABEL, ACCENT_SWATCH, type Accent } from "@/lib/theme";

export function ThemeMenuItems() {
  const { theme, accent, setTheme, setAccent } = useTheme();

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sun />
          Change Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun />
              Light
              {theme === "light" && <Check className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon />
              Dark
              {theme === "dark" && <Check className="ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <AccentSwatch accent={accent} fallback={<Palette />} />
          Color Mode
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuLabel>Color Mode</DropdownMenuLabel>
            {ACCENTS.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => setAccent(option)}>
                <AccentSwatch accent={option} />
                {ACCENT_LABEL[option]}
                {accent === option && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </>
  );
}

function AccentSwatch({
  accent,
  fallback,
}: {
  accent: Accent;
  fallback?: React.ReactNode;
}) {
  const color = ACCENT_SWATCH[accent];

  if (!color) {
    return fallback ?? <span className="size-4" aria-hidden />;
  }

  return (
    <span
      className="size-4 rounded-[4px]"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
