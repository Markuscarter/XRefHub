// Simple icon generator for Chrome extension
// Creates basic PNG icons with text using Canvas API in Node.js

const fs = require('fs');

// Create a simple data URL for a colored square with text
function createIconDataURL(size, text, bgColor = '#6c5ce7', textColor = '#ffffff') {
    // Simple SVG as data URL
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size/8}"/>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="${size * 0.6}" font-weight="bold" fill="${textColor}">${text}</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Create simple text-based icons
console.log('Creating icon data URLs...');
console.log('16x16:', createIconDataURL(16, 'P'));
console.log('32x32:', createIconDataURL(32, 'P'));
console.log('48x48:', createIconDataURL(48, 'P'));
console.log('128x128:', createIconDataURL(128, 'P'));

// Alternative: Create minimal PNG files using base64 encoded data
function createMinimalPNG(size) {
    // This is a minimal 1x1 transparent PNG in base64
    const minimalPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(minimalPNG, 'base64');
}

// Create basic PNG files
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    const filename = `icon${size}_minimal.png`;
    fs.writeFileSync(filename, createMinimalPNG(size));
    console.log(`Created ${filename}`);
});

console.log('Basic PNG icons created. For better quality, use an image editor or the HTML file.');