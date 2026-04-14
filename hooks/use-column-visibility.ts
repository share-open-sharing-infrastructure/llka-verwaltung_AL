/**
 * Hook for managing column visibility and order with localStorage persistence
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EntityColumnConfig } from '@/lib/tables/column-configs';

export interface UseColumnVisibilityOptions {
  /** Entity type for localStorage key */
  entity: 'customers' | 'items' | 'rentals' | 'reservations' | 'logs';

  /** Column configuration */
  config: EntityColumnConfig;

  /** Enable localStorage persistence */
  persist?: boolean;
}

export function useColumnVisibility({
  entity,
  config,
  persist = true,
}: UseColumnVisibilityOptions) {
  // Storage keys for this entity
  const visibilityStorageKey = `column_visibility_${entity}`;
  const orderStorageKey = `column_order_${entity}`;
  const dividersStorageKey = `vertical_dividers_${entity}`;

  // Default visible columns / column order, memoized so the reset* callbacks
  // below have stable identity across renders.
  const defaultVisibleColumns = useMemo(
    () => config.columns.filter((col) => col.defaultVisible).map((col) => col.id),
    [config.columns]
  );
  const defaultColumnOrder = useMemo(
    () => config.columns.map((col) => col.id),
    [config.columns]
  );

  // Load persisted state inside the useState initializers so we don't render
  // once with defaults, write defaults, then overwrite with persisted values —
  // that caused a brief flicker of the default column set and a redundant
  // localStorage write on every mount.
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (!persist || typeof window === 'undefined') return defaultVisibleColumns;
    try {
      const stored = localStorage.getItem(visibilityStorageKey);
      return stored ? (JSON.parse(stored) as string[]) : defaultVisibleColumns;
    } catch {
      return defaultVisibleColumns;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (!persist || typeof window === 'undefined') return defaultColumnOrder;
    try {
      const stored = localStorage.getItem(orderStorageKey);
      if (!stored) return defaultColumnOrder;
      const savedOrder = JSON.parse(stored) as string[];
      // Validate that saved order only contains current columns; append any
      // new columns (added since last persist) to the end.
      const currentColumnIds = config.columns.map((col) => col.id);
      const validOrder = savedOrder.filter((id) => currentColumnIds.includes(id));
      const missingColumns = currentColumnIds.filter((id) => !validOrder.includes(id));
      return [...validOrder, ...missingColumns];
    } catch {
      return defaultColumnOrder;
    }
  });

  const [verticalDividers, setVerticalDividers] = useState<boolean>(() => {
    if (!persist || typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(dividersStorageKey);
      return stored !== null ? (JSON.parse(stored) as boolean) : false;
    } catch {
      return false;
    }
  });

  // Save visibility to localStorage when it changes
  useEffect(() => {
    if (!persist) return;

    try {
      localStorage.setItem(visibilityStorageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('Failed to save column visibility to localStorage:', error);
    }
  }, [visibleColumns, visibilityStorageKey, persist]);

  // Save order to localStorage when it changes
  useEffect(() => {
    if (!persist) return;

    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(columnOrder));
    } catch (error) {
      console.error('Failed to save column order to localStorage:', error);
    }
  }, [columnOrder, orderStorageKey, persist]);

  // Save vertical dividers preference to localStorage when it changes
  useEffect(() => {
    if (!persist) return;

    try {
      localStorage.setItem(dividersStorageKey, JSON.stringify(verticalDividers));
    } catch (error) {
      console.error('Failed to save vertical dividers preference to localStorage:', error);
    }
  }, [verticalDividers, dividersStorageKey, persist]);

  /**
   * Toggle column visibility
   */
  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        // Don't allow hiding all columns
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  }, []);

  /**
   * Reset to default visibility
   */
  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultVisibleColumns);
  }, [defaultVisibleColumns]);

  /**
   * Reset to default column order
   */
  const resetOrder = useCallback(() => {
    setColumnOrder(defaultColumnOrder);
  }, [defaultColumnOrder]);

  /**
   * Reorder columns (used for drag and drop)
   */
  const reorderColumns = useCallback((startIndex: number, endIndex: number) => {
    setColumnOrder((prev) => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  /**
   * Check if a column is visible
   */
  const isColumnVisible = useCallback(
    (columnId: string) => {
      return visibleColumns.includes(columnId);
    },
    [visibleColumns]
  );

  /**
   * Get columns in their current order, optionally filtered by visibility
   */
  const getOrderedColumns = useCallback(
    (onlyVisible = false) => {
      if (onlyVisible) {
        return columnOrder.filter((id) => visibleColumns.includes(id));
      }
      return columnOrder;
    },
    [columnOrder, visibleColumns]
  );

  /**
   * Toggle vertical dividers
   */
  const toggleVerticalDividers = useCallback(() => {
    setVerticalDividers((prev) => !prev);
  }, []);

  /**
   * Get number of hidden columns
   */
  const hiddenCount = config.columns.length - visibleColumns.length;

  return {
    visibleColumns,
    columnOrder,
    verticalDividers,
    toggleColumn,
    resetColumns,
    resetOrder,
    reorderColumns,
    toggleVerticalDividers,
    isColumnVisible,
    getOrderedColumns,
    hiddenCount,
  };
}
