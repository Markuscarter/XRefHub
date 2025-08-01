/**
 * Persistent CSS Dropdown Component
 * Stays open on current page, closes on reload/navigation
 * Fixed positioning with proper z-index management
 * Smooth animations, responsive design
 */

class PersistentDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.isOpen = false;
        this.zIndex = 999999;
        this.position = { top: 20, right: 20 };
        this.setupStyles();
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.manageZIndex();
        this.observePageChanges();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    setupStyles() {
        const styles = `
            :host {
                position: fixed;
                top: ${this.position.top}px;
                right: ${this.position.right}px;
                z-index: var(--dropdown-z-index, 999999);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .dropdown-container {
                background: var(--dropdown-bg, #ffffff);
                border: 1px solid var(--dropdown-border, #e1e5e9);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(8px);
                max-height: 500px;
                overflow: hidden;
                min-width: 300px;
                max-width: 400px;
            }

            .dropdown-header {
                background: var(--header-bg, #f8f9fa);
                padding: 12px 16px;
                border-bottom: 1px solid var(--border-color, #e1e5e9);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                user-select: none;
            }

            .dropdown-title {
                font-weight: 600;
                color: var(--text-primary, #1a1a1a);
                font-size: 14px;
            }

            .dropdown-toggle {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
                color: var(--text-secondary, #6c757d);
            }

            .dropdown-toggle:hover {
                background-color: var(--hover-bg, #e9ecef);
            }

            .dropdown-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: var(--content-bg, #ffffff);
            }

            .dropdown-content.open {
                max-height: 400px;
            }

            .dropdown-item {
                padding: 12px 16px;
                border-bottom: 1px solid var(--item-border, #f1f3f4);
                cursor: pointer;
                transition: background-color 0.2s;
                font-size: 13px;
                color: var(--text-primary, #1a1a1a);
            }

            .dropdown-item:hover {
                background-color: var(--item-hover, #f8f9fa);
            }

            .dropdown-item:last-child {
                border-bottom: none;
            }

            .dropdown-item.violation {
                border-left: 4px solid var(--violation-color, #dc3545);
                background-color: var(--violation-bg, #fff5f5);
            }

            .dropdown-item.no-violation {
                border-left: 4px solid var(--success-color, #28a745);
                background-color: var(--success-bg, #f8fff9);
            }

            .confidence-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;
            }

            .confidence-high { background-color: #28a745; }
            .confidence-medium { background-color: #ffc107; }
            .confidence-low { background-color: #dc3545; }

            @media (max-width: 768px) {
                :host {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .dropdown-container {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        this.shadowRoot.appendChild(styleSheet);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <div class="dropdown-container">
                <div class="dropdown-header" id="header">
                    <span class="dropdown-title">Xrefhub Analysis</span>
                    <button class="dropdown-toggle" id="toggle">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 11L3 6h10l-5 5z"/>
                        </svg>
                    </button>
                </div>
                <div class="dropdown-content" id="content">
                    <div class="dropdown-item">
                        <span class="confidence-indicator confidence-medium"></span>
                        Scanning page content...
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const header = this.shadowRoot.getElementById('header');
        const toggle = this.shadowRoot.getElementById('toggle');
        const content = this.shadowRoot.getElementById('content');

        header.addEventListener('click', () => this.toggle());
        
        // Prevent clicks inside content from closing dropdown
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.close();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    manageZIndex() {
        const highestZ = this.getHighestZIndex();
        this.style.zIndex = highestZ + 1;
    }

    getHighestZIndex() {
        const elements = document.querySelectorAll('*');
        let highest = 0;
        
        elements.forEach(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex);
            if (zIndex && zIndex > highest) {
                highest = zIndex;
            }
        });
        
        return highest;
    }

    observePageChanges() {
        // Watch for navigation changes
        const observer = new MutationObserver(() => {
            this.manageZIndex();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Store observer for cleanup
        this.pageObserver = observer;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        const content = this.shadowRoot.getElementById('content');
        const toggle = this.shadowRoot.getElementById('toggle');
        
        content.classList.add('open');
        toggle.style.transform = 'rotate(180deg)';
        
        this.dispatchEvent(new CustomEvent('dropdown-opened'));
    }

    close() {
        this.isOpen = false;
        const content = this.shadowRoot.getElementById('content');
        const toggle = this.shadowRoot.getElementById('toggle');
        
        content.classList.remove('open');
        toggle.style.transform = 'rotate(0deg)';
        
        this.dispatchEvent(new CustomEvent('dropdown-closed'));
    }

    updateContent(items) {
        const content = this.shadowRoot.getElementById('content');
        
        if (Array.isArray(items)) {
            content.innerHTML = items.map(item => `
                <div class="dropdown-item ${item.type || ''}">
                    <span class="confidence-indicator confidence-${item.confidence || 'medium'}"></span>
                    ${item.text}
                </div>
            `).join('');
        } else {
            content.innerHTML = `
                <div class="dropdown-item">
                    <span class="confidence-indicator confidence-medium"></span>
                    ${items}
                </div>
            `;
        }
    }

    setPosition(top, right) {
        this.position = { top, right };
        this.style.top = `${top}px`;
        this.style.right = `${right}px`;
    }

    cleanup() {
        if (this.pageObserver) {
            this.pageObserver.disconnect();
        }
    }
}

// Register the custom element
customElements.define('persistent-dropdown', PersistentDropdown);

// Export for use in other modules
window.PersistentDropdown = PersistentDropdown; 