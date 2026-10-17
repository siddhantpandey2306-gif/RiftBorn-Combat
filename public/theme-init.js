// RIFTBORN Zero-FOUC Theme Initializer
// Runs synchronously in document <head> to prevent theme flickering before render
(function() {
  try {
    var savedTheme = localStorage.getItem('riftborn_theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0B0E14' : '#F4F6F8');
    }
  } catch (e) {
    // Graceful fallback: defaults to dark theme in CSS
  }
})();
