"use client";

import { useState } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

// Keyboard-accessible accordion. Native <button> headers handle Enter/Space;
// aria-expanded/controls + a labelled region keep it screen-reader friendly.
// One open at a time; click an open item to collapse it.
export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="accordion">
      {items.map((it) => {
        const open = openId === it.id;
        return (
          <div className="accordion-item" key={it.id}>
            <h3 className="accordion-h">
              <button
                type="button"
                className="accordion-header"
                id={`acc-${it.id}`}
                aria-expanded={open}
                aria-controls={`panel-${it.id}`}
                onClick={() => setOpenId(open ? null : it.id)}
              >
                <span className="accordion-title">{it.title}</span>
                <span className="accordion-icon" aria-hidden="true">
                  {open ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div
              className="accordion-panel"
              id={`panel-${it.id}`}
              role="region"
              aria-labelledby={`acc-${it.id}`}
              hidden={!open}
            >
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
