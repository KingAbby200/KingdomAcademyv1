import React, { useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const controls = useAnimation();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (!isRefreshing) {
      controls.start({ y: 0 });
    }
  }, [isRefreshing, controls]);

  const handlePanStart = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = info.point.y;
      setIsPulling(true);
    }
  };

  const handlePan = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isPulling && !isRefreshing) {
      const distance = Math.max(0, info.point.y - startY.current);
      const pullDistance = Math.min(distance * 0.5, 100); // Limit pull distance
      controls.set({ y: pullDistance });
    }
  };

  const handlePanEnd = async () => {
    if (isPulling && !isRefreshing) {
      const currentY = (await controls.get())?.y || 0;
      
      if (currentY >= 60) { // Threshold to trigger refresh
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      controls.start({ y: 0 });
      setIsPulling(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="h-full overflow-auto overscroll-y-contain"
      style={{ touchAction: 'pan-x pan-y' }}
    >
      <motion.div
        drag="y"
        dragElastic={0}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragStart={handlePanStart}
        onDrag={handlePan}
        onDragEnd={handlePanEnd}
        animate={controls}
      >
        <div className="relative">
          <div 
            className={`absolute left-1/2 -translate-x-1/2 -top-8 transition-opacity ${
              (isPulling || isRefreshing) ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <RefreshCcw 
              className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
