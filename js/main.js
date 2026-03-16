/* @generated-from: task-id:cce15b40-5e2d-4df0-964b-95a51f388301 */
/* Main JavaScript Initialization
   Coordinates all modules with performance optimization and error handling
   ================================================== */

(function() {
  'use strict';

  const CONFIG = Object.freeze({
    MODULES: ['AnimationSystem', 'KineticTypography', 'InteractionSystem', 'NavigationSystem'],
    INIT_TIMEOUT: 10000,
    PERFORMANCE_MARK_PREFIX: 'app-module-',
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 500
  });

  const STATE = {
    initialized: false,
    moduleStates: {},
    initStartTime: null,
    errors: []
  };

  function logStructured(level, message, context) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      level: level,
      message: message,
      context: context || {}
    };

    if (level === 'error') {
      console.error(`[${timestamp}] ${message}`, context);
      STATE.errors.push(logEntry);
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] ${message}`, context);
    } else {
      console.info(`[${timestamp}] ${message}`, context);
    }

    return logEntry;
  }

  function performanceMark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(CONFIG.PERFORMANCE_MARK_PREFIX + name);
      } catch (error) {
        logStructured('warn', 'Could not create performance mark', { name: name, error: error.message });
      }
    }
  }

  function performanceMeasure(name, startMark) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(
          name,
          CONFIG.PERFORMANCE_MARK_PREFIX + startMark,
          CONFIG.PERFORMANCE_MARK_PREFIX + name
        );

        const measures = performance.getEntriesByName(name);

        if (measures.length > 0) {
          return measures[measures.length - 1].duration;
        }
      } catch (error) {
        logStructured('warn', 'Could not measure performance', { name: name, error: error.message });
      }
    }

    return null;
  }

  function safelyInitModule(moduleName, retryCount) {
    retryCount = retryCount || 0;

    return new Promise(function(resolve) {
      performanceMark(`${moduleName}-start`);

      if (typeof window === 'undefined') {
        logStructured('error', 'Window object not available', { module: moduleName });
        resolve({
          module: moduleName,
          success: false,
          error: 'Window not available',
          retries: retryCount
        });
        return;
      }

      const moduleObject = window[moduleName];

      if (!moduleObject) {
        logStructured('warn', 'Module not loaded', { module: moduleName });

        if (retryCount < CONFIG.RETRY_ATTEMPTS) {
          setTimeout(function() {
            safelyInitModule(moduleName, retryCount + 1).then(resolve);
          }, CONFIG.RETRY_DELAY);
          return;
        }

        resolve({
          module: moduleName,
          success: false,
          error: 'Module not found',
          retries: retryCount
        });
        return;
      }

      if (typeof moduleObject.init !== 'function') {
        logStructured('warn', 'Module has no init function', { module: moduleName });
        resolve({
          module: moduleName,
          success: false,
          error: 'No init function',
          retries: retryCount
        });
        return;
      }

      try {
        const result = moduleObject.init();

        performanceMark(`${moduleName}-end`);
        const duration = performanceMeasure(`${moduleName}-init`, `${moduleName}-start`);

        logStructured('info', `Module initialized: ${moduleName}`, {
          duration: duration,
          result: result,
          retries: retryCount
        });

        resolve({
          module: moduleName,
          success: true,
          result: result,
          duration: duration,
          retries: retryCount
        });
      } catch (error) {
        performanceMark(`${moduleName}-error`);

        logStructured('error', `Module initialization failed: ${moduleName}`, {
          error: error.message,
          stack: error.stack,
          retries: retryCount
        });

        if (retryCount < CONFIG.RETRY_ATTEMPTS) {
          setTimeout(function() {
            safelyInitModule(moduleName, retryCount + 1).then(resolve);
          }, CONFIG.RETRY_DELAY);
          return;
        }

        resolve({
          module: moduleName,
          success: false,
          error: error.message,
          stack: error.stack,
          retries: retryCount
        });
      }
    });
  }

  function initializeModules() {
    performanceMark('app-init-start');
    STATE.initStartTime = Date.now();

    logStructured('info', 'Starting application initialization', {
      modules: CONFIG.MODULES,
      timestamp: STATE.initStartTime
    });

    const initPromises = CONFIG.MODULES.map(function(moduleName) {
      return safelyInitModule(moduleName);
    });

    return Promise.all(initPromises).then(function(results) {
      performanceMark('app-init-end');
      const totalDuration = performanceMeasure('app-total-init', 'app-init-start');

      results.forEach(function(result) {
        STATE.moduleStates[result.module] = result;
      });

      const successCount = results.filter(function(r) { return r.success; }).length;
      const failureCount = results.filter(function(r) { return !r.success; }).length;

      STATE.initialized = true;

      logStructured('info', 'Application initialization completed', {
        totalDuration: totalDuration,
        successCount: successCount,
        failureCount: failureCount,
        moduleStates: STATE.moduleStates
      });

      return {
        success: true,
        totalDuration: totalDuration,
        successCount: successCount,
        failureCount: failureCount,
        modules: STATE.moduleStates
      };
    }).catch(function(error) {
      logStructured('error', 'Critical initialization error', {
        error: error.message,
        stack: error.stack
      });

      STATE.initialized = false;

      return {
        success: false,
        error: error.message,
        modules: STATE.moduleStates
      };
    });
  }

  function gracefulDegradation() {
    logStructured('warn', 'Running in degraded mode - basic functionality only');

    const basicFeatures = [
      'scroll-behavior: smooth on html element',
      'basic link navigation',
      'form submission'
    ];

    try {
      if (document.documentElement && document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
      }

      logStructured('info', 'Basic features enabled', { features: basicFeatures });
    } catch (error) {
      logStructured('error', 'Could not enable basic features', { error: error.message });
    }
  }

  function cleanupModules() {
    performanceMark('app-cleanup-start');

    logStructured('info', 'Starting application cleanup');

    CONFIG.MODULES.forEach(function(moduleName) {
      try {
        const moduleObject = window[moduleName];

        if (moduleObject && typeof moduleObject.cleanup === 'function') {
          moduleObject.cleanup();
          logStructured('info', `Module cleaned up: ${moduleName}`);
        }
      } catch (error) {
        logStructured('error', `Module cleanup failed: ${moduleName}`, {
          error: error.message
        });
      }
    });

    performanceMark('app-cleanup-end');
    performanceMeasure('app-total-cleanup', 'app-cleanup-start');

    STATE.initialized = false;
    STATE.moduleStates = {};

    logStructured('info', 'Application cleanup completed');
  }

  function getApplicationState() {
    const moduleStates = {};

    CONFIG.MODULES.forEach(function(moduleName) {
      try {
        const moduleObject = window[moduleName];

        if (moduleObject && typeof moduleObject.getState === 'function') {
          moduleStates[moduleName] = moduleObject.getState();
        } else {
          moduleStates[moduleName] = STATE.moduleStates[moduleName] || { available: false };
        }
      } catch (error) {
        moduleStates[moduleName] = { error: error.message };
      }
    });

    return {
      initialized: STATE.initialized,
      initStartTime: STATE.initStartTime,
      uptime: STATE.initStartTime ? Date.now() - STATE.initStartTime : 0,
      errors: STATE.errors,
      modules: moduleStates
    };
  }

  function handleDOMReady() {
    logStructured('info', 'DOM ready, initializing application');

    const initTimeout = setTimeout(function() {
      logStructured('error', 'Initialization timeout exceeded', {
        timeout: CONFIG.INIT_TIMEOUT
      });
      gracefulDegradation();
    }, CONFIG.INIT_TIMEOUT);

    initializeModules().then(function(result) {
      clearTimeout(initTimeout);

      if (!result.success || result.failureCount > 0) {
        logStructured('warn', 'Some modules failed to initialize', result);

        if (result.failureCount === CONFIG.MODULES.length) {
          gracefulDegradation();
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:initialized', {
          detail: result
        }));
      }
    }).catch(function(error) {
      clearTimeout(initTimeout);
      logStructured('error', 'Initialization failed catastrophically', {
        error: error.message,
        stack: error.stack
      });
      gracefulDegradation();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleDOMReady);
  } else {
    handleDOMReady();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupModules);

    window.App = Object.freeze({
      init: initializeModules,
      cleanup: cleanupModules,
      getState: getApplicationState,
      version: '1.0.0'
    });
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('error', function(event) {
      logStructured('error', 'Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null
      });
    });

    window.addEventListener('unhandledrejection', function(event) {
      logStructured('error', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

})();
