"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatNumber, type Skill } from "@/lib/skills";

interface MethodSelectProps {
  skill: Skill;
  /** current XP/hr override for this skill ("" = use the average default) */
  rate: number | "";
  /** "" => Average (default); otherwise a method name from skill.methods */
  onPick: (methodName: string) => void;
}

/**
 * Themed replacement for a native <select> of training methods. Native option
 * lists can't be styled (iOS draws its own white system popover), so this is a
 * button + absolutely-positioned list using the OSRS theme classes. Closes on
 * outside-click / Escape; arrow keys + Enter for keyboard use.
 */
export default function MethodSelect({ skill, rate, onPick }: MethodSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const options = [
    { value: "", label: "Average (default)" },
    ...skill.methods.map((m) => ({
      value: m.name,
      label: `${m.name} · ${formatNumber(m.xpHr)}/hr`,
    })),
  ];

  // Derive the current selection from the rate. A rate that matches no method
  // is a hand-typed "Custom" value (shown on the button, not in the list).
  const selectedValue =
    rate === "" ? "" : (skill.methods.find((m) => m.xpHr === rate)?.name ?? null);
  const isCustom = selectedValue === null;
  const buttonLabel = isCustom
    ? `Custom · ${formatNumber(rate as number)}/hr`
    : (options.find((o) => o.value === selectedValue)?.label ?? "Average (default)");

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  function openMenu() {
    const idx = options.findIndex((o) => o.value === (selectedValue ?? ""));
    setActiveIndex(idx < 0 ? 0 : idx);
    setOpen(true);
  }

  function choose(value: string) {
    onPick(value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openMenu();
        else choose(options[activeIndex].value);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        className="rs-input flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-sm"
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        aria-label={`${skill.name} training method`}
        aria-activedescendant={open ? `${listId}-opt-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">{buttonLabel}</span>
        <span aria-hidden="true" className="shrink-0 text-[var(--rs-text-dim)]">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${skill.name} training methods`}
          className="rs-panel-dark absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto py-1"
        >
          {options.map((opt, i) => {
            const selected = opt.value === (selectedValue ?? "");
            const active = i === activeIndex;
            return (
              <li
                key={opt.value || "__avg__"}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={selected}
                className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm"
                style={{
                  backgroundColor: active ? "#4a3d2c" : "transparent",
                  color: selected ? "var(--rs-yellow)" : "var(--rs-text-dim)",
                }}
                onMouseEnter={() => setActiveIndex(i)}
                // pointerdown (not click) so it fires before the outside-click handler
                onPointerDown={(e) => {
                  e.preventDefault();
                  choose(opt.value);
                }}
              >
                <span className="w-3 shrink-0" aria-hidden="true">
                  {selected ? "✓" : ""}
                </span>
                <span className="truncate">{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
