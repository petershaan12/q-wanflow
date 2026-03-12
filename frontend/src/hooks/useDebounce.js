import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback will only be invoked after `delay` ms have passed since the last call.
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
export const useDebouncedCallback = (callback, delay = 300) => {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
};

/**
 * Debounce a value - returns the value after it stops changing for `delay` ms.
 * Useful for search inputs, etc.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} Debounced value
 */
export const useDebouncedValue = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Creates a debounced node updater function.
 * Updates local state immediately for responsive UI, but debounces the setNodes call.
 *
 * @param {Function} setNodes - React Flow's setNodes function
 * @param {string} nodeId - The node ID to update
 * @param {number} delay - Debounce delay (default: 150ms for typing)
 * @returns {Function} updater function: (key, value) => void
 */
export const useDebouncedNodeUpdate = (setNodes, nodeId, delay = 150) => {
    const pendingUpdates = useRef({});
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback((key, value) => {
        // Accumulate updates
        pendingUpdates.current[key] = value;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Schedule batched update
        timeoutRef.current = setTimeout(() => {
            const updates = { ...pendingUpdates.current };
            pendingUpdates.current = {};

            setNodes(nds => nds.map(n => {
                if (n.id === nodeId) {
                    return { ...n, data: { ...n.data, ...updates } };
                }
                return n;
            }));
        }, delay);
    }, [setNodes, nodeId, delay]);
};

export default useDebouncedCallback;
