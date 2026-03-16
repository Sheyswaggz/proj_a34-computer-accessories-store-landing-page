/* @generated-from: task-id:cce15b40-5e2d-4df0-964b-95a51f388301 */
/* Kinetic Typography Animation System
   Letter-by-letter and word-by-word animations with reduced motion support
   ================================================== */

(function() {
  'use strict';

  const CONFIG = Object.freeze({
    CHARACTER_DELAY: 50,
    WORD_DELAY: 150,
    ANIMATION_DURATION: 600,
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    DEFAULT_SELECTOR: '.hero-title',
    ANIMATION_MODE: 'letter',
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  });

  const STATE = {
    animatedElements: new Set(),
    animationFrames: [],
    timeouts: [],
    prefersReducedMotion: false,
    isInitialized: false
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
      console.warn('KineticTypography: Could not listen to reduced motion changes', error);
    }

    return STATE.prefersReducedMotion;
  }

  function clearAnimationState() {
    STATE.animationFrames.forEach(function(frameId) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frameId);
      }
    });

    STATE.timeouts.forEach(function(timeoutId) {
      clearTimeout(timeoutId);
    });

    STATE.animationFrames = [];
    STATE.timeouts = [];
  }

  function createLetterSpan(char, index) {
    const span = document.createElement('span');
    span.className = 'kinetic-letter';
    span.textContent = char;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateY(20px)';
    span.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.EASING}, transform ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.EASING}`;

    if (char === ' ') {
      span.style.width = '0.25em';
    }

    return span;
  }

  function createWordSpan(word, wordIndex) {
    const span = document.createElement('span');
    span.className = 'kinetic-word';
    span.textContent = word;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateX(-20px)';
    span.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.EASING}, transform ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.EASING}`;
    span.style.marginRight = '0.25em';

    return span;
  }

  function animateLetters(container, text) {
    const fragment = document.createDocumentFragment();
    const letters = text.split('');

    letters.forEach(function(char, index) {
      const letterSpan = createLetterSpan(char, index);
      fragment.appendChild(letterSpan);
    });

    container.textContent = '';
    container.appendChild(fragment);

    const letterElements = container.querySelectorAll('.kinetic-letter');

    letterElements.forEach(function(letter, index) {
      const delay = index * CONFIG.CHARACTER_DELAY;

      const timeoutId = setTimeout(function() {
        const frameId = requestAnimationFrame(function() {
          letter.style.opacity = '1';
          letter.style.transform = 'translateY(0)';
        });

        STATE.animationFrames.push(frameId);
      }, delay);

      STATE.timeouts.push(timeoutId);
    });
  }

  function animateWords(container, text) {
    const fragment = document.createDocumentFragment();
    const words = text.split(/\s+/).filter(function(word) {
      return word.length > 0;
    });

    words.forEach(function(word, index) {
      const wordSpan = createWordSpan(word, index);
      fragment.appendChild(wordSpan);
    });

    container.textContent = '';
    container.appendChild(fragment);

    const wordElements = container.querySelectorAll('.kinetic-word');

    wordElements.forEach(function(word, index) {
      const delay = index * CONFIG.WORD_DELAY;

      const timeoutId = setTimeout(function() {
        const frameId = requestAnimationFrame(function() {
          word.style.opacity = '1';
          word.style.transform = 'translateX(0)';
        });

        STATE.animationFrames.push(frameId);
      }, delay);

      STATE.timeouts.push(timeoutId);
    });
  }

  function animateElement(element, mode) {
    if (!element) {
      console.warn('KineticTypography: Invalid element provided');
      return false;
    }

    if (STATE.animatedElements.has(element)) {
      return false;
    }

    const originalText = element.textContent.trim();

    if (!originalText) {
      return false;
    }

    element.setAttribute('aria-label', originalText);

    if (STATE.prefersReducedMotion) {
      element.style.opacity = '1';
      return true;
    }

    try {
      if (mode === 'word') {
        animateWords(element, originalText);
      } else {
        animateLetters(element, originalText);
      }

      STATE.animatedElements.add(element);
      return true;
    } catch (error) {
      console.error('KineticTypography: Animation failed', error);
      element.textContent = originalText;
      element.style.opacity = '1';
      return false;
    }
  }

  function initKineticTypography(selector, options) {
    const settings = Object.assign({}, {
      mode: CONFIG.ANIMATION_MODE,
      selector: selector || CONFIG.DEFAULT_SELECTOR
    }, options || {});

    checkReducedMotion();

    const elements = document.querySelectorAll(settings.selector);

    if (!elements.length) {
      console.info('KineticTypography: No elements found for selector:', settings.selector);
      return {
        success: true,
        elementsAnimated: 0
      };
    }

    if (STATE.prefersReducedMotion) {
      console.info('KineticTypography: Reduced motion preference detected, animations disabled');
      elements.forEach(function(element) {
        element.style.opacity = '1';
      });
      return {
        success: true,
        elementsAnimated: 0,
        reason: 'reduced-motion'
      };
    }

    if (typeof requestAnimationFrame !== 'function') {
      console.warn('KineticTypography: requestAnimationFrame not supported');
      elements.forEach(function(element) {
        element.style.opacity = '1';
      });
      return {
        success: false,
        elementsAnimated: 0,
        reason: 'no-raf-support'
      };
    }

    let animatedCount = 0;

    elements.forEach(function(element) {
      const success = animateElement(element, settings.mode);
      if (success) {
        animatedCount++;
      }
    });

    STATE.isInitialized = true;

    console.info(`KineticTypography: Initialized ${animatedCount} elements with ${settings.mode} mode`);

    return {
      success: true,
      elementsAnimated: animatedCount,
      mode: settings.mode
    };
  }

  function cleanup() {
    clearAnimationState();

    STATE.animatedElements.forEach(function(element) {
      if (element && element.style) {
        element.style.opacity = '1';
        element.style.transform = 'none';
      }
    });

    STATE.animatedElements.clear();
    STATE.isInitialized = false;

    console.info('KineticTypography: Cleanup completed');
  }

  function getState() {
    return {
      isInitialized: STATE.isInitialized,
      prefersReducedMotion: STATE.prefersReducedMotion,
      animatedCount: STATE.animatedElements.size,
      activeAnimations: STATE.timeouts.length
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initKineticTypography();
    });
  } else {
    initKineticTypography();
  }

  if (typeof window !== 'undefined') {
    window.KineticTypography = Object.freeze({
      init: initKineticTypography,
      cleanup: cleanup,
      getState: getState,
      checkReducedMotion: checkReducedMotion
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

})();
