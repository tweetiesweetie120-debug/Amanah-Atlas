import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// A single-value select that always exposes an "Other…" option for a custom typed value.
export default function OtherSelect({ options = [], value, onChange, placeholder = "Select…" }) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [text, setText] = useState("");

  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const isCustom = !!value && !norm.some((o) => o.value === value);

  return (
    <div>
      <Select
        value={isCustom ? "__custom__" : value || ""}
        onValueChange={(v) => {
          if (v === "__other__") setOtherOpen(true);
          else onChange(v);
        }}
      >
        <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {norm.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          {isCustom && <SelectItem value="__custom__" disabled>{value}</SelectItem>}
          <SelectItem value="__other__">Other…</SelectItem>
        </SelectContent>
      </Select>
      {otherOpen && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (text.trim()) { onChange(text.trim()); setText(""); setOtherOpen(false); } } }}
            placeholder="Type your own, then Add"
            className="flex-1 min-w-[160px] h-9 rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button size="sm" type="button" className="rounded-xl" onClick={() => { if (text.trim()) { onChange(text.trim()); setText(""); setOtherOpen(false); } }}>Add</Button>
          <Button size="sm" type="button" variant="ghost" className="rounded-xl" onClick={() => { setOtherOpen(false); setText(""); }}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
