import React, { useState } from "react";
import { Plus, X, Check } from "lucide-react";

// Reusable tag picker with an "Other" option that lets users type a custom value.
// value: string[] ; onChange(newArray)
export default function TagPicker({ options = [], value = [], onChange, allowOther = true, size = "md" }) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [text, setText] = useState("");

  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const addCustom = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
    setOtherOpen(false);
  };

  const padCls = size === "sm"
    ? "px-3 py-1.5 rounded-lg text-xs"
    : "px-4 py-2 rounded-xl text-sm";
  const selectedCls = "bg-navy text-white";
  const unselectedCls = "bg-muted text-muted-foreground hover:bg-muted/80";

  const customs = value.filter((v) => !options.includes(v));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`font-medium transition-all ${padCls} ${value.includes(o) ? selectedCls : unselectedCls}`}
          >
            {o}
          </button>
        ))}
        {allowOther && !otherOpen && (
          <button
            type="button"
            onClick={() => setOtherOpen(true)}
            className={`font-medium transition-all border border-dashed border-border ${padCls} text-muted-foreground hover:text-navy hover:border-navy/40`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Other
          </button>
        )}
      </div>

      {allowOther && otherOpen && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Type your own, then Add"
            className="flex-1 min-w-[160px] h-9 rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button type="button" onClick={addCustom} className="px-3 py-2 rounded-xl bg-navy text-white text-sm font-medium">
            <Check className="w-4 h-4 inline mr-1" /> Add
          </button>
          <button type="button" onClick={() => { setOtherOpen(false); setText(""); }} className="px-3 py-2 rounded-xl text-sm text-muted-foreground">
            Cancel
          </button>
        </div>
      )}

      {customs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {customs.map((c) => (
            <span key={c} className={`inline-flex items-center gap-1 font-medium ${padCls} bg-navy text-white`}>
              {c}
              <button type="button" onClick={() => toggle(c)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
