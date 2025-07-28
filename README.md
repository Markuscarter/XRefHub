# Xrefhub Chrome Extension

An advanced AI-powered content analysis and review tool for Chrome, designed to help content moderators and reviewers analyze web content efficiently.

## 🚀 Features

### **Enhanced Content Scraping**
- **Smart Content Detection**: Automatically extracts content from various website types
- **Multi-Source Extraction**: Prioritizes content from Twitter/X, articles, and general web pages
- **Robust Error Handling**: Safe text extraction with comprehensive error recovery
- **Real-time Scanning**: Instant content capture when popup opens

### **AI-Powered Analysis**
- **Gemini AI Integration**: Direct API key authentication for reliable analysis
- **Content Classification**: Automatic labeling and categorization
- **Policy Resolution**: AI-driven content policy recommendations
- **Deeper Analysis**: Extended analysis capabilities for complex content

### **Google Workspace Integration**
- **Google Drive**: Store and retrieve analysis rules and configurations
- **Google Sheets**: Export analysis results and maintain label databases
- **OAuth2 Authentication**: Secure Google account integration
- **Auto-Discovery**: Smart detection of Xrefhub folders and sheets

### **User-Friendly Interface**
- **Modern UI**: Clean, responsive design with smooth animations
- **Real-time Feedback**: Toast notifications and status indicators
- **Chat Interface**: Interactive AI assistant for follow-up questions
- **Auto-Save**: Automatic content capture and analysis triggering

## 📁 Project Structure

```
Xrefhub/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (main logic)
├── popup.html                 # Main popup interface
├── popup.js                   # Popup logic and UI management
├── popup.css                  # Popup styling
├── content-scanner.js         # Content extraction script
├── ai-analyzer.js             # AI analysis engine
├── settings.html              # Settings page
├── settings.js                # Settings management
├── google-auth.js             # Google OAuth handling
├── google-drive.js            # Google Drive API integration
├── google-sheets.js           # Google Sheets API integration
├── shared-styles.css          # Common styles
├── policy-data.json           # Policy configuration
├── build.js                   # Build validation script
└── icons/                     # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 🛠️ Installation & Setup

### **1. Prerequisites**
- Google Chrome browser
- Node.js (for build validation)
- Google Cloud Console project with APIs enabled

### **2. Google Cloud Setup**
1. Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
   - Generative Language API (Gemini)
3. Create OAuth 2.0 credentials
4. Update `manifest.json` with your client ID

### **3. Extension Installation**
1. Clone or download this repository
2. Run build validation: `node build.js`
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the project folder

### **4. Configuration**
1. Open the extension popup
2. Click the settings icon (⚙️)
3. Configure your Google APIs and Gemini API key
4. Set up your Google Drive folder and Sheets

## 🔧 Build & Development

### **Build Validation**
```bash
# Run comprehensive build validation
node build.js
```

The build script validates:
- ✅ Project structure and file integrity
- ✅ Manifest configuration
- ✅ JavaScript syntax and error handling
- ✅ HTML structure validation
- ✅ CSS syntax checking
- ✅ Content scraping functionality
- ✅ AI integration components
- ✅ Icon assets

### **Development Workflow**
1. Make changes to source files
2. Run `node build.js` to validate
3. Reload extension in Chrome
4. Test functionality
5. Repeat as needed

## 🎯 Usage

### **Basic Content Analysis**
1. Navigate to any webpage you want to analyze
2. Click the Xrefhub extension icon
3. Content is automatically scanned and extracted
4. AI analysis runs automatically for suitable content
5. Review the analysis results and suggested labels

### **Manual Analysis**
1. If auto-scan doesn't capture content, paste it manually
2. Click "Analyze Page" to trigger AI analysis
3. Use "Get Deeper Analysis" for extended insights

### **Export Results**
1. Select appropriate labels from the suggestions
2. Click "Submit to Sheet" to export to Google Sheets
3. Use "Copy Output" to copy results to clipboard

### **Chat Interface**
1. Use the chat interface for follow-up questions
2. Ask about specific content aspects
3. Get additional analysis and recommendations

## 🔌 API Integration

### **Gemini AI**
- Direct API key authentication
- Model: `gemini-1.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`

### **Google Drive API**
- OAuth2 authentication
- File discovery and management
- Configuration storage

### **Google Sheets API**
- OAuth2 authentication
- Data export and label management
- Real-time updates

## 🐛 Troubleshooting

### **Common Issues**

**Content Not Scraping**
- Check if the page is fully loaded
- Try the "Test Scan" button
- Verify the page isn't a Chrome internal page
- Check console for error messages

**AI Analysis Failing**
- Verify Gemini API key is configured
- Check API quota and billing
- Ensure content is suitable for analysis
- Review console error messages

**Google Integration Issues**
- Verify OAuth2 client ID is correct
- Check API permissions are enabled
- Ensure Google account is properly signed in
- Review network connectivity

**Extension Not Loading**
- Check manifest.json syntax
- Verify all required files are present
- Run `node build.js` for validation
- Check Chrome extension console for errors

### **Debug Mode**
1. Open Chrome DevTools
2. Go to the Console tab
3. Look for `[Xrefhub]` prefixed messages
4. Check for error messages and warnings

## 📝 Configuration Files

### **manifest.json**
```json
{
  "manifest_version": 3,
  "name": "Xrefhub",
  "version": "2.0.0",
  "permissions": [
    "storage",
    "activeTab", 
    "scripting",
    "identity",
    "tabs"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID",
    "scopes": [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  }
}
```

### **policy-data.json**
```json
{
  "policies": [
    {
      "name": "Content Policy",
      "rules": ["rule1", "rule2"]
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `node build.js` to validate
5. Test thoroughly
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review console error messages
3. Run build validation
4. Create an issue with detailed error information

## 🔄 Version History

### **v2.0.0** (Current)
- ✅ Enhanced content scraping with robust error handling
- ✅ Improved popup UI with modern design
- ✅ Direct Gemini API integration
- ✅ Comprehensive build validation
- ✅ Better Google Workspace integration
- ✅ Real-time feedback and notifications

### **v1.1.0**
- Basic content analysis
- Google Drive/Sheets integration
- OAuth2 authentication

---

**Built with ❤️ for content moderators and reviewers** 