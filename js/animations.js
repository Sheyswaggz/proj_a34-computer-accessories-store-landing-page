/* @generated-from: task-id:cce15b40-5e2d-4df0-964b-95a51f388301 */
/* Scroll-Triggered Animation System
   Uses Intersection Observer API for efficient scroll animations
   ================================================== */

(function() {
  'use strict';

  const CONFIG = Object.freeze({
    THRESHOLD: 0.2,
    ROOT_MARGIN: '0px',
    ANIMATION_DURATION: 800,
    STAGGER_DELAY: 100,
    SLIDE_DISTANCE: 30,
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    OBSERVER_OPTIONS: {
      threshold: 0.2,
      rootMargin: '0px'
    }
  });

  const STATE = {
    observers: new WeakMap(),
    observedElements: new Set(),
    prefersReducedMotion: false
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

        if (event.matches) {
          disableAllAnimations();
        }
      });
    } catch (error) {
      console.warn('AnimationSystem: Could not listen to reduced motion preference changes', error);
    }

    return STATE.prefersReducedMotion;
  }

  function disableAllAnimations() {
    STATE.observedElements.forEach(function(element) {
      if (element && element.style) {
        element.style.opacity = '1';
        element.style.transform = 'none';
      }
    });
  }

  function createObserver(callback) {
    if (!window.IntersectionObserver) {
      console.warn('AnimationSystem: IntersectionObserver not supported, animations disabled');
      return null;
    }

    try {
      return new IntersectionObserver(callback, CONFIG.OBSERVER_OPTIONS);
    } catch (error) {
      console.error('AnimationSystem: Failed to create IntersectionObserver', error);
      return null;
    }
  }

  function handleIntersection(entries, observer) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) {
        return;
      }

      const element = entry.target;

      if (STATE.prefersReducedMotion) {
        element.style.opacity = '1';
        element.style.transform = 'none';
        observer.unobserve(element);
        STATE.observedElements.delete(element);
        return;
      }

      requestAnimationFrame(function() {
        element.classList.add('reveal-up');
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });

      observer.unobserve(element);
      STATE.observedElements.delete(element);
    });
  }

  function prepareElement(element, index) {
    if (!element || STATE.prefersReducedMotion) {
      return;
    }

    const delay = index * CONFIG.STAGGER_DELAY;

    element.style.opacity = '0';
    element.style.transform = `translateY(${CONFIG.SLIDE_DISTANCE}px)`;
    element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${CONFIG.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`;
  }

  function observeElements(selector, observer) {
    if (!observer) {
      return 0;
    }

    const elements = document.querySelectorAll(selector);

    if (!elements.length) {
      return 0;
    }

    elements.forEach(function(element, index) {
      prepareElement(element, index);

      try {
        observer.observe(element);
        STATE.observedElements.add(element);
      } catch (error) {
        console.error('AnimationSystem: Failed to observe element', error);
        element.style.opacity = '1';
        element.style.transform = 'none';
      }
    });

    return elements.length;
  }

  function initScrollAnimations() {
    checkReducedMotion();

    if (STATE.prefersReducedMotion) {
      console.info('AnimationSystem: Reduced motion preference detected, animations disabled');
      return {
        success: true,
        animationsEnabled: false,
        reason: 'reduced-motion'
      };
    }

    const observer = createObserver(handleIntersection);

    if (!observer) {
      return {
        success: false,
        animationsEnabled: false,
        reason: 'no-observer-support'
      };
    }

    STATE.observers.set(document, observer);

    let totalObserved = 0;

    totalObserved += observeElements('.product-card', observer);
    totalObserved += observeElements('.section-header', observer);
    totalObserved += observeElements('.info-card', observer);
    totalObserved += observeElements('[data-animate]', observer);

    console.info(`AnimationSystem: Initialized with ${totalObserved} elements observed`);

    return {
      success: true,
      animationsEnabled: true,
      elementsObserved: totalObserved
    };
  }

  function cleanup() {
    STATE.observedElements.forEach(function(element) {
      const observer = STATE.observers.get(document);
      if (observer && element) {
        try {
          observer.unobserve(element);
        } catch (error) {
          console.warn('AnimationSystem: Error during cleanup', error);
        }
      }
    });

    const observer = STATE.observers.get(document);
    if (observer && observer.disconnect) {
      observer.disconnect();
    }

    STATE.observedElements.clear();
    STATE.observers = new WeakMap();

    console.info('AnimationSystem: Cleanup completed');
  }

  function getState() {
    return {
      prefersReducedMotion: STATE.prefersReducedMotion,
      observedCount: STATE.observedElements.size,
      hasObserver: STATE.observers.has(document)
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }

  if (typeof window !== 'undefined') {
    window.AnimationSystem = Object.freeze({
      init: initScrollAnimations,
      cleanup: cleanup,
      getState: getState,
      checkReducedMotion: checkReducedMotion
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

})();
