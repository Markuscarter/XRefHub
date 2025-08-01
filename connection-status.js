/**
 * Connection Status Manager for Xrefhub Extension
 * Handles and displays status of all API connections
 */

class ConnectionStatusManager {
    constructor() {
        this.connections = {
            gemini: { status: 'unknown', lastCheck: null },
            googleDrive: { status: 'unknown', lastCheck: null },
            googleSheets: { status: 'unknown', lastCheck: null },
            oauth: { status: 'unknown', lastCheck: null }
        };
    }

    // Check Gemini API connection
    async checkGeminiConnection() {
        try {
            const apiKey = await this.getApiKey('gemini');
            if (!apiKey) {
                this.updateStatus('gemini', 'not_configured', 'API key not set');
                return false;
            }

            // Test API call
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Test connection' }] }]
                })
            });

            if (response.ok) {
                this.updateStatus('gemini', 'connected', 'API working');
                return true;
            } else {
                this.updateStatus('gemini', 'error', `API error: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.updateStatus('gemini', 'error', error.message);
            return false;
        }
    }

    // Check Google Drive connection
    async checkGoogleDriveConnection() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                this.updateStatus('googleDrive', 'not_configured', 'OAuth not configured');
                return false;
            }

            // Test Drive API call
            const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.updateStatus('googleDrive', 'connected', 'Drive API working');
                return true;
            } else {
                this.updateStatus('googleDrive', 'error', `Drive API error: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.updateStatus('googleDrive', 'error', error.message);
            return false;
        }
    }

    // Check Google Sheets connection
    async checkGoogleSheetsConnection() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                this.updateStatus('googleSheets', 'not_configured', 'OAuth not configured');
                return false;
            }

            // Test Sheets API call
            const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.updateStatus('googleSheets', 'connected', 'Sheets API working');
                return true;
            } else {
                this.updateStatus('googleSheets', 'error', `Sheets API error: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.updateStatus('googleSheets', 'error', error.message);
            return false;
        }
    }

    // Check OAuth status
    async checkOAuthStatus() {
        try {
            const token = await this.getAuthToken();
            if (token) {
                this.updateStatus('oauth', 'connected', 'OAuth working');
                return true;
            } else {
                this.updateStatus('oauth', 'not_configured', 'OAuth client ID needs update');
                return false;
            }
        } catch (error) {
            this.updateStatus('oauth', 'error', error.message);
            return false;
        }
    }

    // Update connection status
    updateStatus(service, status, message) {
        this.connections[service] = {
            status: status,
            message: message,
            lastCheck: new Date().toISOString()
        };
        
        console.log(`[Connection Status] ${service}: ${status} - ${message}`);
    }

    // Get all connection statuses
    async checkAllConnections() {
        console.log('[Connection Status] Checking all connections...');
        
        await Promise.all([
            this.checkGeminiConnection(),
            this.checkGoogleDriveConnection(),
            this.checkGoogleSheetsConnection(),
            this.checkOAuthStatus()
        ]);

        return this.getStatusSummary();
    }

    // Get status summary
    getStatusSummary() {
        const summary = {
            total: Object.keys(this.connections).length,
            connected: 0,
            notConfigured: 0,
            errors: 0,
            details: {}
        };

        for (const [service, info] of Object.entries(this.connections)) {
            summary.details[service] = info;
            
            switch (info.status) {
                case 'connected':
                    summary.connected++;
                    break;
                case 'not_configured':
                    summary.notConfigured++;
                    break;
                case 'error':
                    summary.errors++;
                    break;
            }
        }

        return summary;
    }

    // Display status in popup
    displayStatusInPopup() {
        const statusContainer = document.getElementById('connection-status');
        if (!statusContainer) return;

        const summary = this.getStatusSummary();
        
        let html = '<div class="connection-status">';
        html += '<h3>Connection Status</h3>';
        
        for (const [service, info] of Object.entries(summary.details)) {
            const statusClass = info.status === 'connected' ? 'success' : 
                              info.status === 'not_configured' ? 'warning' : 'error';
            
            html += `
                <div class="status-item ${statusClass}">
                    <span class="service-name">${this.formatServiceName(service)}</span>
                    <span class="status-indicator">${this.getStatusIcon(info.status)}</span>
                    <span class="status-message">${info.message}</span>
                </div>
            `;
        }
        
        html += '</div>';
        statusContainer.innerHTML = html;
    }

    // Format service name for display
    formatServiceName(service) {
        const names = {
            gemini: 'Gemini AI',
            googleDrive: 'Google Drive',
            googleSheets: 'Google Sheets',
            oauth: 'OAuth Authentication'
        };
        return names[service] || service;
    }

    // Get status icon
    getStatusIcon(status) {
        const icons = {
            connected: '✅',
            not_configured: '⚠️',
            error: '❌',
            unknown: '❓'
        };
        return icons[status] || '❓';
    }

    // Helper functions
    async getApiKey(provider) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                if (provider === 'gemini') {
                    resolve(result.settings?.geminiApiKey);
                } else if (provider === 'chatgpt') {
                    resolve(result.settings?.chatgptApiKey);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async getAuthToken() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });
    }
}

// Export for use in other modules
window.ConnectionStatusManager = ConnectionStatusManager; 