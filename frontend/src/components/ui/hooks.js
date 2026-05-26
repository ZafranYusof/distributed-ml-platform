import { useState, useCallback } from 'react';

export function useApiError() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (apiCall, { retries = 2, onSuccess, onError } = {}) => {
    setLoading(true);
    setError(null);
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const result = await apiCall();
        setLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        attempt++;
        if (attempt > retries) {
          const errorMsg = err?.message || 'An unexpected error occurred';
          setError(errorMsg);
          setLoading(false);
          onError?.(errorMsg);
          return null;
        }
        // Wait before retry with exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, loading, execute, clearError };
}

export function useFormValidation(rules) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((field, value) => {
    const fieldRules = rules[field];
    if (!fieldRules) return '';

    for (const rule of fieldRules) {
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return rule.message || `${field} is required`;
      }
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `${field} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `${field} must be at most ${rule.max}`;
      }
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return rule.message || `${field} must be at least ${rule.minLength} characters`;
      }
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return rule.message || `${field} format is invalid`;
      }
      if (rule.custom && !rule.custom(value)) {
        return rule.message || `${field} is invalid`;
      }
    }
    return '';
  }, [rules]);

  const validateField = useCallback((field, value) => {
    const error = validate(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    setTouched(prev => ({ ...prev, [field]: true }));
    return !error;
  }, [validate]);

  const validateAll = useCallback((values) => {
    const newErrors = {};
    let isValid = true;
    const allTouched = {};

    for (const field of Object.keys(rules)) {
      const error = validate(field, values[field]);
      newErrors[field] = error;
      allTouched[field] = true;
      if (error) isValid = false;
    }

    setErrors(newErrors);
    setTouched(allTouched);
    return isValid;
  }, [rules, validate]);

  const getFieldError = useCallback((field) => {
    return touched[field] ? errors[field] : '';
  }, [errors, touched]);

  const isValid = Object.values(errors).every(e => !e) && Object.keys(touched).length > 0;

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, validateField, validateAll, getFieldError, isValid, reset };
}
