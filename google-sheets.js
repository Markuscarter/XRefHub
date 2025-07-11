// This function requires the user to be authenticated via chrome.identity
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(token);
        });
    });
}

async function getSheetId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            resolve(result.settings?.googleSheetId);
        });
    });
}

export async function getLabelsFromSheet() {
    const sheetId = await getSheetId();
    if (!sheetId) {
        throw new Error("Google Sheet ID is not set. Please set it in the extension's options page.");
    }

    try {
        const token = await getAuthToken();
        const range = 'A3:A'; // Start from A3 to skip header row
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[Xrefhub Sheets] API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            throw new Error(`Failed to fetch from Google Sheet. Status: ${response.status}. Check the service worker console for details.`);
        }

        const data = await response.json();
        if (!data.values) {
            return []; // No labels found
        }

        // Convert the 2D array of values to a list of objects
        return data.values.map(row => ({ name: row[0] })).filter(label => label.name); // Filter out empty rows
    } catch (error) {
        console.error("[Xrefhub Sheets] A critical error occurred while trying to fetch labels:", error);
        throw error; // Re-throw the error so the caller knows it failed
    }
}

export async function writeToSheet(data) {
    const sheetId = await getSheetId();
    if (!sheetId) throw new Error("Google Sheet ID not set.");

    const token = await getAuthToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [data] // data should be an array of values for the row
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to write to Google Sheet: ${response.statusText}`);
    }

    return await response.json();
} 