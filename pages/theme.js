/**
 * Theme Manager - Handles dark/light mode switching and persistence
 */
class ThemeManager {
  constructor() {
    this.themeData = 'light';
    this.toggleSelector = '.theme-toggle';
    this.circleClass = 'toggle-circle';
  }

  async init() {
    // 1. Get saved theme
    const data = await this.getTheme();
    this.themeData = data || 'light';
    
    // 2. Apply theme to document
    this.applyTheme(this.themeData);
    
    // 3. Setup toggle listeners
    this.setupListeners();
  }

  setupListeners() {
    const toggles = document.querySelectorAll(this.toggleSelector);
    toggles.forEach(toggle => {
      // Add circle class to inner div if missing
      let circle = toggle.querySelector('div');
      if (circle && !circle.classList.contains(this.circleClass)) {
        circle.classList.add(this.circleClass);
        // Clear inline styles on the circle so CSS takes over
        circle.style.cssText = ''; 
      }
      
      // Clear inline styles on the toggle so CSS takes over
      toggle.style.cssText = '';

      toggle.addEventListener('click', () => {
        const newTheme = this.themeData === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
      });
    });

    // Handle legacy checkbox if present
    const legacyToggle = document.getElementById('theme-input');
    if (legacyToggle) {
      legacyToggle.checked = (this.themeData === 'dark');
      legacyToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        this.setTheme(newTheme);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.themeData = theme;

    // Update legacy checkbox if it exists
    const legacyToggle = document.getElementById('theme-input');
    if (legacyToggle) legacyToggle.checked = (theme === 'dark');
  }

  async getTheme() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['theme'], (result) => {
          resolve(result.theme);
        });
      } else {
        resolve(localStorage.getItem('sqlmaster_theme'));
      }
    });
  }

  async setTheme(theme) {
    this.applyTheme(theme);
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ theme }, resolve);
      } else {
        localStorage.setItem('sqlmaster_theme', theme);
        resolve();
      }
    });
  }
}

// Initialize theme as soon as script loads to prevent flash
const themeManager = new ThemeManager();
themeManager.init();

// Expose to window
window.themeManager = themeManager;
