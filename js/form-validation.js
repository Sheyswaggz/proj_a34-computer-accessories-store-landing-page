/* @generated-from: task-id:c7342857-e0a9-4137-9ca3-c2ccf3c3df82 */
/* Contact Form Validation Module
   Implements client-side validation with accessibility support
   ================================================== */

(function() {
  'use strict';

  const VALIDATION_RULES = Object.freeze({
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']+$/,
      errorMessages: {
        required: 'Name is required',
        minLength: 'Name must be at least 2 characters',
        maxLength: 'Name must not exceed 100 characters',
        pattern: 'Name contains invalid characters'
      }
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 255,
      errorMessages: {
        required: 'Email address is required',
        pattern: 'Please enter a valid email address',
        maxLength: 'Email must not exceed 255 characters'
      }
    },
    phone: {
      required: true,
      pattern: /^[\d\s\-\+\(\)]+$/,
      minLength: 10,
      maxLength: 20,
      errorMessages: {
        required: 'Phone number is required',
        pattern: 'Please enter a valid phone number',
        minLength: 'Phone number must be at least 10 digits',
        maxLength: 'Phone number is too long'
      }
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 1000,
      errorMessages: {
        required: 'Message is required',
        minLength: 'Message must be at least 10 characters',
        maxLength: 'Message must not exceed 1000 characters'
      }
    }
  });

  const STATE = {
    form: null,
    fields: {},
    isSubmitting: false,
    validationTimeout: null
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
      console.error(`[FormValidation] [${timestamp}] ${message}`, context);
    } else if (level === 'warn') {
      console.warn(`[FormValidation] [${timestamp}] ${message}`, context);
    } else {
      console.info(`[FormValidation] [${timestamp}] ${message}`, context);
    }

    return logEntry;
  }

  function sanitizeInput(value) {
    if (typeof value !== 'string') {
      return '';
    }

    return value
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 10000);
  }

  function validateField(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];

    if (!rules) {
      logStructured('warn', 'No validation rules found for field', { fieldName: fieldName });
      return { valid: true };
    }

    const sanitizedValue = sanitizeInput(value);

    if (rules.required && !sanitizedValue) {
      return {
        valid: false,
        error: rules.errorMessages.required
      };
    }

    if (sanitizedValue && rules.minLength && sanitizedValue.length < rules.minLength) {
      return {
        valid: false,
        error: rules.errorMessages.minLength
      };
    }

    if (sanitizedValue && rules.maxLength && sanitizedValue.length > rules.maxLength) {
      return {
        valid: false,
        error: rules.errorMessages.maxLength
      };
    }

    if (sanitizedValue && rules.pattern && !rules.pattern.test(sanitizedValue)) {
      return {
        valid: false,
        error: rules.errorMessages.pattern
      };
    }

    return { valid: true, value: sanitizedValue };
  }

  function displayFieldError(fieldElement, errorMessage) {
    if (!fieldElement) {
      return;
    }

    const errorId = fieldElement.getAttribute('aria-describedby');
    const errorElement = errorId ? document.getElementById(errorId) : null;

    fieldElement.setAttribute('aria-invalid', 'true');

    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
    }

    fieldElement.classList.add('field-error');

    logStructured('info', 'Field error displayed', {
      field: fieldElement.id,
      error: errorMessage
    });
  }

  function clearFieldError(fieldElement) {
    if (!fieldElement) {
      return;
    }

    const errorId = fieldElement.getAttribute('aria-describedby');
    const errorElement = errorId ? document.getElementById(errorId) : null;

    fieldElement.setAttribute('aria-invalid', 'false');

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    fieldElement.classList.remove('field-error');
  }

  function handleFieldValidation(fieldElement) {
    if (!fieldElement) {
      return;
    }

    const fieldName = fieldElement.name;
    const fieldValue = fieldElement.value;

    const validationResult = validateField(fieldName, fieldValue);

    if (!validationResult.valid) {
      displayFieldError(fieldElement, validationResult.error);
      return false;
    } else {
      clearFieldError(fieldElement);
      return true;
    }
  }

  function validateForm() {
    let isValid = true;
    const errors = [];

    Object.keys(STATE.fields).forEach(function(fieldName) {
      const fieldElement = STATE.fields[fieldName];

      if (!fieldElement) {
        return;
      }

      const fieldValid = handleFieldValidation(fieldElement);

      if (!fieldValid) {
        isValid = false;
        errors.push({
          field: fieldName,
          element: fieldElement
        });
      }
    });

    if (!isValid && errors.length > 0) {
      try {
        errors[0].element.focus();
      } catch (error) {
        logStructured('warn', 'Could not focus first error field', { error: error.message });
      }
    }

    return isValid;
  }

  function showFormStatus(message, type) {
    const statusElement = document.getElementById('form-status');

    if (!statusElement) {
      logStructured('warn', 'Form status element not found');
      return;
    }

    statusElement.textContent = message;
    statusElement.className = 'form-status visible ' + type;
    statusElement.setAttribute('role', 'status');
    statusElement.setAttribute('aria-live', 'polite');

    logStructured('info', 'Form status displayed', { message: message, type: type });
  }

  function hideFormStatus() {
    const statusElement = document.getElementById('form-status');

    if (statusElement) {
      statusElement.className = 'form-status';
      statusElement.textContent = '';
    }
  }

  function setSubmitButtonState(isLoading) {
    const submitButton = STATE.form ? STATE.form.querySelector('button[type="submit"]') : null;

    if (!submitButton) {
      return;
    }

    submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitButton.disabled = isLoading;

    STATE.isSubmitting = isLoading;
  }

  function resetForm() {
    if (!STATE.form) {
      return;
    }

    STATE.form.reset();

    Object.keys(STATE.fields).forEach(function(fieldName) {
      const fieldElement = STATE.fields[fieldName];
      clearFieldError(fieldElement);
    });

    logStructured('info', 'Form reset completed');
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (STATE.isSubmitting) {
      logStructured('warn', 'Form submission already in progress');
      return;
    }

    logStructured('info', 'Form submission initiated');

    hideFormStatus();

    const isValid = validateForm();

    if (!isValid) {
      logStructured('warn', 'Form validation failed');
      showFormStatus('Please correct the errors above', 'error');
      return;
    }

    setSubmitButtonState(true);

    const formData = {
      name: sanitizeInput(STATE.fields.name.value),
      email: sanitizeInput(STATE.fields.email.value),
      phone: sanitizeInput(STATE.fields.phone.value),
      message: sanitizeInput(STATE.fields.message.value),
      timestamp: new Date().toISOString()
    };

    logStructured('info', 'Form data prepared', { formData: formData });

    setTimeout(function() {
      try {
        const randomSuccess = Math.random() > 0.1;

        if (randomSuccess) {
          logStructured('info', 'Form submission successful');
          showFormStatus('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');
          resetForm();
        } else {
          throw new Error('Simulated submission error');
        }
      } catch (error) {
        logStructured('error', 'Form submission failed', {
          error: error.message,
          stack: error.stack
        });
        showFormStatus('Something went wrong. Please try again later or contact us directly.', 'error');
      } finally {
        setSubmitButtonState(false);
      }
    }, 1500);
  }

  function setupFieldListeners() {
    Object.keys(STATE.fields).forEach(function(fieldName) {
      const fieldElement = STATE.fields[fieldName];

      if (!fieldElement) {
        return;
      }

      fieldElement.addEventListener('blur', function() {
        handleFieldValidation(fieldElement);
      });

      fieldElement.addEventListener('input', function() {
        if (STATE.validationTimeout) {
          clearTimeout(STATE.validationTimeout);
        }

        STATE.validationTimeout = setTimeout(function() {
          if (fieldElement.getAttribute('aria-invalid') === 'true') {
            handleFieldValidation(fieldElement);
          }
        }, 500);
      });

      logStructured('info', 'Field listeners attached', { field: fieldName });
    });
  }

  function initializeForm() {
    STATE.form = document.getElementById('contact-form');

    if (!STATE.form) {
      logStructured('error', 'Contact form not found in DOM');
      return false;
    }

    STATE.fields = {
      name: document.getElementById('contact-name'),
      email: document.getElementById('contact-email'),
      phone: document.getElementById('contact-phone'),
      message: document.getElementById('contact-message')
    };

    const missingFields = [];
    Object.keys(STATE.fields).forEach(function(fieldName) {
      if (!STATE.fields[fieldName]) {
        missingFields.push(fieldName);
      }
    });

    if (missingFields.length > 0) {
      logStructured('error', 'Required form fields not found', { missingFields: missingFields });
      return false;
    }

    STATE.form.addEventListener('submit', handleFormSubmit);

    setupFieldListeners();

    logStructured('info', 'Form validation initialized successfully', {
      formId: STATE.form.id,
      fields: Object.keys(STATE.fields)
    });

    return true;
  }

  function cleanup() {
    if (STATE.form) {
      STATE.form.removeEventListener('submit', handleFormSubmit);
    }

    Object.keys(STATE.fields).forEach(function(fieldName) {
      const fieldElement = STATE.fields[fieldName];
      if (fieldElement) {
        const newElement = fieldElement.cloneNode(true);
        if (fieldElement.parentNode) {
          fieldElement.parentNode.replaceChild(newElement, fieldElement);
        }
      }
    });

    STATE.form = null;
    STATE.fields = {};
    STATE.isSubmitting = false;

    if (STATE.validationTimeout) {
      clearTimeout(STATE.validationTimeout);
      STATE.validationTimeout = null;
    }

    logStructured('info', 'Form validation cleanup completed');
  }

  function getState() {
    return {
      initialized: STATE.form !== null,
      isSubmitting: STATE.isSubmitting,
      fields: Object.keys(STATE.fields)
    };
  }

  if (typeof window !== 'undefined') {
    window.FormValidation = Object.freeze({
      init: initializeForm,
      cleanup: cleanup,
      getState: getState,
      validateField: handleFieldValidation,
      version: '1.0.0'
    });

    logStructured('info', 'FormValidation module loaded');
  }

})();
