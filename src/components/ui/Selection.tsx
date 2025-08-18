import React from "react";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Input } from "./input";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  showDropdown: boolean;
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
}

export function Selection<T extends SelectableItem>({ label, id, errors = {}, errorField = "id", searchTerm, onSearchChange, onInputFocus, onInputBlur, onKeyDown, isLoading = false, showDropdown, items, onItemSelect, inputRef: externalInputRef, loadingText = "Loading...", placeholder = "Select...", noResultsText = "No results found", itemRenderer, getDisplayValue, getItemId, className = "", width = "md" }: SelectionProps<T>) {
  const inputId = id || `selection-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${inputId}-error`;
  const errorMessage = errorField && errors[errorField];
  const [isSearchMode, setIsSearchMode] = React.useState(false);
  const internalInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const selectedItem = React.useMemo(() => {
    if (!searchTerm) return null;
    return items.find(item => getDisplayValue(item) === searchTerm);
  }, [items, searchTerm, getDisplayValue]);

  const defaultItemRenderer = (props: ItemRendererProps<T>) => {
    const { item, onSelect } = props;
    const displayValue = getDisplayValue(item);
    const itemId = getItemId(item);

    return (
      <button key={itemId} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(itemId), displayValue)} onMouseDown={e => e.preventDefault()}>
        <div className="font-medium">{displayValue}</div>
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
    setIsSearchMode(true);
    onInputFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      setIsSearchMode(false);
    }, 200);
    onInputBlur?.(e);
  };

  // Toggle dropdown when clicking the chevron
  const handleChevronClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If dropdown is already open, close it
    if (showDropdown) {
      setIsSearchMode(false);
      inputRef?.current?.blur();
      onInputBlur?.(new FocusEvent('blur') as unknown as React.FocusEvent<HTMLInputElement>);
    } else {
      // Open the dropdown
      setIsSearchMode(true);
      inputRef?.current?.focus();
    }
  };

  return (
    <div className={`select-input-container relative mb-4 ${widthClass} ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            {label} {errorMessage && <span className="text-red-500 ml-1 !mb-6">*</span>}
          </label>
        </div>
      </label>

      <div className={cn("flex items-center relative border rounded-md overflow-hidden", errorMessage ? "border-red-500" : "border-input", isLoading ? "opacity-70" : "")}>
        <div className="flex-grow relative">
          <Input
            id={inputId}
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={onKeyDown}
            placeholder={isLoading ? loadingText : placeholder}
            className={cn("border-0 focus-visible:ring-0 focus-visible:ring-offset-0", selectedItem && !isSearchMode ? "text-foreground" : "text-muted-foreground")}
            disabled={isLoading}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? errorId : undefined}
            ref={inputRef}
            autoComplete="off"
          />
        </div>

        <div className="flex items-center pr-3">
          {searchTerm && (
            <button type="button" onClick={handleClearSelection} className="p-1 hover:bg-muted rounded-full mr-1">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <ChevronDown onClick={handleChevronClick} size={16} className={cn("text-muted-foreground transition-transform duration-200", showDropdown ? "transform rotate-180" : "")} />
        </div>
      </div>

      {showDropdown && items.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-input rounded-none shadow-lg max-h-60 overflow-y-auto ">
          {items.map(item => (
            <React.Fragment key={getItemId(item)}>{itemRenderer ? itemRenderer({ item, onSelect: onItemSelect }) : defaultItemRenderer({ item, onSelect: onItemSelect })}</React.Fragment>
          ))}
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
    <button key={String(item.id)} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(item.id), name)} onMouseDown={e => e.preventDefault()}>
      <div className="font-medium">{name}</div>
      {showDetails && (
        <div className="text-sm text-muted-foreground">
          {formatNumber(quantity!)} {unit} | {formatCurrency(cost!)} per {unit}
        </div>
      )}
    </button>
  );
};
