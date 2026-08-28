import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  keyExtractor,
}: VirtualListProps<T>): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => {
      const actualIndex = startIndex + index;
      const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: `${actualIndex * itemHeight}px`,
            left: 0,
            right: 0,
            height: `${itemHeight}px`,
          }}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [items, startIndex, endIndex, itemHeight, renderItem, keyExtractor]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: `${containerHeight}px`, overflowY: 'auto', position: 'relative' }}
      className={`virtual-list-container ${className}`}
    >
      <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}
