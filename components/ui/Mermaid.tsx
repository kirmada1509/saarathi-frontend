"use client";

import * as React from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { Clickable, Stack } from "@/components/ui/primitives";

export function Mermaid({ chart, interactive = false }: { chart: string; interactive?: boolean }) {
  const [svg, setSvg] = React.useState<string>("");
  const elementId = React.useId().replace(/:/g, "m");
  const { resolvedTheme } = useTheme();

  // Interactive Zoom/Pan State
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    let active = true;
    async function renderChart() {
      try {
        const isDark = resolvedTheme === "dark";

        // Re-initialize mermaid dynamically based on the current theme mode
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          themeVariables: isDark
            ? {
                primaryColor: "#0ea5e9", // sky-500
                primaryTextColor: "#f8fafc", // slate-50
                primaryBorderColor: "#38bdf8", // sky-400
                lineColor: "#64748b", // slate-500
                secondaryColor: "#1e293b", // slate-800
                tertiaryColor: "#0f172a", // slate-900
                mainBkg: "#0f172a",
                nodeBorder: "#334155",
                actorBorder: "#38bdf8",
                actorBkg: "#0f172a",
                actorTextColor: "#f8fafc",
                signalColor: "#38bdf8",
                signalLineColor: "#64748b",
                labelBoxBkgColor: "#1e293b",
                labelBoxBorderColor: "#334155",
                labelTextColor: "#f8fafc",
                loopTextColor: "#f8fafc",
                noteBkgColor: "#1e293b",
                noteBorderColor: "#0ea5e9",
                noteTextColor: "#f8fafc",
              }
            : {
                primaryColor: "#0284c7", // sky-600
                primaryTextColor: "#0f172a", // slate-900
                primaryBorderColor: "#0ea5e9", // sky-500
                lineColor: "#475569", // slate-600
                secondaryColor: "#f1f5f9", // slate-100
                tertiaryColor: "#f8fafc", // slate-50
                mainBkg: "#ffffff",
                nodeBorder: "#cbd5e1", // slate-300
                actorBorder: "#0ea5e9",
                actorBkg: "#ffffff",
                actorTextColor: "#0f172a",
                signalColor: "#0284c7",
                signalLineColor: "#475569",
                labelBoxBkgColor: "#f1f5f9",
                labelBoxBorderColor: "#cbd5e1",
                labelTextColor: "#0f172a",
                loopTextColor: "#0f172a",
                noteBkgColor: "#f8fafc",
                noteBorderColor: "#0ea5e9",
                noteTextColor: "#0f172a",
              },
        });

        // Clear any previous render caching and generate new SVG
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${elementId}`, chart);
        if (active) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
      }
    }
    renderChart();
    return () => {
      active = false;
    };
  }, [chart, elementId, resolvedTheme]);

  // Intercept and handle mouse wheel zooming on the target wrapper
  React.useEffect(() => {
    if (!interactive) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const zoomSpeed = 0.05;
      setScale((prevScale) => {
        // Delta values vary, normalise to zoom steps
        const direction = e.deltaY < 0 ? 1 : -1;
        const nextScale = prevScale + direction * zoomSpeed;
        return Math.max(0.4, Math.min(5, nextScale));
      });
    }

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      wrapper.removeEventListener("wheel", handleWheel);
    };
  }, [interactive]);

  // Panning event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!svg) {
    return (
      <div className="bg-bg-surface-raised p-8 rounded-lg border border-border-default/40 text-center animate-pulse text-xs text-text-secondary font-mono">
        Generating flowchart...
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden border border-border-default rounded-lg bg-bg-surface select-none">
      <div
        ref={wrapperRef}
        onMouseDown={interactive ? handleMouseDown : undefined}
        onMouseMove={interactive ? handleMouseMove : undefined}
        onMouseUp={interactive ? handleMouseUp : undefined}
        onMouseLeave={interactive ? handleMouseUp : undefined}
        className={`w-full overflow-hidden p-6 flex justify-center ${
          interactive ? "cursor-grab active:cursor-grabbing min-h-120 items-center" : ""
        }`}
      >
        <div
          style={
            interactive
              ? {
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                }
              : undefined
          }
          className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:text-text-primary"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {interactive && (
        <Stack
          direction="row"
          gap={2}
          className="absolute bottom-4 right-4 bg-bg-surface-raised/90 p-2 rounded-lg border border-border-default shadow-md z-10"
        >
          <Clickable
            onClick={() => setScale((s) => Math.min(5, s + 0.25))}
            className="w-8 h-8 rounded hover:bg-bg-surface flex items-center justify-center text-text-primary hover:text-accent font-bold text-sm"
            title="Zoom In"
          >
            +
          </Clickable>
          <Clickable
            onClick={() => setScale((s) => Math.max(0.4, s - 0.25))}
            className="w-8 h-8 rounded hover:bg-bg-surface flex items-center justify-center text-text-primary hover:text-accent font-bold text-sm"
            title="Zoom Out"
          >
            -
          </Clickable>
          <Clickable
            onClick={handleReset}
            className="px-3 h-8 rounded hover:bg-bg-surface flex items-center justify-center text-text-primary hover:text-accent text-xs font-semibold"
            title="Reset View"
          >
            Reset
          </Clickable>
        </Stack>
      )}
    </div>
  );
}
