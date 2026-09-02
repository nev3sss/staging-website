/**
 * scripts/dealers/form-validation.js
 * Client-side field validation — supplementary to server-side validation.
 * Server validation is always authoritative; this improves UX.
 */
(function () {
  "use strict";

  /** Field validators */
  const validators = {
    contactName: function (value) {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Full name must be at least 2 characters.";
      return null;
    },

    email: function (value) {
      if (!value.trim()) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
      return null;
    },

    phone: function (value) {
      if (!value.trim()) return "Phone number is required.";
      if (value.trim().length < 8) return "Please enter a valid phone number with country code.";
      return null;
    },

    legalName: function (value) {
      if (!value.trim()) return "Legal business name is required.";
      if (value.trim().length < 2) return "Legal business name must be at least 2 characters.";
      return null;
    },

    tradeLicenseNo: function (value) {
      if (!value.trim()) return "Trade licence number is required.";
      if (value.trim().length < 3) return "Trade licence number must be at least 3 characters.";
      return null;
    },

    tradeLicenseExpiry: function (value) {
      if (!value) return "Licence expiry date is required.";
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) <= today) return "Licence expiry date must be in the future.";
      return null;
    },

    country: function (value) {
      if (!value) return "Please select your country.";
      return null;
    },

    city: function (value) {
      if (!value.trim()) return "City is required.";
      if (value.trim().length < 2) return "City must be at least 2 characters.";
      return null;
    },

    dealerType: function (value) {
      if (!value) return "Please select your business type.";
      return null;
    },

    termsAccepted: function (checked) {
      if (!checked) return "You must accept the terms to submit your application.";
      return null;
    },
  };

  /** Validate a single field, show inline error */
  function validateField(name) {
    var input = document.getElementById(name) || document.querySelector('[name="' + name + '"]');
    if (!input || !validators[name]) return true;

    var isCheckbox = input.type === "checkbox";
    var rawValue = isCheckbox ? input.checked : input.value;
    var error = validators[name](rawValue);

    var errorEl = document.querySelector('[data-for="' + name + '"]');
    if (errorEl) {
      errorEl.textContent = error || "";
      errorEl.hidden = !error;
    }
    if (!isCheckbox) {
      input.classList.toggle("error", !!error);
    }
    return !error;
  }

  /** Validate all fields, return true if all pass */
  function validateAll() {
    var fields = Object.keys(validators);
    var allValid = true;
    fields.forEach(function (name) {
      if (!validateField(name)) allValid = false;
    });
    return allValid;
  }

  /** Attach live validation on blur */
  function attachLiveValidation() {
    var fields = Object.keys(validators);
    fields.forEach(function (name) {
      var input = document.getElementById(name) || document.querySelector('[name="' + name + '"]');
      if (!input) return;
      var eventType = input.type === "checkbox" ? "change" : "blur";
      input.addEventListener(eventType, function () { validateField(name); });
    });
  }

  /** Clear all error states */
  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
      el.hidden = true;
    });
    document.querySelectorAll(".error").forEach(function (el) {
      el.classList.remove("error");
    });
  }

  /** Show feedback message */
  function showFeedback(message, type) {
    var el = document.getElementById("form-feedback");
    if (!el) return;
    el.textContent = message;
    el.className = "form-feedback " + type;
    el.hidden = false;
    el.focus();
  }

  /** Clear feedback message */
  function clearFeedback() {
    var el = document.getElementById("form-feedback");
    if (!el) return;
    el.hidden = true;
    el.textContent = "";
    el.className = "form-feedback";
  }

  /** Expose globally */
  window.NEV3S_DEALERS = window.NEV3S_DEALERS || {};
  window.NEV3S_DEALERS.validateField = validateField;
  window.NEV3S_DEALERS.validateAll = validateAll;
  window.NEV3S_DEALERS.clearErrors = clearErrors;
  window.NEV3S_DEALERS.showFeedback = showFeedback;
  window.NEV3S_DEALERS.clearFeedback = clearFeedback;

  document.addEventListener("DOMContentLoaded", attachLiveValidation);
})();
