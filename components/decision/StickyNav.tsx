"use client";

import React from "react";
import { Stack, Text, Clickable } from "@/components/ui/primitives";
import {
  Terminal, Layers, CheckCircle2, Database,
  FileCode, Route, ArrowUpRight
} from "lucide-react";

export type SectionId = "summary" | "journey" | "ai-center" | "alternatives" | "technical";

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: "journey", label: "Journey", icon: <Route className="w-3.5 h-3.5" /> },
  { id: "ai-center", label: "AI Decision", icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "alternatives", label: "Alternatives", icon: <Database className="w-3.5 h-3.5" /> },
  { id: "technical", label: "Technical", icon: <FileCode className="w-3.5 h-3.5" /> },
];

interface StickyNavProps {
  activeSection?: SectionId;
  onNavigate: (section: SectionId) => void;
  engineSynced?: boolean;
}

export function StickyNav({ activeSection, onNavigate, engineSynced = true }: StickyNavProps) {
  return (
    <Stack
      direction="row"
      align="center"
      className="sticky bottom-0 left-0 right-0 z-30 h-14 bg-bg-surface/95 border-t border-border-default px-4 sm:px-6 justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md"
      gap={0}
    >
      {/* Left: Saarathi label */}
      <Stack direction="row" align="center" gap={2} className="min-w-[130px] border-r border-border-default pr-4 mr-4 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-accent" />
        <Text variant="mono" size="xs" weight="bold" className="text-accent uppercase tracking-wider">
          Saarathi
        </Text>
      </Stack>

      {/* Center: section navigation */}
      <Stack
        direction="row"
        align="center"
        gap={1}
        className="flex-1 justify-center overflow-x-auto py-1 scrollbar-none"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <Clickable
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap focus:outline-none ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-raised border border-transparent"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
              {isActive && <ArrowUpRight className="w-3 h-3 opacity-60" />}
            </Clickable>
          );
        })}
      </Stack>

      {/* Right: engine status */}
      <Stack direction="row" align="center" gap={2} className="min-w-[130px] border-l border-border-default pl-4 ml-4 justify-end shrink-0">
        <span className={`w-2 h-2 rounded-full ${engineSynced ? "bg-signal-positive" : "bg-accent animate-pulse"}`} />
        <Text variant="mono" size="xs" className="text-text-secondary font-medium">
          {engineSynced ? "Engine synced" : "Processing…"}
        </Text>
      </Stack>
    </Stack>
  );
}
