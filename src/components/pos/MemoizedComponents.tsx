import { OrderItemsList } from './OrderItemsList';
import { OrderSummary } from './OrderSummary';
import { CategoryTabs } from './CategoryTabs';
import { ItemsGrid } from './ItemsGrid';
import { ActionBar } from './ActionBar';
import { ProductGridProps } from '@/types/inventory';

// These components are already memoized internally, so we're just re-exporting them
// without adding another layer of memoization

// Export OrderItemsList directly - it's already memoized internally
export const MemoizedOrderItemsList = OrderItemsList;

// Export OrderSummary directly - it's already memoized internally
export const MemoizedOrderSummary = OrderSummary;

// Export CategoryTabs directly - it's already memoized internally with custom equality check
export const MemoizedCategoryTabs = CategoryTabs;

// Export ItemsGrid directly - it's already memoized internally with custom equality check
export const MemoizedItemsGrid = (props: ProductGridProps) => <ItemsGrid {...props} />;

// Export ActionBar directly - it's already memoized internally
export const MemoizedActionBar = ActionBar;
