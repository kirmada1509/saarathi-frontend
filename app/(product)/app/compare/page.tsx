"use client";

import { Container, Stack, Text, Grid } from "@/components/ui/primitives";
import { CompareColumn } from "@/components/compare/CompareColumn";
import { useUIStore } from "@/lib/store";

export default function ComparePage() {
  const compareSelection = useUIStore((s) => s.compareSelection);
  const setCompareSelection = useUIStore((s) => s.setCompareSelection);

  return (
    <Container className="py-10">
      <Stack gap={6}>
        <Stack gap={2}>
          <Text variant="display" size="3xl" weight="semibold">
            Compare travelers
          </Text>
          <Text variant="body" size="base" className="text-text-secondary">
            Two traveler profiles, side by side — same benchmark request pattern,
            different inferred weights and verdicts.
          </Text>
        </Stack>

        <Grid cols={2} gap={6}>
          <CompareColumn userId={compareSelection[0]} onSelect={(id) => setCompareSelection(0, id)} />
          <CompareColumn userId={compareSelection[1]} onSelect={(id) => setCompareSelection(1, id)} />
        </Grid>
      </Stack>
    </Container>
  );
}
