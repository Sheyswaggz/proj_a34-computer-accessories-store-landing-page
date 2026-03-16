/* @generated-from: task-id:cce15b40-5e2d-4df0-964b-95a51f388301 */
/* Smooth Scroll Navigation System
   Internal link smooth scrolling with hash updates and keyboard support
   ================================================== */

(function() {
  'use strict';

  const CONFIG = Object.freeze({
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    SCROLL_DURATION: 800,
    SCROLL_OFFSET: 80,
    EASING: 'easeInOutCubic',
    LINK_SELECTOR: 'a[href^="#"]',
    HEADER_SELECTOR: 'header',
    UPDATE_HASH: true
  });

  const STATE = {
    prefersReducedMotion: false,
    isScrolling: false,
    eventListeners: [],
    headerHeight: 0,
    scrollTimeout: null
  };

  function checkReducedMotion() {
    if (!window.matchMedia) {
      return false;
    }

    const mediaQuery = window.matchMedia(CONFIG.REDUCED_MOTION_QUERY);
    STATE.prefersReducedMotion = mediaQuery.matches;

    try {
      mediaQuery.addEventListener('change', function(event) {
        STATE.prefersReducedMotion = event.matches;
      });
    } catch (error) {
      console.warn('NavigationSystem: Could not listen to reduced motion changes', error);
    }

    return STATE.prefersReducedMotion;
  }

  function addEventListenerTracked(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    STATE.eventListeners.push({
      element: element,
      event: event,
      handler: handler,
      options: options
    });
  }

  function calculateHeaderHeight() {
    const header = document.querySelector(CONFIG.HEADER_SELECTOR);

    if (!header) {
      STATE.headerHeight = 0;
      return 0;
    }

    const computedStyle = window.getComputedStyle(header);
    const position = computedStyle.position;

    if (position === 'fixed' || position === 'sticky') {
      STATE.headerHeight = header.offsetHeight;
    } else {
      STATE.headerHeight = 0;
    }

    return STATE.headerHeight;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  function getScrollPosition(target) {
    const targetElement = document.querySelector(target);

    if (!targetElement) {
      console.warn('NavigationSystem: Target element not found:', target);
      return null;
    }

    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - STATE.headerHeight - CONFIG.SCROLL_OFFSET;

    return Math.max(0, offsetPosition);
  }

  function smoothScrollTo(targetPosition, duration) {
    return new Promise(function(resolve) {
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      function scrollAnimation(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);
        const newPosition = startPosition + distance * easeProgress;

        window.scrollTo(0, newPosition);

        if (progress < 1) {
          requestAnimationFrame(scrollAnimation);
        } else {
          STATE.isScrolling = false;
          resolve();
        }
      }

      STATE.isScrolling = true;
      requestAnimationFrame(scrollAnimation);
    });
  }

  function instantScrollTo(targetPosition) {
    return new Promise(function(resolve) {
      window.scrollTo(0, targetPosition);
      STATE.isScrolling = false;
      resolve();
    });
  }

  function updateActiveLink(hash) {
    const links = document.querySelectorAll(CONFIG.LINK_SELECTOR);

    links.forEach(function(link) {
      const linkHash = link.getAttribute('href');

      if (linkHash === hash) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  function updateUrlHash(hash) {
    if (!CONFIG.UPDATE_HASH || !hash) {
      return;
    }

    try {
      if (history.pushState) {
        history.pushState(null, null, hash);
      } else {
        window.location.hash = hash;
      }

      updateActiveLink(hash);
    } catch (error) {
      console.warn('NavigationSystem: Could not update URL hash', error);
    }
  }

  function handleNavigationClick(event) {
    const link = event.currentTarget;
    const hash = link.getAttribute('href');

    if (!hash || hash === '#') {
      return;
    }

    event.preventDefault();

    if (STATE.isScrolling) {
      return;
    }

    calculateHeaderHeight();

    const targetPosition = getScrollPosition(hash);

    if (targetPosition === null) {
      return;
    }

    const scrollPromise = STATE.prefersReducedMotion
      ? instantScrollTo(targetPosition)
      : smoothScrollTo(targetPosition, CONFIG.SCROLL_DURATION);

    scrollPromise.then(function() {
      updateUrlHash(hash);

      const targetElement = document.querySelector(hash);

      if (targetElement) {
        const focusable = targetElement.hasAttribute('tabindex') || targetElement.tagName === 'A' || targetElement.tagName === 'BUTTON';

        if (!focusable) {
          targetElement.setAttribute('tabindex', '-1');
        }

        targetElement.focus({ preventScroll: true });

        if (!focusable) {
          targetElement.addEventListener('blur', function() {
            targetElement.removeAttribute('tabindex');
          }, { once: true });
        }
      }
    }).catch(function(error) {
      console.error('NavigationSystem: Scroll error', error);
      STATE.isScrolling = false;
    });
  }

  function handleKeyboardNavigation(event) {
    const link = event.currentTarget;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      link.click();
    }
  }

  function initSmoothScrolling() {
    checkReducedMotion();
    calculateHeaderHeight();

    const links = document.querySelectorAll(CONFIG.LINK_SELECTOR);

    if (!links.length) {
      console.info('NavigationSystem: No navigation links found');
      return {
        success: true,
        linksInitialized: 0
      };
    }

    links.forEach(function(link) {
      addEventListenerTracked(link, 'click', handleNavigationClick);
      addEventListenerTracked(link, 'keydown', handleKeyboardNavigation);
    });

    addEventListenerTracked(window, 'resize', function() {
      clearTimeout(STATE.scrollTimeout);
      STATE.scrollTimeout = setTimeout(calculateHeaderHeight, 150);
    });

    if (window.location.hash) {
      setTimeout(function() {
        const targetPosition = getScrollPosition(window.location.hash);

        if (targetPosition !== null) {
          window.scrollTo(0, targetPosition);
          updateActiveLink(window.location.hash);
        }
      }, 100);
    }

    console.info(`NavigationSystem: Initialized ${links.length} navigation links`);

    return {
      success: true,
      linksInitialized: links.length,
      headerHeight: STATE.headerHeight,
      prefersReducedMotion: STATE.prefersReducedMotion
    };
  }

  function cleanup() {
    STATE.eventListeners.forEach(function(listener) {
      try {
        listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      } catch (error) {
        console.warn('NavigationSystem: Error removing event listener', error);
      }
    });

    STATE.eventListeners = [];
    STATE.isScrolling = false;

    if (STATE.scrollTimeout) {
      clearTimeout(STATE.scrollTimeout);
      STATE.scrollTimeout = null;
    }

    console.info('NavigationSystem: Cleanup completed');
  }

  function scrollToElement(selector, options) {
    const settings = Object.assign({}, {
      updateHash: CONFIG.UPDATE_HASH,
      duration: CONFIG.SCROLL_DURATION
    }, options || {});

    if (!selector) {
      console.warn('NavigationSystem: No selector provided');
      return Promise.reject(new Error('No selector provided'));
    }

    calculateHeaderHeight();

    const targetPosition = getScrollPosition(selector);

    if (targetPosition === null) {
      return Promise.reject(new Error('Target element not found'));
    }

    const scrollPromise = STATE.prefersReducedMotion
      ? instantScrollTo(targetPosition)
      : smoothScrollTo(targetPosition, settings.duration);

    if (settings.updateHash) {
      scrollPromise.then(function() {
        updateUrlHash(selector);
      });
    }

    return scrollPromise;
  }

  function getState() {
    return {
      prefersReducedMotion: STATE.prefersReducedMotion,
      isScrolling: STATE.isScrolling,
      headerHeight: STATE.headerHeight,
      eventListeners: STATE.eventListeners.length
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScrolling);
  } else {
    initSmoothScrolling();
  }

  if (typeof window !== 'undefined') {
    window.NavigationSystem = Object.freeze({
      init: initSmoothScrolling,
      cleanup: cleanup,
      getState: getState,
      scrollToElement: scrollToElement,
      checkReducedMotion: checkReducedMotion
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

})();
