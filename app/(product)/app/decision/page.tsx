import { Suspense } from "react";
import { Container, Stack, Skeleton } from "@/components/ui/primitives";
import { DecisionScreen } from "./DecisionScreen";

export default function DecisionPage() {
  return (
    <Suspense fallback={<DecisionFallback />}>
      <DecisionScreen />
    </Suspense>
  );
}

function DecisionFallback() {
  return (
    <Container className="py-6">
      <Stack gap={6}>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </Stack>
    </Container>
  );
}
