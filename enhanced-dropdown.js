/**
 * Enhanced CSS Dropdown Component
 * Stays open on current page, closes on reload/navigation
 */

class EnhancedDropdown {
    constructor(options = {}) {
        this.isOpen = false;
        this.position = options.position || { top: 20, right: 20 };
        this.zIndex = options.zIndex || 999999;
        this.content = options.content || '';
        this.onClose = options.onClose || (() => {});
        this.onOpen = options.onOpen || (() => {});
        
        this.createDropdown();
        this.setupEventListeners();
        this.observePageChanges();
    }

    createDropdown() {
        // Create dropdown container
        this.element = document.createElement('div');
        this.element.className = 'enhanced-dropdown';
        this.element.style.cssText = `
            position: fixed;
            top: ${this.position.top}px;
            right: ${this.position.right}px;
            z-index: ${this.zIndex};
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            padding: 1rem;
            min-width: 300px;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #374151;
            display: none;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'dropdown-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
        `;

        const title = document.createElement('h3');
        title.textContent = 'AI Analysis';
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = '#f3f4f6';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });

        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create content area
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'dropdown-content';
        this.contentElement.style.cssText = `
            max-height: 400px;
            overflow-y: auto;
            word-wrap: break-word;
        `;

        this.element.appendChild(header);
        this.element.appendChild(this.contentElement);

        // Add to page
        document.body.appendChild(this.element);
    }

    setupEventListeners() {
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.element.contains(e.target)) {
                this.close();
            }
        });

        // Handle page navigation
        window.addEventListener('beforeunload', () => {
            this.close();
        });

        // Handle popstate (back/forward navigation)
        window.addEventListener('popstate', () => {
            this.close();
        });
    }

    observePageChanges() {
        // Observe URL changes
        let currentUrl = window.location.href;
        
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                this.close();
            }
        }, 1000);

        // Observe DOM changes that might indicate page reload
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if this looks like a page reload
                    const hasNewBody = Array.from(mutation.addedNodes).some(node => 
                        node.nodeName === 'BODY' || node.querySelector?.('body')
                    );
                    
                    if (hasNewBody) {
                        this.close();
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    open(content = '') {
        if (this.isOpen) return;

        this.contentElement.innerHTML = content || this.content;
        this.element.style.display = 'block';
        
        // Trigger animation
        setTimeout(() => {
            this.element.style.opacity = '1';
            this.element.style.transform = 'translateY(0)';
        }, 10);

        this.isOpen = true;
        this.onOpen();
        
        console.log('[Enhanced Dropdown] Opened');
    }

    close() {
        if (!this.isOpen) return;

        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 300);

        this.isOpen = false;
        this.onClose();
        
        console.log('[Enhanced Dropdown] Closed');
    }

    updateContent(content) {
        this.content = content;
        if (this.isOpen) {
            this.contentElement.innerHTML = content;
        }
    }

    setPosition(top, right) {
        this.position = { top, right };
        this.element.style.top = `${top}px`;
        this.element.style.right = `${right}px`;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Export for use in other modules
window.EnhancedDropdown = EnhancedDropdown; 