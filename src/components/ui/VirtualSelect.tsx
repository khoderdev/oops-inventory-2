import React, { useState, useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Item = {
  id: number | string;
  label: string;
};

type VirtualSelectProps = {
  items: Item[];
  value: Item | null;
  onChange: (item: Item) => void;
  placeholder?: string;
  height?: number;
  rowHeight?: number;
};

export const VirtualSelect: React.FC<VirtualSelectProps> = ({
  items,
  value,
  onChange,
  placeholder = "Select...",
  height = 200,
  rowHeight = 40,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items by search
  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const handleSelect = (item: Item) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-64">
      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={open ? search : value?.label || ""}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
        }}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border rounded px-3 py-2 bg-white cursor-pointer outline-none"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-1 w-full border rounded bg-white shadow-lg z-50">
          <div
            ref={parentRef}
            style={{
              height,
              overflow: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = filtered[virtualRow.index];
                return (
                  <div
                    key={item.id}
                    className="absolute left-0 right-0 px-3 flex items-center cursor-pointer hover:bg-gray-100"
                    style={{
                      top: 0,
                      height: rowHeight,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => handleSelect(item)}
                  >
                    {item.label}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  No results found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
