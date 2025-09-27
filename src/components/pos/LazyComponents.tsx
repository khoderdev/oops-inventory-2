import { lazy } from 'react';

// Lazy load all POS components
export const LazyItemsGrid = lazy(() => import('./ItemsGrid').then(module => ({ default: module.ItemsGrid })));
export const LazyCategoryTabs = lazy(() => import('./CategoryTabs').then(module => ({ default: module.CategoryTabs })));
export const LazyOrderItemsList = lazy(() => import('./OrderItemsList').then(module => ({ default: module.OrderItemsList })));
export const LazyOrderSummary = lazy(() => import('./OrderSummary').then(module => ({ default: module.OrderSummary })));
export const LazyActionBar = lazy(() => import('./ActionBar').then(module => ({ default: module.ActionBar })));
export const LazyPaymentDialog = lazy(() => import('./PaymentDialog').then(module => ({ default: module.PaymentDialog })));
export const LazyDiscountDialog = lazy(() => import('./DiscountDialog').then(module => ({ default: module.DiscountDialog })));
export const LazyNotesDialog = lazy(() => import('./NotesDialog').then(module => ({ default: module.NotesDialog })));
export const LazyItemNotesDialog = lazy(() => import('./ItemNotesDialog').then(module => ({ default: module.ItemNotesDialog })));
export const LazyReceiptPrinter = lazy(() => import('./ReceiptPrinter').then(module => ({ default: module.ReceiptPrinter })));
export const LazyVoidOrderDialog = lazy(() => import('./VoidOrderDialog').then(module => ({ default: module.VoidOrderDialog })));
export const LazyTablesLayout = lazy(() => import('./TablesLayout').then(module => ({ default: module.TablesLayout })));
