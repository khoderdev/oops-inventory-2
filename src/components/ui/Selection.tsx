import React from "react";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Input } from "./input";
import { Label } from "./label";

export interface SelectableItem {
  id: string | number;
  [key: string]: any;
}

export interface ItemRendererProps<T extends SelectableItem> {
  item: T;
  onSelect: (id: string, displayValue: string) => void;
}

export interface SelectionProps<T extends SelectableItem> {
  label: string;
  id?: string;
  errors?: Record<string, string | undefined>;
  errorField?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
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
}

export function Selection<T extends SelectableItem>({ label, id, errors = {}, errorField = "id", searchTerm, onSearchChange, onInputFocus, onInputBlur, onKeyDown, isLoading = false, showDropdown, items, onItemSelect, inputRef, loadingText = "Loading...", placeholder = "Search...", noResultsText = "No results found", itemRenderer, getDisplayValue, getItemId, className = "" }: SelectionProps<T>) {
  const inputId = id || `selection-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${inputId}-error`;
  const errorMessage = errorField && errors[errorField];

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

  return (
    <div className={`select-input-container max-w-md w-full relative mb-4 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        <div className="flex flex-col gap-2">
          <Label>
            {label} {errorMessage && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
      </label>
      <Input id={inputId} type="search" value={searchTerm} onChange={e => onSearchChange(e.target.value)} onFocus={onInputFocus} onBlur={onInputBlur} onKeyDown={onKeyDown} placeholder={isLoading ? loadingText : placeholder} className={errorMessage ? "border-red-500" : ""} disabled={isLoading} aria-invalid={!!errorMessage} aria-describedby={errorMessage ? errorId : undefined} ref={inputRef} autoComplete="off" />
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1" id={errorId}>
          {errorMessage}
        </p>
      )}
      {showDropdown && items.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
          {items.map(item => (
            <React.Fragment key={getItemId(item)}>{itemRenderer ? itemRenderer({ item, onSelect: onItemSelect }) : defaultItemRenderer({ item, onSelect: onItemSelect })}</React.Fragment>
          ))}
        </div>
      )}
      {showDropdown && items.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
          <div className="px-3 py-2 text-muted-foreground text-center">{noResultsText.includes("{searchTerm}") ? noResultsText.replace("{searchTerm}", searchTerm) : `${noResultsText} "${searchTerm}"`}</div>
        </div>
      )}
    </div>
  );
}

export const StockEntryItemRenderer = <
  T extends SelectableItem & {
    material?: { name?: string };
    availableQuantity?: number;
    purchasedUnit?: string;
    costPerPurchasedUnit?: number;
  }
>({
  item,
  onSelect
}: ItemRendererProps<T>) => {
  return (
    <button key={String(item.id)} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(item.id), item.material?.name || "")} onMouseDown={e => e.preventDefault()}>
      <div className="font-medium">{item.material?.name}</div>
      {item.availableQuantity !== undefined && item.purchasedUnit && item.costPerPurchasedUnit !== undefined && (
        <div className="text-sm text-muted-foreground">
          {formatNumber(item.availableQuantity)} {item.purchasedUnit} | {formatCurrency(item.costPerPurchasedUnit)} per {item.purchasedUnit}
        </div>
      )}
    </button>
  );
};
