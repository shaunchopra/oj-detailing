(function () {
  var THEME_KEY = 'oj-theme';
  var root = document.documentElement;

  // ── Lenis smooth scroll ───────────────────────────────────────────────────
  var lenis = null;
  var prefersReducedMotionCheck = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotionCheck && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
    });

    function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var hash = anchor.getAttribute('href');
        if (hash === '#') {
          e.preventDefault();
          lenis.scrollTo(0, { duration: 1.2 });
          return;
        }
        var target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80, duration: 1.2 });
        }
      });
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Shared pricing data ───────────────────────────────────────────────────
  // Single source of truth for all service packages and add-on prices.
  // Both the Services section cards and the Get a Quote form read from this
  // object — to change a price, update only PRICING; never touch HTML or the
  // form independently so the two sections can never drift.
  // ─────────────────────────────────────────────────────────────────────────
  var PRICING = {
    services: [
      { value: 'touch-up',          label: 'Touch Up',                     car: 80,  caravan: null },
      { value: 'tier-1-exterior',   label: 'Tier 1 \u2014 Exterior',       car: 65,  caravan: 200  },
      { value: 'tier-2-interior',   label: 'Tier 2 \u2014 Interior',       car: 150, caravan: 320  },
      { value: 'tier-3-complete',   label: 'Tier 3 \u2014 Complete Detail', car: 200, caravan: 495  },
    ],
    addons: [
      { value: 'scratch-removal',       label: 'Scratch removal',       price: 45,  desc: 'Knock out light scratches' },
      { value: 'trim-restoration',      label: 'Trim restoration',      price: 50,  desc: 'Bring faded trims and plastics back to life' },
      { value: 'water-repellent',       label: 'Water repellent',       price: 30,  desc: 'Rain beads run off glass for safer driving' },
      { value: 'anti-fog',              label: 'Anti-fog',              price: 35,  desc: 'Remove fog from windows for safer driving' },
      { value: 'headlight-restoration', label: 'Headlight restoration', price: 100, desc: 'Foggy, yellowed lenses restored to crystal clear, bringing your car many years back.' },
    ],
  };

  // Re-render the Services section add-ons chip list from PRICING so its
  // names and prices are always in sync with the quote form.
  var addonsListEl = document.querySelector('#addons-panel .addons__list');
  if (addonsListEl) {
    addonsListEl.innerHTML = '';
    PRICING.addons.forEach(function (addon) {
      var li = document.createElement('li');
      li.className = 'addon-chip';
      li.innerHTML =
        '<div class="addon-chip__main">' +
          '<span class="addon-chip__name">' + addon.label + '</span>' +
          '<span class="addon-chip__price">FROM $' + addon.price + '</span>' +
        '</div>' +
        '<p class="addon-chip__desc">' + addon.desc + '</p>';
      addonsListEl.appendChild(li);
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Line reveal animation ─────────────────────────────────────────────────
  var LINE_REVEAL_SELECTORS = [
    { sel: '.hero__title',        initialDelay: 260 },
    { sel: '.services__title',    initialDelay: 0   },
    { sel: '.why-us__title',      initialDelay: 0   },
    { sel: '.recent-work__title', initialDelay: 0   },
    { sel: '.quote__title',       initialDelay: 0   },
    { sel: '.contact__title',     initialDelay: 0   },
  ];
  var LINE_DURATION    = 800;
  var LINE_STAGGER     = 100;
  var LINE_EASING      = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var lineRevealInstances = [];

  function initLineReveal() {
    if (prefersReducedMotionCheck || typeof SplitType === 'undefined') return;

    LINE_REVEAL_SELECTORS.forEach(function (cfg) {
      var el = document.querySelector(cfg.sel);
      if (!el) return;

      // Hero title already has CSS enter animation — replace it with ours
      el.classList.remove('hero-in', 'hero-in--1', 'hero-in--2', 'hero-in--3', 'hero-in--4', 'hero-in--5');

      var instance = new SplitType(el, { types: 'lines' });
      lineRevealInstances.push({ el: el, instance: instance });

      // Wrap each .line in an overflow:hidden mask div
      instance.lines.forEach(function (line) {
        var mask = document.createElement('div');
        mask.style.cssText = 'overflow:hidden;display:block;';
        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
        line.style.transform = 'translateY(110%)';
        line.style.display   = 'block';
      });

      // Trigger animation when the element scrolls into view
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          instance.lines.forEach(function (line, i) {
            line.animate(
              [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }],
              {
                duration: LINE_DURATION,
                delay:    cfg.initialDelay + (i * LINE_STAGGER),
                easing:   LINE_EASING,
                fill:     'both',
              }
            );
          });
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

      observer.observe(el);
    });
  }

  // Re-split on resize so line breaks stay accurate
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      lineRevealInstances.forEach(function (item) {
        item.instance.split();
        item.instance.lines.forEach(function (line) {
          if (!line.parentNode || line.parentNode.style.overflow !== 'hidden') {
            var mask = document.createElement('div');
            mask.style.cssText = 'overflow:hidden;display:block;';
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          }
          line.style.transform = 'translateY(0%)';
          line.style.display   = 'block';
        });
      });
    }, 200);
  });

  initLineReveal();
  // ─────────────────────────────────────────────────────────────────────────
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  var themeToggle = document.getElementById('theme-toggle');
  var hero = document.getElementById('hero');
  var footerYear = document.getElementById('footer-year');

  function getTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      );
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTheme(getTheme() === 'light' ? 'dark' : 'light');
    });
    setTheme(getTheme());
  }

  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenuOpen(open) {
    nav.classList.toggle('is-menu-open', open);
    document.body.classList.toggle('is-nav-open', open);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      setMenuOpen(!nav.classList.contains('is-menu-open'));
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-menu-open')) {
        setMenuOpen(false);
        navToggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && nav.classList.contains('is-menu-open')) {
        setMenuOpen(false);
      }
    });
  }

  if (hero) {
    requestAnimationFrame(function () {
      hero.classList.add('is-ready');
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else if (reveals.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var servicesSection = document.getElementById('services');
  if (servicesSection && !prefersReducedMotion) {
    var priceEls = servicesSection.querySelectorAll('.spec--lg .spec__value');
    var pricesPlayed = false;

    var priceObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || pricesPlayed) return;
      pricesPlayed = true;
      priceObserver.disconnect();

      priceEls.forEach(function (el, i) {
        var raw = el.textContent.trim();
        var prefix = raw.replace(/[0-9]/g, '').replace(/[0-9\s]/g, '').charAt(0) || '';
        var target = parseInt(raw.replace(/[^0-9]/g, ''), 10);
        if (isNaN(target)) return;

        var startTs = null;
        var duration = 560;

        setTimeout(function () {
          function step(ts) {
            if (!startTs) startTs = ts;
            var progress = Math.min((ts - startTs) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = prefix + Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }, i * 70);
      });
    }, { threshold: 0.25 });

    priceObserver.observe(servicesSection);
  }

  var navSections = ['why-us', 'recent-work', 'services', 'reviews', 'quote', 'contact'];
  var navLinkMap = {};
  navSections.forEach(function (id) {
    var link = document.querySelector('.nav-links a[href="#' + id + '"]');
    if (link) navLinkMap[id] = link;
  });

  var navSectionEls = navSections.map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);

  var navVisibleSections = new Set();

  function setActiveNavSection(id) {
    Object.keys(navLinkMap).forEach(function (sectionId) {
      navLinkMap[sectionId].classList.toggle('is-active', sectionId === id);
    });
  }

  function isAtPageBottom() {
    var threshold = 32;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    return window.innerHeight + scrollTop >= document.documentElement.scrollHeight - threshold;
  }

  function applyActiveNav() {
    if (isAtPageBottom()) {
      setActiveNavSection('contact');
      return;
    }

    var active = null;
    navSections.forEach(function (id) {
      if (navVisibleSections.has(id)) active = id;
    });
    setActiveNavSection(active);
  }

  if (navSectionEls.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navVisibleSections.add(entry.target.id);
        } else {
          navVisibleSections.delete(entry.target.id);
        }
      });
      applyActiveNav();
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    });

    navSectionEls.forEach(function (el) {
      navObserver.observe(el);
    });
  }

  window.addEventListener('scroll', applyActiveNav, { passive: true });
  if (lenis && typeof lenis.on === 'function') {
    lenis.on('scroll', applyActiveNav);
  }
  applyActiveNav();

  document.querySelectorAll('.work-card').forEach(function (card) {
    var media = card.querySelector('.work-card__media');
    var slots = card.querySelectorAll('.work-card__slot');
    var buttons = card.querySelectorAll('.work-card__btn');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        if (!view || btn.classList.contains('is-active')) return;

        buttons.forEach(function (b) {
          var active = b.getAttribute('data-view') === view;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        slots.forEach(function (slot) {
          slot.classList.toggle('is-active', slot.classList.contains('work-card__slot--' + view));
        });

        media.setAttribute('data-view', view);
      });
    });
  });

  // ── Progress Slider ───────────────────────────────────────────────────────
  // Draggable 4-stage cleaning-progress reveal component.
  // Each .progress-slider article is independent.
  // Data attributes on the article drive the four status labels:
  //   data-label1  (0%,  dirtiest)
  //   data-label2  (~33%)
  //   data-label3  (~66%)
  //   data-label4  (100%, cleanest)
  // ─────────────────────────────────────────────────────────────────────────
  function initProgressSliders() {
    document.querySelectorAll('.progress-slider').forEach(function (slider) {
      var track   = slider.querySelector('.progress-slider__track');
      var handle  = slider.querySelector('.progress-slider__handle');
      var fill    = slider.querySelector('.progress-slider__fill');
      var labelEl = slider.querySelector('.progress-slider__label');
      var layers  = slider.querySelectorAll('.progress-slider__layer');

      if (!track || !handle || !layers.length) return;

      // Read configurable labels from data attributes (fall back to defaults)
      var labels = [
        slider.dataset.label1 || 'ew dirty',
        slider.dataset.label2 || 'better but still dirty',
        slider.dataset.label3 || 'cleaner',
        slider.dataset.label4 || 'OJ level cleaned',
      ];

      // Thresholds (0–1) at which each label becomes active.
      // Optional data-threshold2/3/4 override the defaults per slider.
      var labelThresholds = [
        0,
        slider.dataset.threshold2 !== undefined ? parseFloat(slider.dataset.threshold2) : 0.165,
        slider.dataset.threshold3 !== undefined ? parseFloat(slider.dataset.threshold3) : 0.5,
        slider.dataset.threshold4 !== undefined ? parseFloat(slider.dataset.threshold4) : 0.835,
      ];

      var pct      = 0;     // current position 0..1
      var dragging = false;

      function getLabel(p) {
        var idx = 0;
        for (var i = 1; i < labelThresholds.length; i++) {
          if (p >= labelThresholds[i]) idx = i;
        }
        return labels[idx];
      }

      function update(p) {
        pct = Math.max(0, Math.min(1, p));

        // Position handle and grow fill bar
        handle.style.left = (pct * 100) + '%';
        fill.style.width  = (pct * 100) + '%';
        handle.setAttribute('aria-valuenow', Math.round(pct * 100));

        // Cross-fade between adjacent stages only.
        // Divide the 0..1 range into 3 equal segments:
        //   seg 0 (0–0.333): stage 1 → stage 2
        //   seg 1 (0.333–0.667): stage 2 → stage 3
        //   seg 2 (0.667–1.0): stage 3 → stage 4
        var seg     = pct * 3;
        var segIdx  = Math.floor(seg);
        var segFrac = seg - segIdx;
        if (segIdx >= 3) { segIdx = 2; segFrac = 1; }

        layers.forEach(function (layer, i) {
          var op;
          if (i === segIdx)     { op = 1 - segFrac; }
          else if (i === segIdx + 1) { op = segFrac; }
          else                  { op = 0; }
          layer.style.opacity = op;
        });

        // Swap label text when it changes
        var txt = getLabel(pct);
        if (labelEl && labelEl.textContent !== txt) {
          labelEl.textContent = txt;
        }
      }

      function percentFromEvent(e) {
        var rect    = track.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return (clientX - rect.left) / rect.width;
      }

      function onPointerDown(e) {
        dragging = true;
        slider.classList.add('is-dragging');
        if (lenis) lenis.stop();
        update(percentFromEvent(e));
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!dragging) return;
        update(percentFromEvent(e));
        if (e.cancelable) e.preventDefault();
      }

      function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        slider.classList.remove('is-dragging');
        if (lenis) lenis.start();
      }

      // Mouse
      track.addEventListener('mousedown', onPointerDown);
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);

      // Touch
      track.addEventListener('touchstart', onPointerDown, { passive: false });
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);

      // Keyboard: arrow keys, Home, End when handle is focused
      handle.addEventListener('keydown', function (e) {
        var step = 0.04;
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown')  { update(pct - step); e.preventDefault(); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp')    { update(pct + step); e.preventDefault(); }
        if (e.key === 'Home')  { update(0); e.preventDefault(); }
        if (e.key === 'End')   { update(1); e.preventDefault(); }
      });

      // Initialise at position 0 (dirtiest) for maximum reveal impact
      update(0);
    });
  }

  initProgressSliders();
  // ─────────────────────────────────────────────────────────────────────────

  // ── Vehicle type segmented toggle ────────────────────────────────────────
  // Clicking a pill sets aria-selected, flips data-vehicle on the section,
  // and swaps card prices / CTA links with a short opacity fade.
  // Arrow keys move focus between tabs per the ARIA tablist pattern.
  // ─────────────────────────────────────────────────────────────────────────

  // Assigned by the Get a Quote block below; pre-fills the form when a service
  // card "Book this →" button is clicked (declared here so the services click
  // handler can reference it before the quote form initialisation runs).
  var quotePreselect = function () {};

  var servicesGrid = servicesSection
    ? servicesSection.querySelector('.services__grid')
    : null;

  // Capture each card's original state before any swap.
  var cardMeta = [];
  if (servicesGrid) {
    Array.prototype.forEach.call(
      servicesGrid.querySelectorAll('.service-card'),
      function (card) {
        var priceEl = card.querySelector('.spec--lg .spec__value');
        var specEl  = priceEl ? priceEl.closest('.spec--lg') : null;
        var labelEl = specEl  ? specEl.querySelector('.spec__label') : null;
        var linkEl  = card.querySelector('.service-card__link');
        var saveEl  = card.querySelector('[data-caravan-save]');

        // Resolve this card's entry in the shared PRICING object
        var serviceKey  = card.getAttribute('data-quote-service');
        var pricingData = null;
        PRICING.services.forEach(function (s) {
          if (s.value === serviceKey) pricingData = s;
        });

        cardMeta.push({
          cardEl:               card,
          priceEl:              priceEl,
          labelEl:              labelEl,
          linkEl:               linkEl,
          qualifierEl:          specEl ? specEl.querySelector('.spec__qualifier') : null,
          pricingData:          pricingData,
          // Prices come from PRICING, not from data-caravan-price attributes
          caravanPrice:         pricingData && pricingData.caravan !== null ? '$' + pricingData.caravan : null,
          isCaravanUnavailable: pricingData ? pricingData.caravan === null : card.hasAttribute('data-caravan-unavailable'),
          isCaravanTop:         card.hasAttribute('data-caravan-top'),
          originalPrice:        pricingData ? '$' + pricingData.car : (priceEl ? priceEl.textContent : ''),
          originalLinkHref:     linkEl ? linkEl.getAttribute('href')    : '',
          originalLinkText:     linkEl ? linkEl.textContent             : '',
          originalLinkTarget:   linkEl ? (linkEl.getAttribute('target') || '') : '',
          originalLinkRel:      linkEl ? (linkEl.getAttribute('rel')    || '') : '',
          saveEl:               saveEl || null,
          caravanSave:          saveEl ? saveEl.getAttribute('data-caravan-save') : null,
          originalSave:         saveEl ? saveEl.textContent : '',
        });
      }
    );
  }

  var SWAP_FADE_MS = 160; // fade-out duration before swapping content

  function applyVehicleMode(vehicle) {
    if (!servicesGrid || !cardMeta.length) return;
    var isCaravan = vehicle === 'caravan';

    servicesGrid.classList.add('is-switching');

    setTimeout(function () {
      cardMeta.forEach(function (meta) {

        if (meta.isCaravanUnavailable) {
          // ── Touch Up: fully hidden in caravan mode ───────────────────────
          meta.cardEl.classList.toggle('service-card--caravan-hidden', isCaravan);

        } else {
          // ── Priced caravan cards (Tier 1 / 2 / 3) ──────────────────────

          // Pyramid top-row class (Tier 1 only)
          if (meta.isCaravanTop) {
            meta.cardEl.classList.toggle('service-card--caravan-top', isCaravan);
          }

          // Price value
          if (meta.priceEl) {
            meta.priceEl.textContent = (isCaravan && meta.caravanPrice)
              ? meta.caravanPrice
              : meta.originalPrice;
            meta.priceEl.classList.remove('spec__value--on-request');
          }

          // "From" label — always visible for priced cards
          if (meta.labelEl) {
            meta.labelEl.style.visibility = '';
          }

          // Qualifier line below the price
          if (meta.qualifierEl) {
            meta.qualifierEl.style.display = isCaravan ? 'block' : '';
          }

          // Save text (Tier 3 only)
          if (meta.saveEl) {
            meta.saveEl.textContent = (isCaravan && meta.caravanSave)
              ? meta.caravanSave
              : meta.originalSave;
          }

          // CTA link
          if (meta.linkEl) {
            if (isCaravan) {
              meta.linkEl.setAttribute('href', '#quote');
              meta.linkEl.textContent = 'Get a quote →';
              meta.linkEl.removeAttribute('target');
              meta.linkEl.removeAttribute('rel');
            } else {
              meta.linkEl.setAttribute('href', meta.originalLinkHref);
              meta.linkEl.textContent = meta.originalLinkText;
              if (meta.originalLinkTarget) {
                meta.linkEl.setAttribute('target', meta.originalLinkTarget);
              } else {
                meta.linkEl.removeAttribute('target');
              }
              if (meta.originalLinkRel) {
                meta.linkEl.setAttribute('rel', meta.originalLinkRel);
              } else {
                meta.linkEl.removeAttribute('rel');
              }
            }
          }
        }
      });

      servicesGrid.classList.remove('is-switching');
    }, SWAP_FADE_MS);
  }

  // ── Service card link handler ─────────────────────────────────────────────
  // "Book this →" (external href, car mode): intercept, pre-fill the quote
  // form with the matching tier and vehicle type, then scroll to #quote.
  // "Get a quote →" (hash href, caravan mode): Lenis-scroll + pre-fill form.
  // ─────────────────────────────────────────────────────────────────────────
  if (servicesSection) {
    servicesSection.addEventListener('click', function (e) {
      var link = e.target.closest('.service-card__link');
      if (!link) return;

      var href       = link.getAttribute('href');
      var card       = link.closest('[data-quote-service]');
      var serviceKey = card ? card.getAttribute('data-quote-service') : null;
      var vehicle    = servicesSection.getAttribute('data-vehicle') || 'car';

      function scrollToEl(el) {
        if (!el) return;
        if (lenis) {
          lenis.scrollTo(el, { offset: -80, duration: 1.2 });
        } else {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // External "Book this →": redirect to the quote form with pre-selection
      if (href && href.charAt(0) !== '#' && serviceKey) {
        e.preventDefault();
        quotePreselect(vehicle, serviceKey);
        scrollToEl(document.getElementById('quote'));
        return;
      }

      // Hash link ("Get a quote →" in caravan mode): scroll + pre-fill
      if (href && href.charAt(0) === '#') {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          if (serviceKey) quotePreselect(vehicle, serviceKey);
          scrollToEl(target);
        }
      }
    });
  }

  var vehicleToggleBtns = Array.prototype.slice.call(
    document.querySelectorAll('.vehicle-toggle .vehicle-toggle__btn[role="tab"]')
  );

  function selectVehicleTab(activeBtn) {
    vehicleToggleBtns.forEach(function (btn) {
      var isActive = btn === activeBtn;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
    });
    var vehicle = activeBtn.getAttribute('data-vehicle');
    if (servicesSection) {
      servicesSection.setAttribute('data-vehicle', vehicle);
    }
    applyVehicleMode(vehicle);
  }

  vehicleToggleBtns.forEach(function (btn, idx) {
    // Initial tabindex: only the selected tab is in the tab order
    btn.tabIndex = btn.getAttribute('aria-selected') === 'true' ? 0 : -1;

    btn.addEventListener('click', function () {
      selectVehicleTab(btn);
    });

    btn.addEventListener('keydown', function (e) {
      var len = vehicleToggleBtns.length;
      var newIdx = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        newIdx = (idx + 1) % len;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        newIdx = (idx - 1 + len) % len;
      } else if (e.key === 'Home') {
        newIdx = 0;
      } else if (e.key === 'End') {
        newIdx = len - 1;
      }
      if (newIdx !== -1) {
        e.preventDefault();
        selectVehicleTab(vehicleToggleBtns[newIdx]);
        vehicleToggleBtns[newIdx].focus();
      }
    });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ── Work badge → service card highlight ──────────────────────────────────
  // Each .work-badge anchor href points to a service card ID.
  // After Lenis finishes scrolling (1.2s duration + buffer), the matching
  // service card gets a brief border+glow pulse via .service-card--highlight.
  document.querySelectorAll('a.work-badge[href^="#"]').forEach(function (badge) {
    badge.addEventListener('click', function () {
      var id = badge.getAttribute('href').slice(1);
      var card = document.getElementById(id);
      if (!card) return;
      // Reset any in-progress highlight so the animation can restart cleanly
      card.classList.remove('service-card--highlight');
      setTimeout(function () {
        void card.offsetWidth; // force reflow — restarts CSS animation
        card.classList.add('service-card--highlight');
        card.addEventListener('animationend', function () {
          card.classList.remove('service-card--highlight');
        }, { once: true });
      }, 1350); // 1.2s scroll + 150ms safety buffer
    });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ── Add-ons & Extras collapsible panel ───────────────────────────────────
  var addonsTrigger = document.getElementById('addons-trigger');
  var addonsPanel   = document.getElementById('addons-panel');

  if (addonsTrigger && addonsPanel) {
    addonsTrigger.addEventListener('click', function () {
      var isOpen = addonsTrigger.getAttribute('aria-expanded') === 'true';
      addonsTrigger.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        addonsPanel.classList.remove('is-open');
      } else {
        addonsPanel.classList.add('is-open');
      }
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Get a Quote form ─────────────────────────────────────────────────────
  // Populates the service <select> and add-on checkboxes from PRICING, keeps
  // the estimate block live, and assigns the real quotePreselect() so the
  // Services section "Book this →" buttons can pre-fill the form.
  // ─────────────────────────────────────────────────────────────────────────
  var quoteVehicleEl     = document.getElementById('quote-vehicle');
  var quoteServiceEl     = document.getElementById('quote-service');
  var quoteCheckboxes    = document.querySelector('.quote__checkboxes');
  var quoteEstValueEl    = document.querySelector('.quote__estimate-value');
  var quoteEstNoteEl     = document.querySelector('.quote__estimate-note');
  var quoteAddonsClearBtn = document.getElementById('quote-addons-clear');

  var QUOTE_NOTE_EMPTY  = 'Julian confirms your final price after reviewing your request.';
  var QUOTE_NOTE_FILLED = 'Estimate only \u2014 Julian confirms your final price. Very dirty or heavily soiled vehicles may cost a little more for the extra time and product.';
  var QUOTE_PLACEHOLDER = 'Select a service to see your estimate.';

  // Price tween state — null means the estimate is in the empty/placeholder state
  var quoteDisplayedPrice = null;
  var quotePriceTween     = null;

  // Render add-on checkboxes from PRICING (names + "from $X" price inline)
  if (quoteCheckboxes) {
    quoteCheckboxes.innerHTML = '';
    PRICING.addons.forEach(function (addon) {
      var label  = document.createElement('label');
      label.className = 'quote__checkbox-label';

      var input  = document.createElement('input');
      input.className = 'quote__checkbox';
      input.type  = 'checkbox';
      input.name  = 'addons';
      input.value = addon.value;

      var custom = document.createElement('span');
      custom.className = 'quote__checkbox-custom';
      custom.setAttribute('aria-hidden', 'true');

      label.appendChild(input);
      label.appendChild(custom);
      label.appendChild(document.createTextNode(addon.label + ' \u2014 from $' + addon.price));

      quoteCheckboxes.appendChild(label);
    });
  }

  // Rebuild service <select> options for the given vehicle type.
  // Caravan mode hides any service where caravan === null (Touch Up).
  // Preserves the current selection when options survive the rebuild.
  function quotePopulateServices(vehicle) {
    if (!quoteServiceEl) return;
    var isCaravan  = vehicle === 'caravan';
    var currentVal = quoteServiceEl.value;

    quoteServiceEl.innerHTML = '';

    var placeholder = document.createElement('option');
    placeholder.value    = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Select a service';
    quoteServiceEl.appendChild(placeholder);

    PRICING.services.forEach(function (service) {
      if (isCaravan && service.caravan === null) return;
      var price = isCaravan ? service.caravan : service.car;
      var opt   = document.createElement('option');
      opt.value = service.value;
      opt.textContent = service.label + ' (from $' + price + ')';
      if (service.value === currentVal) {
        opt.selected        = true;
        placeholder.selected = false;
      }
      quoteServiceEl.appendChild(opt);
    });
  }

  // Tween the displayed price integer from `from` to `to` over ~400 ms (ease-out).
  // Respects prefers-reduced-motion — updates instantly when set.
  function quoteAnimatePrice(from, to) {
    if (quotePriceTween !== null) {
      cancelAnimationFrame(quotePriceTween);
      quotePriceTween = null;
    }

    quoteEstValueEl.classList.remove('quote__estimate-value--placeholder');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      quoteEstValueEl.textContent = 'from $' + to;
      return;
    }

    var startTs  = null;
    var duration = 400;

    function step(ts) {
      if (!startTs) startTs = ts;
      var progress = Math.min((ts - startTs) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      quoteEstValueEl.textContent = 'from $' + Math.round(from + (to - from) * eased);
      if (progress < 1) {
        quotePriceTween = requestAnimationFrame(step);
      } else {
        quotePriceTween = null;
      }
    }

    quotePriceTween = requestAnimationFrame(step);
  }

  // Recalculate and render the estimate: service base + checked add-on totals.
  function quoteUpdateEstimate() {
    if (!quoteEstValueEl) return;
    var isCaravan    = quoteVehicleEl ? quoteVehicleEl.value === 'caravan' : false;
    var serviceVal   = quoteServiceEl ? quoteServiceEl.value : '';
    var servicePrice = 0;
    var serviceFound = false;

    PRICING.services.forEach(function (s) {
      if (s.value === serviceVal) {
        servicePrice = isCaravan ? (s.caravan || 0) : s.car;
        serviceFound = true;
      }
    });

    var addonTotal = 0;
    if (quoteCheckboxes) {
      Array.prototype.forEach.call(
        quoteCheckboxes.querySelectorAll('.quote__checkbox:checked'),
        function (input) {
          PRICING.addons.forEach(function (a) {
            if (a.value === input.value) addonTotal += a.price;
          });
        }
      );
    }

    if (!serviceFound) {
      // Cancel any running tween and show placeholder
      if (quotePriceTween !== null) {
        cancelAnimationFrame(quotePriceTween);
        quotePriceTween = null;
      }
      quoteDisplayedPrice = null;
      quoteEstValueEl.textContent = QUOTE_PLACEHOLDER;
      quoteEstValueEl.classList.add('quote__estimate-value--placeholder');
      if (quoteEstNoteEl) quoteEstNoteEl.textContent = QUOTE_NOTE_EMPTY;
    } else {
      var newPrice = servicePrice + addonTotal;
      if (quoteDisplayedPrice !== newPrice) {
        if (quoteDisplayedPrice === null) {
          // First value after placeholder — show instantly, no tween
          quoteEstValueEl.classList.remove('quote__estimate-value--placeholder');
          quoteEstValueEl.textContent = 'from $' + newPrice;
          if (quotePriceTween !== null) {
            cancelAnimationFrame(quotePriceTween);
            quotePriceTween = null;
          }
        } else {
          // Animate from previous displayed price to the new one
          quoteAnimatePrice(quoteDisplayedPrice, newPrice);
        }
        quoteDisplayedPrice = newPrice;
      }
      if (quoteEstNoteEl) quoteEstNoteEl.textContent = QUOTE_NOTE_FILLED;
    }
  }

  // Show/hide the Clear button based on whether any add-on is ticked.
  function quoteUpdateAddonsClear() {
    if (!quoteAddonsClearBtn || !quoteCheckboxes) return;
    quoteAddonsClearBtn.hidden = !quoteCheckboxes.querySelector('.quote__checkbox:checked');
  }

  // Assign the real implementation (replaces the no-op stub declared earlier).
  // Sets vehicle type, rebuilds service options, pre-selects the tier, updates estimate.
  quotePreselect = function (vehicle, serviceKey) {
    if (!quoteVehicleEl || !quoteServiceEl) return;
    quoteVehicleEl.value = vehicle;
    quotePopulateServices(vehicle);
    if (serviceKey) quoteServiceEl.value = serviceKey;
    quoteUpdateEstimate();
  };

  if (quoteVehicleEl && quoteServiceEl) {
    quotePopulateServices(quoteVehicleEl.value || 'car');
    quoteUpdateEstimate();

    quoteVehicleEl.addEventListener('change', function () {
      quotePopulateServices(this.value);
      quoteUpdateEstimate();
    });
    quoteServiceEl.addEventListener('change', quoteUpdateEstimate);
    if (quoteCheckboxes) {
      quoteCheckboxes.addEventListener('change', function () {
        quoteUpdateEstimate();
        quoteUpdateAddonsClear();
      });
    }
    if (quoteAddonsClearBtn) {
      quoteAddonsClearBtn.addEventListener('click', function () {
        Array.prototype.forEach.call(
          quoteCheckboxes.querySelectorAll('.quote__checkbox:checked'),
          function (input) { input.checked = false; }
        );
        quoteUpdateEstimate();
        quoteAddonsClearBtn.hidden = true;
      });
    }
  }

  // ── Quote form submission ─────────────────────────────────────────────────
  // Intercepts the native form submit, POSTs JSON to /api/quote, and shows
  // inline loading → success / error feedback without a page reload.
  // ─────────────────────────────────────────────────────────────────────────
  var quoteForm      = document.querySelector('.quote__body');
  var quoteSubmitBtn = document.querySelector('.quote__submit');
  var quoteSection   = document.getElementById('quote');

  if (quoteForm && quoteSubmitBtn) {
    // Build and inject the success panel (hidden by default)
    var quoteSuccessEl = document.createElement('div');
    quoteSuccessEl.className = 'quote__success';
    quoteSuccessEl.innerHTML =
      '<div class="quote__success-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="20 6 9 17 4 12"/>' +
        '</svg>' +
      '</div>' +
      '<h3 class="quote__success-heading">Quote sent to Julian!</h3>' +
      '<p class="quote__success-body">We\'ve forwarded your details. Julian will be in touch shortly to confirm your price and schedule.</p>';

    quoteForm.parentNode.insertBefore(quoteSuccessEl, quoteForm.nextSibling);

    // Error paragraph sits just above the submit button inside the details panel
    var quoteErrorEl = document.createElement('p');
    quoteErrorEl.className = 'quote__submit-error';
    quoteErrorEl.setAttribute('role', 'alert');
    quoteSubmitBtn.parentNode.insertBefore(quoteErrorEl, quoteSubmitBtn);

    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Hide any previous error
      quoteErrorEl.textContent = '';
      quoteErrorEl.classList.remove('is-visible');

      // Collect form data
      var fd = new FormData(quoteForm);

      // Gather checked add-on values into an array
      var addons = [];
      quoteForm.querySelectorAll('.quote__checkbox:checked').forEach(function (cb) {
        addons.push(cb.value);
      });

      var payload = {
        company:        fd.get('company')        || '',
        vehicle_type:   fd.get('vehicle_type')   || '',
        service:        fd.get('service')         || '',
        name:           fd.get('name')            || '',
        phone:          fd.get('phone')           || '',
        email:          fd.get('email')           || '',
        vehicle_model:  fd.get('vehicle_model')  || '',
        preferred_date: fd.get('preferred_date') || '',
        notes:          fd.get('notes')           || '',
        addons:         addons,
      };

      // Loading state
      quoteSubmitBtn.classList.add('quote__submit--loading');
      var originalLabel = quoteSubmitBtn.textContent;
      quoteSubmitBtn.textContent = 'Sending\u2026';
      quoteSubmitBtn.disabled = true;

      fetch('/api/quote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            // Success: swap form for the success panel
            quoteForm.style.display = 'none';
            quoteSuccessEl.classList.add('is-visible');
            if (quoteSection && lenis) {
              lenis.scrollTo(quoteSection, { offset: -80, duration: 1.0 });
            }
          } else {
            throw new Error((data && data.error) || 'Something went wrong.');
          }
        })
        .catch(function (err) {
          quoteErrorEl.textContent = err.message || 'Something went wrong — please try again.';
          quoteErrorEl.classList.add('is-visible');
          quoteSubmitBtn.classList.remove('quote__submit--loading');
          quoteSubmitBtn.textContent = originalLabel;
          quoteSubmitBtn.disabled = false;
        });
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Review Carousel ───────────────────────────────────────────────────────
  // JS injects slides (with card wrapper + avatar) and progress-bar dots.
  // Auto-advance uses requestAnimationFrame so the dot fill and the 6 s timer
  // are always in sync — pausing on hover pauses both simultaneously.
  // Arrow keys fire when the section is centred in the viewport; swipe works
  // on touch devices by tracking touchstart/touchend delta.
  // ─────────────────────────────────────────────────────────────────────────
  var REVIEWS = [
    {
      name: 'Shaun Chopra',
      stars: 5,
      text: 'Julian did my Mazda and went above and beyond to make it as good as possible \u2014 sitting in it gives me that \u2018new car feeling\u2019. He\u2019s not just another detailer in town; his determination is what sets him apart.',
    },
    {
      name: 'Bianca Jobson',
      stars: 5,
      text: 'Julian and Sean were so thorough and put so much care and detail into every step. We got both our cars done and they have never looked better!',
    },
    {
      name: 'Joshua Nikolakis',
      stars: 5,
      text: 'OJ worked as a team to make my car spotless. After not having my car cleaned for 2 months, it now looks like I picked it up brand new.',
    },
    {
      name: 'Andrew Portelli',
      stars: 5,
      text: 'Julian did my car inside and out and more than exceeded my expectations \u2014 he made it spotless and added that \u2018spark\u2019 back to the car like it was new again.',
    },
    {
      name: 'Janie Murrone',
      stars: 5,
      text: 'I couldn\u2019t be happier with the service. My car looks and feels better than the day I got it. The interior is spotless, and even the hard-to-reach areas look brand new.',
    },
  ];

  var carouselTrack  = document.querySelector('.review-carousel__track');
  var carouselPrev   = document.querySelector('.review-carousel__arrow--prev');
  var carouselNext   = document.querySelector('.review-carousel__arrow--next');
  var carouselDots   = document.querySelector('.review-carousel__dots');
  var reviewsSection = document.getElementById('reviews');
  var carouselEl     = document.querySelector('.review-carousel');

  if (carouselTrack && carouselPrev && carouselNext && carouselDots) {
    var reviewCount   = REVIEWS.length;
    var reviewCurrent = 0;
    var reviewHover   = false;
    var reviewRafId   = null;
    var reviewElapsed = 0;
    var reviewLastTs  = null;
    var swipeStartX   = null;
    var REVIEW_MS     = 6000;

    // Hidden live region — screen readers announce slide changes
    var reviewLive = document.createElement('div');
    reviewLive.className = 'visually-hidden';
    reviewLive.setAttribute('aria-live', 'polite');
    reviewLive.setAttribute('aria-atomic', 'true');
    document.body.appendChild(reviewLive);

    // Extract up to two initials from a full name
    function reviewInitials(name) {
      return name.trim().split(/\s+/).slice(0, 2).map(function (w) {
        return w.charAt(0).toUpperCase();
      }).join('');
    }

    // ── Inject slides ───────────────────────────────────────────────────
    var reviewSlides = REVIEWS.map(function (r, i) {
      var slide = document.createElement('div');
      slide.className = 'review-carousel__slide' + (i === 0 ? ' is-active' : '');
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');

      var card = document.createElement('div');
      card.className = 'review-card';

      var starsEl = document.createElement('span');
      starsEl.className = 'testimonial__stars';
      starsEl.setAttribute('aria-label', r.stars + ' out of 5 stars');
      starsEl.textContent = '★'.repeat(r.stars);

      var quoteEl = document.createElement('blockquote');
      quoteEl.className = 'testimonial__quote';
      quoteEl.textContent = r.text;

      var authorRow = document.createElement('div');
      authorRow.className = 'review-author';

      var avatarEl = document.createElement('div');
      avatarEl.className = 'review-avatar';
      avatarEl.setAttribute('aria-hidden', 'true');
      avatarEl.textContent = reviewInitials(r.name);

      var authorEl = document.createElement('p');
      authorEl.className = 'testimonial__author';
      var strong = document.createElement('strong');
      strong.textContent = r.name;
      authorEl.appendChild(strong);

      authorRow.appendChild(avatarEl);
      authorRow.appendChild(authorEl);

      card.appendChild(starsEl);
      card.appendChild(quoteEl);
      card.appendChild(authorRow);
      slide.appendChild(card);
      carouselTrack.appendChild(slide);
      return slide;
    });

    // ── Inject progress-bar dots ────────────────────────────────────────
    var reviewDotEls = REVIEWS.map(function (r, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'review-carousel__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Review ' + (i + 1) + ': ' + r.name);
      if (i === 0) { dot.setAttribute('aria-current', 'true'); }

      var fill = document.createElement('span');
      fill.className = 'review-carousel__dot-fill';
      dot.appendChild(fill);
      carouselDots.appendChild(dot);

      dot.addEventListener('click', function () { reviewGoTo(i); });
      return dot;
    });

    // Shortcut to the fill span of the currently active dot
    function getActiveFill() {
      var dot = reviewDotEls[reviewCurrent];
      return dot ? dot.querySelector('.review-carousel__dot-fill') : null;
    }

    // ── Navigate to a slide ──────────────────────────────────────────────
    function reviewGoTo(idx) {
      var prevIdx = reviewCurrent;

      // Deactivate outgoing slide and dot
      reviewSlides[prevIdx].classList.remove('is-active');
      reviewSlides[prevIdx].setAttribute('aria-hidden', 'true');
      reviewDotEls[prevIdx].classList.remove('is-active');
      reviewDotEls[prevIdx].removeAttribute('aria-current');
      var prevFill = reviewDotEls[prevIdx].querySelector('.review-carousel__dot-fill');
      if (prevFill) { prevFill.style.width = '0%'; }

      reviewCurrent = ((idx % reviewCount) + reviewCount) % reviewCount;

      // Activate incoming slide and dot
      reviewSlides[reviewCurrent].classList.add('is-active');
      reviewSlides[reviewCurrent].setAttribute('aria-hidden', 'false');
      reviewDotEls[reviewCurrent].classList.add('is-active');
      reviewDotEls[reviewCurrent].setAttribute('aria-current', 'true');

      // Reset elapsed so the new slide gets a full 6 s interval
      reviewElapsed = 0;
      reviewLastTs  = null;

      reviewLive.textContent = REVIEWS[reviewCurrent].name + ': \u201c' + REVIEWS[reviewCurrent].text + '\u201d';
    }

    // ── rAF-based auto-advance ───────────────────────────────────────────
    // reviewHover gates elapsed accumulation — the fill pauses in-place
    // while hovered and continues exactly where it left off on mouse leave.
    // Capping delta at 100 ms prevents a lurch after the tab is backgrounded.
    function reviewTick(ts) {
      reviewRafId = requestAnimationFrame(reviewTick);

      if (reviewLastTs !== null && !reviewHover) {
        reviewElapsed += Math.min(ts - reviewLastTs, 100);
        var fill = getActiveFill();
        if (fill) { fill.style.width = Math.min(reviewElapsed / REVIEW_MS * 100, 100) + '%'; }
        if (reviewElapsed >= REVIEW_MS) {
          reviewElapsed = 0;
          reviewGoTo(reviewCurrent + 1);
        }
      }
      reviewLastTs = ts;
    }

    // Start auto-advance (skip if user prefers reduced motion)
    if (!prefersReducedMotion) {
      reviewRafId = requestAnimationFrame(reviewTick);
    }

    // ── Hover pause — sets flag only; rAF loop reads it each frame ───────
    if (reviewsSection) {
      reviewsSection.addEventListener('mouseenter', function () { reviewHover = true; });
      reviewsSection.addEventListener('mouseleave', function () { reviewHover = false; });
    }

    // ── Arrow buttons ────────────────────────────────────────────────────
    carouselPrev.addEventListener('click', function () { reviewGoTo(reviewCurrent - 1); });
    carouselNext.addEventListener('click', function () { reviewGoTo(reviewCurrent + 1); });

    // ── Keyboard: left / right when the section is centred in viewport ───
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!reviewsSection) return;
      var rect = reviewsSection.getBoundingClientRect();
      var mid  = window.innerHeight / 2;
      if (rect.top > mid || rect.bottom < mid) return;
      if (e.key === 'ArrowLeft')  { reviewGoTo(reviewCurrent - 1); }
      else                        { reviewGoTo(reviewCurrent + 1); }
    });

    // ── Touch swipe (≥ 44 px horizontal delta) ───────────────────────────
    if (carouselEl) {
      carouselEl.addEventListener('touchstart', function (e) {
        swipeStartX = e.touches[0].clientX;
      }, { passive: true });

      carouselEl.addEventListener('touchend', function (e) {
        if (swipeStartX === null) return;
        var dx = e.changedTouches[0].clientX - swipeStartX;
        swipeStartX = null;
        if (Math.abs(dx) > 44) {
          reviewGoTo(dx < 0 ? reviewCurrent + 1 : reviewCurrent - 1);
        }
      }, { passive: true });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────
})();
