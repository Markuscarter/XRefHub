# Xrefhub Design System

A comprehensive design system for the Xrefhub Chrome extension, providing consistent visual language and user experience patterns.

## 📋 Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Quick Start](#quick-start)
- [Design Tokens](#design-tokens)
- [Components](#components)
- [Layout System](#layout-system)
- [Usage Guidelines](#usage-guidelines)
- [File Structure](#file-structure)
- [Contributing](#contributing)

## 🎨 Overview

The Xrefhub Design System is built around modern UI principles with a focus on:

- **Clean, Professional Aesthetic**: Modern gradients and clean typography
- **Accessibility First**: WCAG 2.1 AA compliant color combinations
- **Responsive Design**: Optimized for Chrome extension popup and settings pages
- **Consistency**: Unified visual language across all components
- **Scalability**: Easy to extend and maintain

### Key Features

- 🎨 **Comprehensive Color Palette**: Primary gradients, semantic colors, and status indicators
- 📝 **Typography System**: Consistent font scales and hierarchy
- 🧩 **Component Library**: Pre-defined UI components with consistent styling
- 📱 **Responsive Patterns**: Mobile-first approach with adaptive layouts
- ♿ **Accessibility**: Focus states, color contrast, and semantic markup
- 🌓 **Theme Support**: Light theme active, dark theme planned

## 🎯 Design Principles

### 1. **Clarity First**
Every design decision prioritizes user understanding and task completion.

### 2. **Consistent Interaction**
Similar actions look and behave the same way throughout the application.

### 3. **Progressive Enhancement**
Core functionality works everywhere, with enhanced experiences where supported.

### 4. **Accessible by Default**
All components meet accessibility standards without additional configuration.

### 5. **Performance Conscious**
Lightweight CSS with minimal impact on extension performance.

## 🚀 Quick Start

### 1. Copy Design Files

```bash
# Copy these files to your new project
cp design.json /path/to/new-project/
cp DESIGN_README.md /path/to/new-project/
cp dashboard-tsl-ultra.html /path/to/new-project/
```

### 2. Reference Design Tokens

```css
/* Use colors from design.json */
.primary-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border-radius: 8px;
    padding: 12px 20px;
}

/* Use typography scale */
.card-header {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
}
```

### 3. Apply Component Patterns

```html
<!-- Use consistent component structure -->
<div class="card">
    <h2 class="card-header">Section Title</h2>
    <div class="card-content">
        <!-- Content here -->
    </div>
</div>
```

## 🎨 Design Tokens

### Color Palette

#### Primary Colors
- **Primary Gradient**: `#667eea` → `#764ba2`
- **Primary Solid**: `#667eea`
- **Primary Light**: `rgba(102, 126, 234, 0.1)`

#### Status Colors
- **Success**: `#28a745` (Green)
- **Error**: `#dc3545` (Red)
- **Warning**: `#ffc107` (Yellow)
- **Info**: `#17a2b8` (Blue)

#### Background Colors
- **Primary**: `#ffffff` (White)
- **Secondary**: `#f8f9fa` (Light Gray)
- **Card**: `#ffffff` (White)

### Typography

#### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

#### Font Scale
- **XS**: 10px
- **SM**: 12px
- **Base**: 14px
- **MD**: 16px
- **LG**: 18px
- **XL**: 20px
- **XXL**: 24px

#### Typography Hierarchy
- **H1**: 20px, weight 600 (Main titles)
- **H2**: 16px, weight 600 (Card headers)
- **H3**: 14px, weight 600 (Subsections)
- **Body**: 14px, weight 400 (Main text)
- **Caption**: 12px, weight 400 (Helper text)

### Spacing Scale

```css
/* Consistent spacing tokens */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-base: 16px;
--spacing-lg: 20px;
--spacing-xl: 24px;
--spacing-xxl: 32px;
```

### Border Radius

```css
/* Consistent rounded corners */
--radius-sm: 4px;
--radius-base: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 20px;
--radius-full: 50%;
```

### Shadows

```css
/* Consistent depth system */
--shadow-card: 0 2px 12px rgba(0,0,0,0.08);
--shadow-card-hover: 0 4px 20px rgba(0,0,0,0.12);
--shadow-button: 0 4px 12px rgba(102, 126, 234, 0.4);
--shadow-focus: 0 0 0 3px rgba(102, 126, 234, 0.1);
```

## 🧩 Components

### Buttons

#### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: #6c757d;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
}

.btn-secondary:hover {
    background: #5a6268;
    transform: translateY(-1px);
}
```

### Cards

```css
.card {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    transform: translateY(-2px);
}

.card-header {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 16px;
}
```

### Form Elements

#### Input Fields
```css
.input-field {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 14px;
    background: #f8f9fa;
    transition: all 0.3s ease;
}

.input-field:focus {
    outline: none;
    border-color: #667eea;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

#### Textarea
```css
.textarea {
    min-height: 100px;
    max-height: 200px;
    line-height: 1.6;
    resize: vertical;
}
```

### Status Indicators

```css
.status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-connected {
    background: #d4edda;
    color: #155724;
}

.status-error {
    background: #f8d7da;
    color: #721c24;
}
```

### Chat Interface

```css
.chat-message.user {
    background: #667eea;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}

.chat-message.assistant {
    background: white;
    color: #333;
    align-self: flex-start;
    border: 1px solid #e9ecef;
    border-bottom-left-radius: 4px;
}
```

### Toast Notifications

```css
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
}

.toast-success { background: #28a745; }
.toast-error { background: #dc3545; }
.toast-warning { background: #ffc107; color: #212529; }
```

## 📐 Layout System

### Popup Dimensions
- **Width**: 650px (550px on mobile)
- **Min Height**: 550px (500px on mobile)
- **Max Height**: 600px (550px on mobile)

### Grid Systems
```css
/* Provider grid */
.provider-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

/* Status grid */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}
```

### Responsive Breakpoints
- **Mobile**: 600px and below
- **Tablet**: 768px and below
- **Desktop**: 1024px and above

## 🎯 Usage Guidelines

### ✅ Do's

- **Use consistent spacing** from the spacing scale
- **Apply hover effects** to all interactive elements
- **Use semantic color names** for status indicators
- **Maintain consistent border radius** across similar components
- **Use the primary gradient** for main actions
- **Apply appropriate focus styles** for accessibility

### ❌ Don'ts

- **Don't use hardcoded colors** outside the defined palette
- **Don't mix different spacing systems**
- **Don't create inconsistent hover states**
- **Don't override accessibility focus styles** without replacement
- **Don't use overly bright colors** for large areas
- **Don't create custom shadows** without following the system

### Accessibility Guidelines

1. **Color Contrast**: Minimum 4.5:1 ratio, preferred 7:1
2. **Focus Indicators**: Always provide visible focus states
3. **Touch Targets**: Minimum 44px, recommended 48px
4. **Semantic Markup**: Use proper HTML elements
5. **Alt Text**: Provide descriptive alt text for images

## 📁 File Structure

```
project/
├── design.json                 # Design system tokens and specifications
├── DESIGN_README.md            # This documentation
├── dashboard-tsl-ultra.html  # Premium dashboard template
├── popup.css                   # Main popup styles
├── settings.css               # Settings page styles
├── shared-styles.css          # Shared component styles
└── icons/                     # Icon assets
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── polibot_icon.svg
```

## 🎨 Industry Detection Styles

Special styling for content analysis results:

```css
/* High-risk industry detection */
.industry-detection.high-risk {
    background: #fff5f5;
    border-color: #fed7d7;
    color: #c53030;
}

/* Safe industry detection */
.industry-detection.safe {
    background: #f0fff4;
    border-color: #9ae6b4;
    color: #38a169;
}

/* Results by analysis mode */
.execution-results { border-left: 3px solid #f59e0b; }
.policy-results { border-left: 3px solid #10b981; }
.risk-results { border-left: 3px solid #ef4444; }
.standard-results { border-left: 3px solid #3b82f6; }
```

## 🌓 Theme Support

### Current: Light Theme
The design system currently implements a clean light theme optimized for professional use.

### Planned: Dark Theme
Future enhancement will include a dark theme variant with:
- Dark background colors
- Adjusted contrast ratios
- Consistent component behavior
- Smooth theme transitions

## ⚡ Performance Considerations

- **Lightweight CSS**: Minimal impact on extension performance
- **Efficient Animations**: Hardware-accelerated transforms
- **Optimized Images**: Proper icon sizes for different contexts
- **Minimal Dependencies**: System fonts only, no external resources

## 🔧 Customization

### Adding New Colors
1. Define color in `design.json` color palette
2. Add CSS custom property if needed
3. Document usage guidelines
4. Test accessibility compliance

### Creating New Components
1. Follow existing component patterns
2. Use design tokens from `design.json`
3. Include hover and focus states
4. Test responsive behavior
5. Document in this README

### Responsive Modifications
1. Use existing breakpoints
2. Follow mobile-first approach
3. Test on various screen sizes
4. Maintain touch target sizes

## 🤝 Contributing

### Making Changes
1. Update `design.json` with any new tokens
2. Test changes across all components
3. Update this README with new patterns
4. Ensure accessibility compliance
5. Test responsive behavior

### Code Standards
- Use semantic CSS class names
- Follow existing naming conventions
- Comment complex styles
- Group related styles together
- Use consistent indentation

## 📚 Resources

### Tools Used
- **Chrome Extension APIs**: For popup and settings integration
- **CSS Grid & Flexbox**: For responsive layouts
- **CSS Custom Properties**: For maintainable theming
- **CSS Transitions**: For smooth interactions

### References
- [Chrome Extension UI Guidelines](https://developer.chrome.com/docs/extensions/mv3/user_interface/)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Grid Layout Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Modern CSS Best Practices](https://web.dev/learn/css/)

---

**Built with ❤️ for consistent, accessible, and beautiful user interfaces**

> This design system is actively maintained and evolved based on user feedback and modern web standards. For questions or suggestions, please create an issue in the project repository.
