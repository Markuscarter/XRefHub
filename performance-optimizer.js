/**
 * Performance Optimizer for Xrefhub Chrome Extension
 * Handles event debouncing, memory leak prevention, and error handling
 */

class PerformanceOptimizer {
    constructor() {
        this.listeners = new Set();
        this.intervals = new Set();
        this.timeouts = new Set();
        this.observers = new Set();
        this.debounceTimers = new Map();
        this.errorHandler = new ErrorHandler();
        this.memoryManager = new MemoryManager();
    }

    // --- Event Debouncing ---
    debounce(func, delay = 300) {
        return (...args) => {
            const key = func.toString();
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
            this.timeouts.add(timer);
        };
    }

    // --- Memory Management ---
    addListener(element, event, handler, options = {}) {
        if (!element || !event || !handler) {
            console.warn('[Performance Optimizer] Invalid listener parameters');
            return;
        }

        const wrappedHandler = this.wrapHandler(handler);
        element.addEventListener(event, wrappedHandler, options);
        
        this.listeners.add({
            element,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });

        return wrappedHandler;
    }

    removeListener(element, event, handler) {
        const listener = Array.from(this.listeners).find(l => 
            l.element === element && 
            l.event === event && 
            l.originalHandler === handler
        );

        if (listener) {
            element.removeEventListener(event, listener.handler, listener.options);
            this.listeners.delete(listener);
        }
    }

    wrapHandler(handler) {
        return (...args) => {
            try {
                return handler.apply(this, args);
            } catch (error) {
                this.errorHandler.handleError(error, {
                    context: 'event_handler',
                    handler: handler.toString().substring(0, 100)
                });
            }
        };
    }

    // --- Interval Management ---
    setInterval(callback, delay, ...args) {
        const interval = setInterval(callback, delay, ...args);
        this.intervals.add(interval);
        return interval;
    }

    clearInterval(interval) {
        if (this.intervals.has(interval)) {
            clearInterval(interval);
            this.intervals.delete(interval);
        }
    }

    // --- Timeout Management ---
    setTimeout(callback, delay, ...args) {
        const timeout = setTimeout(callback, delay, ...args);
        this.timeouts.add(timeout);
        return timeout;
    }

    clearTimeout(timeout) {
        if (this.timeouts.has(timeout)) {
            clearTimeout(timeout);
            this.timeouts.delete(timeout);
        }
    }

    // --- Observer Management ---
    addObserver(observer) {
        this.observers.add(observer);
        return observer;
    }

    removeObserver(observer) {
        if (this.observers.has(observer)) {
            observer.disconnect();
            this.observers.delete(observer);
        }
    }

    // --- Cleanup ---
    cleanup() {
        console.log('[Performance Optimizer] Starting cleanup...');
        
        // Clear all listeners
        this.listeners.forEach(({element, event, handler, options}) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('[Performance Optimizer] Error removing listener:', error);
            }
        });
        this.listeners.clear();

        // Clear all intervals
        this.intervals.forEach(interval => {
            try {
                clearInterval(interval);
            } catch (error) {
                console.warn('[Performance Optimizer] Error clearing interval:', error);
            }
        });
        this.intervals.clear();

        // Clear all timeouts
        this.timeouts.forEach(timeout => {
            try {
                clearTimeout(timeout);
            } catch (error) {
                console.warn('[Performance Optimizer] Error clearing timeout:', error);
            }
        });
        this.timeouts.clear();

        // Clear debounce timers
        this.debounceTimers.forEach(timer => {
            try {
                clearTimeout(timer);
            } catch (error) {
                console.warn('[Performance Optimizer] Error clearing debounce timer:', error);
            }
        });
        this.debounceTimers.clear();

        // Disconnect all observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('[Performance Optimizer] Error disconnecting observer:', error);
            }
        });
        this.observers.clear();

        console.log('[Performance Optimizer] Cleanup complete');
    }

    // --- Performance Monitoring ---
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    getActiveListeners() {
        return this.listeners.size;
    }

    getActiveIntervals() {
        return this.intervals.size;
    }

    getActiveTimeouts() {
        return this.timeouts.size;
    }

    getActiveObservers() {
        return this.observers.size;
    }
}

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorWindow = 60000; // 1 minute
        this.errors = [];
    }

    handleError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.error('[Error Handler]', errorInfo);

        // Track error for rate limiting
        this.errors.push(errorInfo);
        this.errorCount++;

        // Clean old errors
        const now = Date.now();
        this.errors = this.errors.filter(e => 
            now - new Date(e.timestamp).getTime() < this.errorWindow
        );

        // Rate limiting
        if (this.errorCount > this.maxErrors) {
            console.warn('[Error Handler] Too many errors, rate limiting enabled');
            return;
        }

        // Send to analytics if available
        this.sendToAnalytics(errorInfo);

        return errorInfo;
    }

    sendToAnalytics(errorInfo) {
        try {
            if (window.gtag) {
                gtag('event', 'extension_error', {
                    error_message: errorInfo.message,
                    error_context: errorInfo.context,
                    error_count: this.errorCount
                });
            }
        } catch (error) {
            console.warn('[Error Handler] Failed to send to analytics:', error);
        }
    }

    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            recentErrors: this.errors.length,
            maxErrors: this.maxErrors
        };
    }
}

class MemoryManager {
    constructor() {
        this.memoryThreshold = 0.8; // 80% of heap limit
        this.checkInterval = null;
    }

    startMonitoring() {
        if (this.checkInterval) {
            this.stopMonitoring();
        }

        this.checkInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 30000); // Check every 30 seconds
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    checkMemoryUsage() {
        if (!performance.memory) return;

        const usage = performance.memory;
        const usageRatio = usage.usedJSHeapSize / usage.jsHeapSizeLimit;

        if (usageRatio > this.memoryThreshold) {
            console.warn('[Memory Manager] High memory usage detected:', {
                used: usage.usedJSHeapSize,
                total: usage.totalJSHeapSize,
                limit: usage.jsHeapSizeLimit,
                ratio: usageRatio
            });

            this.triggerMemoryCleanup();
        }
    }

    triggerMemoryCleanup() {
        console.log('[Memory Manager] Triggering memory cleanup...');
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        // Clear any cached data
        this.clearCaches();
    }

    clearCaches() {
        // Clear any extension-specific caches
        try {
            // Clear image caches
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.dataset.cached) {
                    img.src = '';
                    delete img.dataset.cached;
                }
            });

            // Clear any stored data that's not essential
            chrome.storage.local.get(null, (items) => {
                const nonEssentialKeys = Object.keys(items).filter(key => 
                    key.startsWith('temp_') || 
                    key.startsWith('cache_') ||
                    key.includes('debug')
                );
                
                if (nonEssentialKeys.length > 0) {
                    chrome.storage.local.remove(nonEssentialKeys);
                    console.log('[Memory Manager] Cleared non-essential storage keys:', nonEssentialKeys);
                }
            });
        } catch (error) {
            console.warn('[Memory Manager] Error during cache cleanup:', error);
        }
    }
}

// --- Chromebook-specific optimizations ---
class ChromebookOptimizer {
    constructor() {
        this.isChromebook = this.detectChromebook();
        this.optimizations = new Map();
    }

    detectChromebook() {
        return navigator.userAgent.includes('CrOS') || 
               navigator.userAgent.includes('Chrome OS');
    }

    applyChromebookOptimizations() {
        if (!this.isChromebook) return;

        console.log('[Chromebook Optimizer] Applying Chromebook-specific optimizations...');

        // Reduce animation complexity
        this.optimizations.set('reduced-animations', true);
        document.documentElement.style.setProperty('--animation-duration', '0.1s');

        // Optimize event handling
        this.optimizations.set('debounced-events', true);
        
        // Reduce memory usage
        this.optimizations.set('memory-optimized', true);
    }

    isOptimizationEnabled(key) {
        return this.optimizations.get(key) || false;
    }
}

// Export for use in other modules
window.PerformanceOptimizer = PerformanceOptimizer;
window.ErrorHandler = ErrorHandler;
window.MemoryManager = MemoryManager;
window.ChromebookOptimizer = ChromebookOptimizer; 