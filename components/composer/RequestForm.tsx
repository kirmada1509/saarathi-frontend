"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card, Stack, Field } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TravelerSelect } from "./TravelerSelect";
import { useUsers } from "@/lib/queries";
import { buildDecisionQuery } from "@/lib/decision-params";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Search } from "lucide-react";

const schema = z.object({
  userId: z.string().min(1, "Pick a traveler"),
  requestText: z.string().min(10, "Describe the trip in a bit more detail"),
  destination: z
    .string()
    .min(3, "3-letter IATA code")
    .max(4, "3-letter IATA code"),
});

type FormValues = z.infer<typeof schema>;

export function RequestForm() {
  const router = useRouter();
  const { data: users = [], isLoading } = useUsers();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userId: "", requestText: "", destination: "" },
  });

  function handleUserChange(id: string) {
    setValue("userId", id, { shouldValidate: true });
    const seed = getBenchmarkQuery(id);
    if (seed.destination) setValue("destination", seed.destination, { shouldValidate: true });
    if (!getValues("requestText")) setValue("requestText", seed.requestText, { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    const query = buildDecisionQuery({
      userId: values.userId,
      requestText: values.requestText,
      destination: values.destination.toUpperCase(),
    });
    router.push(`/app/decision?${query}`);
  }

  return (
    <Card className="bg-bg-surface border-border-default">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={5}>
          <Field label="Traveler" error={errors.userId?.message}>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <TravelerSelect users={users} value={field.value} onValueChange={handleUserChange} />
              )}
            />
          </Field>

          <Field
            label="Destination airport"
            hint="3-letter IATA code, e.g. NRT"
            error={errors.destination?.message}
          >
            <Input {...register("destination")} placeholder="NRT" className="uppercase" maxLength={4} />
          </Field>

          <Field label="Describe your trip" error={errors.requestText?.message}>
            <Textarea
              {...register("requestText")}
              rows={4}
              placeholder="e.g. I hate connecting flights and prefer business class."
            />
          </Field>

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="bg-accent text-text-on-accent hover:bg-accent-hover w-full sm:w-auto"
          >
            <Search className="size-4" /> Run the decision engine
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
