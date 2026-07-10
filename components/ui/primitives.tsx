import React from "react";
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
export function EmptyState({ className, title, description, icon, ...props }: EmptyStateProps) {
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
    </Stack>
  );
}

// Clickable Primitive (Button wrapper)
export type ClickableProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function Clickable({ className, ...props }: ClickableProps) {
  return <button className={className} {...props} />;
}
