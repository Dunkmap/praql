/**
 * Simple hash-based SPA router
 */
export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    // Strip query params before matching (e.g. "/checkout?price=pri_123" → "/checkout")
    const path = hash.split('?')[0];
    const route = this.routes[path] || this.routes['/'];
    if (route) {
      this.currentRoute = path;
      route();
      this.updateActiveNav();
    }
  }

  navigate(path) {
    window.location.hash = path;
  }

  updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href === `#${this.currentRoute}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  start() {
    this.resolve();
  }
}
