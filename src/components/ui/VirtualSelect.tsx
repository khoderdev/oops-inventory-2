import React, { useState, useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Item = {
  id: number | string;
  label: string;
};

type VirtualSelectProps = {
  items: Item[];
  value: Item | null;
  onChange: (item: Item | null) => void;
  placeholder?: string;
  height?: number;
  rowHeight?: number;
};

export const VirtualSelect: React.FC<VirtualSelectProps> = ({ items, value, onChange, placeholder = "Select...", height = 200, rowHeight = 40 }) => {
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

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Filter items by search
  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter(item => item.label.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5
  });

  const handleSelect = (item: Item) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleDropdown = () => {
    setOpen(!open);
    setSearch("");
    if (!open && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-64">
      {/* Input field with icons */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value?.label || ""}
          onChange={e => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2 bg-white cursor-pointer outline-none pr-10"
        />

        {/* Clear button (X icon) */}
        {value && value.id && !open && (
          <button type="button" onClick={handleClear} className="absolute inset-y-0 right-6 flex items-center pr-1 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Dropdown toggle button (arrow) */}
        <button type="button" onClick={toggleDropdown} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600">
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-1 w-full border rounded bg-white shadow-lg z-50">
          <div
            ref={parentRef}
            style={{
              height,
              overflow: "auto",
              position: "relative"
            }}
          >
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                position: "relative"
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const item = filtered[virtualRow.index];
                return (
                  <div
                    key={item.id}
                    className={`absolute left-0 right-0 px-3 flex items-center cursor-pointer ${value?.id === item.id ? "bg-blue-100" : "hover:bg-gray-100"}`}
                    style={{
                      top: 0,
                      height: rowHeight,
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    onClick={() => handleSelect(item)}
                  >
                    {item.label}
                  </div>
                );
              })}

              {filtered.length === 0 && <div className="px-3 py-2 text-gray-400 text-sm">No results found</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
