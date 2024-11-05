// Dynamic theme color based on system preference (dark/light mode)
const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');

function setThemeColor() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Set dark mode theme color
        themeColorMetaTag.setAttribute('content', '#000000'); // Dark mode color
    } else {
        // Set light mode theme color
        themeColorMetaTag.setAttribute('content', '#ffffff'); // Light mode color
    }
}

// Initialize theme color based on current system preference
setThemeColor();

// Listen for changes in the color scheme preference and update the theme color dynamically
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setThemeColor);
