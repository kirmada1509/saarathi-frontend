import React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

// Container Primitive
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  fluid?: boolean;
}
export function Container({ className, fluid = false, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full px-4 mx-auto",
        fluid ? "max-w-full" : "max-w-7xl",
        className
      )}
      {...props}
    />
  );
}

// Stack Primitive (Flexbox layout helper)
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

const gapMap = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  12: "gap-12",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export function Stack({
  className,
  direction = "col",
  gap = 4,
  align,
  justify,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        className
      )}
      {...props}
    />
  );
}

// Text Primitive
export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "display" | "heading" | "body" | "subtext" | "mono";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
}

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

const weightMap = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export function Text({
  className,
  variant = "body",
  size = "base",
  weight = "normal",
  as: Component = "span",
  ...props
}: TextProps) {
  const variantClass = cn(
    variant === "display" && "font-display text-text-primary",
    variant === "heading" && "font-display text-text-primary font-semibold",
    variant === "body" && "font-sans text-text-primary",
    variant === "subtext" && "font-sans text-text-secondary text-sm",
    variant === "mono" && "font-mono text-text-primary tracking-tight"
  );
  return (
    <Component
      className={cn(
        variantClass,
        sizeMap[size],
        weightMap[weight],
        className
      )}
      {...props}
    />
  );
}

// Card Primitive
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
}
export function Card({ className, raised = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border border-border-default rounded-lg p-5",
        raised ? "bg-bg-surface-raised shadow-md" : "bg-bg-surface",
        className
      )}
      {...props}
    />
  );
}

// Badge Primitive
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "destructive" | "warning";
}
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium border",
        variant === "default" && "bg-bg-surface-raised border-border-default text-text-primary",
        variant === "success" && "bg-signal-positive/10 border-signal-positive/30 text-signal-positive",
        variant === "destructive" && "bg-signal-negative/10 border-signal-negative/30 text-signal-negative",
        variant === "warning" && "bg-accent/10 border-accent/30 text-accent",
        className
      )}
      {...props}
    />
  );
}

// Skeleton Loading
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-bg-surface-raised rounded-md", className)}
      {...props}
    />
  );
}

// Empty State Primitive
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}
export function EmptyState({ className, title, description, icon, children, ...props }: EmptyStateProps) {
  return (
    <Stack
      align="center"
      justify="center"
      className={cn("p-10 border border-dashed border-border-default rounded-lg bg-bg-surface/50 text-center", className)}
      {...props}
    >
      {icon && <div className="mb-3 text-text-secondary">{icon}</div>}
      <Text variant="heading" size="lg" className="mb-1">{title}</Text>
      {description && <Text variant="subtext">{description}</Text>}
      {children}
    </Stack>
  );
}

// Clickable Primitive (Button wrapper)
export type ClickableProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function Clickable({ className, ...props }: ClickableProps) {
  return <button className={className} {...props} />;
}

// Section Primitive (marketing / long-form scroll sections)
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "sm" | "md" | "lg" | "xl";
}

const sectionSpacingMap = {
  sm: "py-8 md:py-12",
  md: "py-12 md:py-20",
  lg: "py-20 md:py-28",
  xl: "py-28 md:py-36",
};

export function Section({ className, spacing = "lg", ...props }: SectionProps) {
  return (
    <section
      className={cn("w-full", sectionSpacingMap[spacing], className)}
      {...props}
    />
  );
}

// Grid Primitive
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
}

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6",
};

export function Grid({ className, cols = 3, gap = 4, ...props }: GridProps) {
  return (
    <div
      className={cn("grid", colsMap[cols], gapMap[gap], className)}
      {...props}
    />
  );
}

// Prose Primitive (long-form article typography)
export type ProseProps = React.HTMLAttributes<HTMLDivElement>;
export function Prose({ className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        "max-w-prose text-text-primary/90 leading-relaxed",
        "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3",
        "[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-2",
        "[&_p]:mb-4 [&_p]:text-text-primary/85",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1",
        "[&_strong]:font-semibold [&_strong]:text-text-primary",
        className
      )}
      {...props}
    />
  );
}

// GradientMotif Primitive — the single restrained gradient accent, used sparingly
export interface GradientMotifProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "hero" | "corner";
}
export function GradientMotif({ className, variant = "hero", ...props }: GradientMotifProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 select-none",
        variant === "hero" &&
          "inset-x-0 top-0 h-130 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklch,var(--accent),transparent_78%),transparent)]",
        variant === "corner" &&
          "-top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent),transparent_75%),transparent_70%)] blur-2xl",
        className
      )}
      {...props}
    />
  );
}

// Field Primitive (labeled form field wrapper)
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
}
export function Field({ className, label, htmlFor, hint, error, children, ...props }: FieldProps) {
  return (
    <Stack gap={2} className={cn("w-full", className)} {...props}>
      <label htmlFor={htmlFor} className="font-sans text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {error ? (
        <Text variant="subtext" size="xs" className="text-signal-negative">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="subtext" size="xs">
          {hint}
        </Text>
      ) : null}
    </Stack>
  );
}

// NavLink Primitive (active-state-aware navigation link)
export interface NavLinkProps extends React.ComponentProps<typeof NextLink> {
  active?: boolean;
}
export function NavLink({ className, active = false, ...props }: NavLinkProps) {
  return (
    <NextLink
      data-active={active || undefined}
      className={cn(
        "font-sans text-sm font-medium text-text-secondary transition-colors hover:text-text-primary",
        "data-active:text-text-primary data-active:font-semibold",
        className
      )}
      {...props}
    />
  );
}
