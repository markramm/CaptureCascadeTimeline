import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

interface Dimensions {
    width: number;
    height: number;
}

/**
 * A hook that observes the dimensions of a container element.
 * Returns the current width and height.
 */
export function useResizeObserver(ref: RefObject<HTMLElement | null>, initialWidth = 800, initialHeight = 600) {
    const [dimensions, setDimensions] = useState<Dimensions>({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        if (!ref.current) return;

        const updateDimensions = () => {
            if (ref.current) {
                setDimensions({
                    width: ref.current.clientWidth,
                    height: ref.current.clientHeight
                });
            }
        };

        // Initial sizing
        updateDimensions();

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                // Use contentRect for precise content box size
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    return dimensions;
}
