import React from "react";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Input } from "./input";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer, elementScroll } from "@tanstack/react-virtual";

export interface SelectableItem {
  id: string | number;
  [key: string]: any;
}

export interface ItemRendererProps<T extends SelectableItem> {
  item: T;
  onSelect: (id: string, displayValue: string) => void;
}

export type SelectionWidth = "sm" | "md" | "lg" | "xl" | "full" | "auto";

export interface SelectionProps<T extends SelectableItem> {
  label: string;
  id?: string;
  errors?: Record<string, string | undefined>;
  errorField?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onInputFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInputBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  showDropdown?: boolean;
  items: T[];
  onItemSelect: (id: string, displayValue: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  loadingText?: string;
  placeholder?: string;
  noResultsText?: string;
  itemRenderer?: (props: ItemRendererProps<T>) => React.ReactNode;
  getDisplayValue: (item: T) => string;
  getItemId: (item: T) => string;
  className?: string;
  width?: SelectionWidth;
  maxDropdownHeightPx?: number; // Optional, defaults to 384 (tailwind max-h-96)
  estimateItemSizePx?: number; // Optional, defaults to 44
}

export function Selection<T extends SelectableItem>({ label, id, errors = {}, errorField = "id", searchTerm, onSearchChange, onInputFocus, onInputBlur, onKeyDown, isLoading = false, showDropdown: externalShowDropdown, items, onItemSelect, inputRef: externalInputRef, loadingText = "Loading...", placeholder = "Select...", noResultsText = "No results found", itemRenderer, getDisplayValue, getItemId, className = "", width = "md", maxDropdownHeightPx = 384, estimateItemSizePx = 44 }: SelectionProps<T>) {
  const inputId = id || `selection-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${inputId}-error`;
  const errorMessage = errorField && errors[errorField];
  const [internalShowDropdown, setInternalShowDropdown] = React.useState(false);
  const showDropdown = externalShowDropdown !== undefined ? externalShowDropdown : internalShowDropdown;
  const internalInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const listboxId = `${inputId}-listbox`;
  const pointerDownInDropdown = React.useRef(false);
  const isHoveringDropdown = React.useRef(false);

  const selectedItem = React.useMemo(() => {
    if (!searchTerm) return null;
    return items.find(item => getDisplayValue(item) === searchTerm);
  }, [items, searchTerm, getDisplayValue]);

  const defaultItemRenderer = (props: ItemRendererProps<T>) => {
    const { item, onSelect } = props;
    const displayValue = getDisplayValue(item);
    const itemId = getItemId(item);

    return (
      <button key={itemId} type="button" className="w-full px-3 py-1 text-left focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(itemId), displayValue)} onMouseDown={e => e.preventDefault()}>
        <div className="block -mx-3 px-3 font-medium leading-snug group-hover:bg-muted group-aria-selected:bg-muted">{displayValue}</div>
      </button>
    );
  };

  const widthClasses = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "w-full max-w-full",
    auto: "w-auto"
  };

  const widthClass = widthClasses[width];

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSearchChange("");
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setInternalShowDropdown(true);
    onInputFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Do not close on blur; only restore focus if blur was caused by interacting inside the dropdown (e.g., scrollbar)
    if (pointerDownInDropdown.current) {
      requestAnimationFrame(() => inputRef?.current?.focus());
    }
    onInputBlur?.(e);
  };

  // Close on outside pointerdown (mouse/touch) only
  React.useEffect(() => {
    const onDocPointerDown = (ev: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(ev.target as Node)) {
        if (externalShowDropdown === undefined) setInternalShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [externalShowDropdown]);

  const handleChevronClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (externalShowDropdown === undefined) {
      setInternalShowDropdown(!showDropdown);
    }
    if (!showDropdown) {
      inputRef?.current?.focus();
    } else {
      inputRef?.current?.blur();
    }
  };

  // Virtualizer for dropdown items
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateItemSizePx, // estimated row height in px
    overscan: 8,
    scrollToFn: elementScroll
  });

  // Keep highlighted index valid and visible
  React.useEffect(() => {
    if (!showDropdown || items.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    if (highlightedIndex < 0 || highlightedIndex >= items.length) {
      setHighlightedIndex(0);
    }
  }, [showDropdown, items.length]);

  React.useEffect(() => {
    if (showDropdown && highlightedIndex >= 0) {
      rowVirtualizer.scrollToIndex(highlightedIndex, { align: "auto" });
    }
  }, [showDropdown, highlightedIndex, rowVirtualizer]);

  const selectAndClose = React.useCallback(
    (id: string, displayValue: string) => {
      onItemSelect(id, displayValue);
      if (externalShowDropdown === undefined) {
        setInternalShowDropdown(false);
      }
    },
    [onItemSelect, externalShowDropdown]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Pass through to consumer first
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    const maxIndex = items.length - 1;
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (!showDropdown && externalShowDropdown === undefined) setInternalShowDropdown(true);
        setHighlightedIndex(prev => {
          const next = Math.min(prev < 0 ? 0 : prev + 1, maxIndex);
          return next;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = Math.max(prev <= 0 ? 0 : prev - 1, 0);
          return next;
        });
        break;
      }
      case "PageDown": {
        e.preventDefault();
        const page = Math.max(1, Math.floor((maxDropdownHeightPx / estimateItemSizePx) - 1));
        setHighlightedIndex(prev => Math.min((prev < 0 ? 0 : prev) + page, maxIndex));
        break;
      }
      case "PageUp": {
        e.preventDefault();
        const page = Math.max(1, Math.floor((maxDropdownHeightPx / estimateItemSizePx) - 1));
        setHighlightedIndex(prev => Math.max((prev < 0 ? 0 : prev) - page, 0));
        break;
      }
      case "Home": {
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case "End": {
        e.preventDefault();
        setHighlightedIndex(maxIndex);
        break;
      }
      case "Enter": {
        if (showDropdown && highlightedIndex >= 0 && highlightedIndex < items.length) {
          e.preventDefault();
          const item = items[highlightedIndex];
          selectAndClose(String(getItemId(item)), getDisplayValue(item));
        }
        break;
      }
      case "Escape": {
        if (showDropdown && externalShowDropdown === undefined) {
          e.preventDefault();
          setInternalShowDropdown(false);
        }
        break;
      }
    }
  };

  return (
    <div ref={containerRef} className={`select-input-container relative mb-4 ${widthClass} ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        {label} {errorMessage && <span className="text-red-500 ml-1 !mb-6">*</span>}
      </label>

      <div
        className={cn("flex items-center relative border rounded-md overflow-hidden", errorMessage ? "border-red-500" : "border-input", isLoading ? "opacity-70" : "")}
        role="combobox"
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-expanded={showDropdown}
      >
        <div className="flex-grow relative">
          <Input
            id={inputId}
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={isLoading ? loadingText : placeholder}
            className={cn("border-0 focus-visible:ring-0 focus-visible:ring-offset-0", selectedItem ? "text-foreground" : "text-muted-foreground")}
            disabled={isLoading}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? errorId : undefined}
            ref={inputRef}
            autoComplete="off"
            aria-controls={listboxId}
          />
        </div>

        <div className="flex items-center pr-3">
          {searchTerm && (
            <button type="button" onClick={handleClearSelection} className="mr-1">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <ChevronDown 
            onClick={handleChevronClick} 
            size={16} 
            className={cn(
              "text-muted-foreground transition-transform duration-200 cursor-pointer", 
              showDropdown ? "transform rotate-180" : ""
            )} 
          />
        </div>
      </div>

      {showDropdown && items.length > 0 && (
        <div
          ref={parentRef}
          className="absolute z-50 w-full bg-white border border-input rounded-none shadow-lg overflow-y-auto"
          role="listbox"
          id={listboxId}
          style={{ maxHeight: maxDropdownHeightPx }}
          onPointerDownCapture={() => { pointerDownInDropdown.current = true; }}
          onPointerUpCapture={() => { pointerDownInDropdown.current = false; }}
          onPointerCancel={() => { pointerDownInDropdown.current = false; }}
          onMouseEnter={() => { isHoveringDropdown.current = true; }}
          onMouseLeave={() => { pointerDownInDropdown.current = false; isHoveringDropdown.current = false; }}
        >
          <div style={{ height: rowVirtualizer.getTotalSize(), width: "100%", position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const item = items[virtualRow.index];
              const key = getItemId(item);
              const isActive = highlightedIndex === virtualRow.index;
              return (
                <div
                  key={key}
                  ref={rowVirtualizer.measureElement}
                  className={cn("absolute top-0 left-0 right-0 group")}
                  style={{ transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size }}
                  data-index={virtualRow.index}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setHighlightedIndex(virtualRow.index)}
                >
                  {itemRenderer ? itemRenderer({ item, onSelect: selectAndClose }) : defaultItemRenderer({ item, onSelect: selectAndClose })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDropdown && items.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full bg-white border border-input rounded-none shadow-lg ">
          <div className="px-3 py-2 text-muted-foreground text-center">{noResultsText.includes("{searchTerm}") ? noResultsText.replace("{searchTerm}", searchTerm) : `${noResultsText} "${searchTerm}"`}</div>
        </div>
      )}

      {errorMessage && (
        <p className="text-red-500 text-sm mt-1" id={errorId}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export const StockEntryItemRenderer = <
  T extends SelectableItem & {
    material?: { name?: string };
    availableQuantity?: number;
    purchasedQuantity?: number;
    purchasedIndividualQuantity?: number;
    purchasedUnit?: string;
    costPerPurchasedUnit?: number;
    costPerBaseUnit?: number;
  }
>({
  item,
  onSelect
}: ItemRendererProps<T>) => {
  const name = item.material?.name || "";
  const quantity = item.availableQuantity !== undefined ? item.availableQuantity : item.purchasedIndividualQuantity !== undefined ? item.purchasedIndividualQuantity : item.purchasedQuantity !== undefined ? item.purchasedQuantity : undefined;
  const unit = item.purchasedUnit || "";
  const cost = item.costPerPurchasedUnit !== undefined ? item.costPerPurchasedUnit : item.costPerBaseUnit !== undefined ? item.costPerBaseUnit : undefined;
  const showDetails = quantity !== undefined && unit && cost !== undefined;

  return (
    <button key={String(item.id)} type="button" className="w-full px-3 py-1 text-left focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(item.id), name)} onMouseDown={e => e.preventDefault()}>
      <div className="block -mx-3 px-3 font-medium leading-snug group-hover:bg-muted group-aria-selected:bg-muted">{name}</div>
      {showDetails && (
        <div className="text-xs text-muted-foreground leading-snug">
          {formatNumber(quantity!)} {unit} | {formatCurrency(cost!)} per {unit}
        </div>
      )}
    </button>
  );
};
