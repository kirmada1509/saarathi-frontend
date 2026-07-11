import { TopNav } from "@/components/nav/TopNav";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { Stack } from "@/components/ui/primitives";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack className="min-h-screen bg-bg-base text-text-primary">
      <TopNav />
      <Stack className="flex-1">{children}</Stack>
      <CommandPalette />
    </Stack>
  );
}
