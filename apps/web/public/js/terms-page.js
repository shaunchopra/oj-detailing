(function () {
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var html = document.documentElement;
      var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('oj-theme', next);
      toggle.setAttribute('aria-label', next === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
    var current = document.documentElement.getAttribute('data-theme');
    toggle.setAttribute('aria-label', current === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  }

  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  if (nav && navToggle && navMenu) {
    function isMobileNav() {
      return window.matchMedia('(max-width: 767px)').matches;
    }

    function updateNavHeight() {
      if (isMobileNav()) {
        nav.style.setProperty('--nav-height', nav.offsetHeight + 'px');
      }
    }

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);

    function setMenuOpen(open) {
      nav.classList.toggle('is-menu-open', open);
      document.body.classList.toggle('is-nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    navToggle.addEventListener('click', function () {
      setMenuOpen(!nav.classList.contains('is-menu-open'));
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });
  }

  var footerAboutTrigger = document.getElementById('footer-about-trigger');
  var footerAboutPanel = document.getElementById('footer-about-panel');
  if (footerAboutTrigger && footerAboutPanel) {
    footerAboutTrigger.addEventListener('click', function () {
      var isOpen = footerAboutTrigger.getAttribute('aria-expanded') === 'true';
      footerAboutTrigger.setAttribute('aria-expanded', String(!isOpen));
      footerAboutPanel.classList.toggle('is-open', !isOpen);
    });
  }
})();
