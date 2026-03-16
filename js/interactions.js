/* @generated-from: task-id:cce15b40-5e2d-4df0-964b-95a51f388301 */
/* Interactive Features System
   Product card hover effects, button morphing, mobile menu, keyboard accessibility
   ================================================== */

(function() {
  'use strict';

  const CONFIG = Object.freeze({
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    TOUCH_DEVICE_QUERY: '(hover: none) and (pointer: coarse)',
    PRODUCT_CARD_SELECTOR: '.product-card',
    BUTTON_SELECTOR: 'button, .btn, .btn-add-to-cart',
    MOBILE_MENU_TOGGLE_SELECTOR: '.mobile-menu-toggle',
    NAV_MENU_SELECTOR: '.nav-menu',
    SCALE_FACTOR: 1.05,
    REDUCED_SCALE_FACTOR: 1.02,
    TRANSITION_DURATION: 300,
    DEBOUNCE_DELAY: 150
  });

  const STATE = {
    prefersReducedMotion: false,
    isTouchDevice: false,
    activeElements: new Set(),
    eventListeners: [],
    mobileMenuOpen: false,
    focusedElement: null
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
        updateAllInteractions();
      });
    } catch (error) {
      console.warn('InteractionSystem: Could not listen to reduced motion changes', error);
    }

    return STATE.prefersReducedMotion;
  }

  function checkTouchDevice() {
    if (!window.matchMedia) {
      STATE.isTouchDevice = 'ontouchstart' in window;
      return STATE.isTouchDevice;
    }

    const mediaQuery = window.matchMedia(CONFIG.TOUCH_DEVICE_QUERY);
    STATE.isTouchDevice = mediaQuery.matches || 'ontouchstart' in window;

    try {
      mediaQuery.addEventListener('change', function(event) {
        STATE.isTouchDevice = event.matches;
        updateAllInteractions();
      });
    } catch (error) {
      console.warn('InteractionSystem: Could not listen to touch device changes', error);
    }

    return STATE.isTouchDevice;
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

  function updateAllInteractions() {
    const scaleFactor = STATE.prefersReducedMotion ? CONFIG.REDUCED_SCALE_FACTOR : CONFIG.SCALE_FACTOR;

    document.querySelectorAll(CONFIG.PRODUCT_CARD_SELECTOR).forEach(function(card) {
      if (card.style) {
        card.style.setProperty('--hover-scale', scaleFactor);
      }
    });
  }

  function handleProductCardHover(event) {
    const card = event.currentTarget;

    if (!card || STATE.isTouchDevice) {
      return;
    }

    const scaleFactor = STATE.prefersReducedMotion ? CONFIG.REDUCED_SCALE_FACTOR : CONFIG.SCALE_FACTOR;

    if (event.type === 'mouseenter') {
      card.style.transform = `scale(${scaleFactor})`;
      card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      STATE.activeElements.add(card);
    } else if (event.type === 'mouseleave') {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = '';
      STATE.activeElements.delete(card);
    }
  }

  function handleProductCardTouch(event) {
    const card = event.currentTarget;

    if (!card) {
      return;
    }

    const scaleFactor = STATE.prefersReducedMotion ? CONFIG.REDUCED_SCALE_FACTOR : CONFIG.SCALE_FACTOR;

    if (event.type === 'touchstart') {
      card.style.transform = `scale(${scaleFactor})`;
      card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      STATE.activeElements.add(card);
    } else if (event.type === 'touchend' || event.type === 'touchcancel') {
      setTimeout(function() {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = '';
        STATE.activeElements.delete(card);
      }, 150);
    }
  }

  function initProductCardInteractions() {
    const cards = document.querySelectorAll(CONFIG.PRODUCT_CARD_SELECTOR);

    if (!cards.length) {
      return 0;
    }

    cards.forEach(function(card) {
      card.style.transition = `transform ${CONFIG.TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${CONFIG.TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      if (!STATE.isTouchDevice) {
        addEventListenerTracked(card, 'mouseenter', handleProductCardHover);
        addEventListenerTracked(card, 'mouseleave', handleProductCardHover);
      }

      addEventListenerTracked(card, 'touchstart', handleProductCardTouch, { passive: true });
      addEventListenerTracked(card, 'touchend', handleProductCardTouch, { passive: true });
      addEventListenerTracked(card, 'touchcancel', handleProductCardTouch, { passive: true });

      addEventListenerTracked(card, 'focus', function(event) {
        if (!STATE.isTouchDevice) {
          handleProductCardHover({ type: 'mouseenter', currentTarget: event.currentTarget });
        }
      });

      addEventListenerTracked(card, 'blur', function(event) {
        if (!STATE.isTouchDevice) {
          handleProductCardHover({ type: 'mouseleave', currentTarget: event.currentTarget });
        }
      });
    });

    return cards.length;
  }

  function handleButtonMorphing(event) {
    const button = event.currentTarget;

    if (!button) {
      return;
    }

    if (STATE.prefersReducedMotion) {
      return;
    }

    if (event.type === 'mouseenter' || event.type === 'focus') {
      button.style.transform = 'translateY(-2px)';
      STATE.activeElements.add(button);
    } else if (event.type === 'mouseleave' || event.type === 'blur') {
      button.style.transform = 'translateY(0)';
      STATE.activeElements.delete(button);
    } else if (event.type === 'mousedown') {
      button.style.transform = 'translateY(0) scale(0.98)';
    } else if (event.type === 'mouseup') {
      button.style.transform = 'translateY(-2px)';
    }
  }

  function initButtonInteractions() {
    const buttons = document.querySelectorAll(CONFIG.BUTTON_SELECTOR);

    if (!buttons.length) {
      return 0;
    }

    buttons.forEach(function(button) {
      button.style.transition = `all ${CONFIG.TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      if (!STATE.isTouchDevice) {
        addEventListenerTracked(button, 'mouseenter', handleButtonMorphing);
        addEventListenerTracked(button, 'mouseleave', handleButtonMorphing);
        addEventListenerTracked(button, 'mousedown', handleButtonMorphing);
        addEventListenerTracked(button, 'mouseup', handleButtonMorphing);
      }

      addEventListenerTracked(button, 'focus', handleButtonMorphing);
      addEventListenerTracked(button, 'blur', handleButtonMorphing);

      addEventListenerTracked(button, 'keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          button.style.transform = 'translateY(0) scale(0.98)';
        }
      });

      addEventListenerTracked(button, 'keyup', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          button.style.transform = 'translateY(-2px)';
        }
      });
    });

    return buttons.length;
  }

  function handleMobileMenuToggle() {
    STATE.mobileMenuOpen = !STATE.mobileMenuOpen;

    const navMenu = document.querySelector(CONFIG.NAV_MENU_SELECTOR);
    const toggleButton = document.querySelector(CONFIG.MOBILE_MENU_TOGGLE_SELECTOR);

    if (!navMenu) {
      return;
    }

    if (STATE.mobileMenuOpen) {
      navMenu.classList.add('mobile-menu-open');
      navMenu.setAttribute('aria-hidden', 'false');

      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'true');
      }
    } else {
      navMenu.classList.remove('mobile-menu-open');
      navMenu.setAttribute('aria-hidden', 'true');

      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function initMobileMenu() {
    const toggleButton = document.querySelector(CONFIG.MOBILE_MENU_TOGGLE_SELECTOR);
    const navMenu = document.querySelector(CONFIG.NAV_MENU_SELECTOR);

    if (!toggleButton || !navMenu) {
      return false;
    }

    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'nav-menu');
    navMenu.setAttribute('id', 'nav-menu');
    navMenu.setAttribute('aria-hidden', 'true');

    addEventListenerTracked(toggleButton, 'click', handleMobileMenuToggle);

    addEventListenerTracked(toggleButton, 'keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleMobileMenuToggle();
      }
    });

    addEventListenerTracked(document, 'keydown', function(event) {
      if (event.key === 'Escape' && STATE.mobileMenuOpen) {
        handleMobileMenuToggle();

        if (toggleButton) {
          toggleButton.focus();
        }
      }
    });

    return true;
  }

  function initKeyboardNavigation() {
    addEventListenerTracked(document, 'keydown', function(event) {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    addEventListenerTracked(document, 'mousedown', function() {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  function initInteractions() {
    checkReducedMotion();
    checkTouchDevice();

    const cardCount = initProductCardInteractions();
    const buttonCount = initButtonInteractions();
    const mobileMenuInitialized = initMobileMenu();

    initKeyboardNavigation();

    console.info(`InteractionSystem: Initialized ${cardCount} product cards, ${buttonCount} buttons, mobile menu: ${mobileMenuInitialized}`);

    return {
      success: true,
      productCards: cardCount,
      buttons: buttonCount,
      mobileMenu: mobileMenuInitialized,
      isTouchDevice: STATE.isTouchDevice,
      prefersReducedMotion: STATE.prefersReducedMotion
    };
  }

  function cleanup() {
    STATE.eventListeners.forEach(function(listener) {
      try {
        listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      } catch (error) {
        console.warn('InteractionSystem: Error removing event listener', error);
      }
    });

    STATE.eventListeners = [];
    STATE.activeElements.clear();
    STATE.mobileMenuOpen = false;

    console.info('InteractionSystem: Cleanup completed');
  }

  function getState() {
    return {
      prefersReducedMotion: STATE.prefersReducedMotion,
      isTouchDevice: STATE.isTouchDevice,
      activeElements: STATE.activeElements.size,
      mobileMenuOpen: STATE.mobileMenuOpen,
      eventListeners: STATE.eventListeners.length
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractions);
  } else {
    initInteractions();
  }

  if (typeof window !== 'undefined') {
    window.InteractionSystem = Object.freeze({
      init: initInteractions,
      cleanup: cleanup,
      getState: getState,
      checkReducedMotion: checkReducedMotion,
      checkTouchDevice: checkTouchDevice
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

})();
