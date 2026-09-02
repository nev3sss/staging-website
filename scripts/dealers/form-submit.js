/**
 * scripts/dealers/form-submit.js
 * Form submission handler — posts to Cloudflare Worker with Turnstile token.
 * No PII is logged. No analytics are sent with sensitive form data.
 */
(function () {
  "use strict";

  /** Turnstile callbacks — invoked by the Turnstile widget */
  window.onTurnstileSuccess = function (token) {
    document.getElementById("submit-btn").disabled = false;
  };

  window.onTurnstileError = function () {
    window.NEV3S_DEALERS.showFeedback(
      "Security verification failed. Please refresh the page and try again.",
      "error"
    );
    document.getElementById("submit-btn").disabled = true;
  };

  window.onTurnstileExpired = function () {
    document.getElementById("submit-btn").disabled = true;
  };

  /** Collect form data into a plain object */
  function collectFormData(form) {
    var formData = new FormData(form);
    var data = {};

    // Standard text/number/date fields
    ["contactName", "email", "phone", "website", "legalName", "tradeLicenseNo",
     "tradeLicenseExpiry", "country", "city", "dealerType", "sourceChannel"
    ].forEach(function (key) {
      if (formData.has(key)) data[key] = (formData.get(key) || "").toString().trim();
    });

    // Multi-select for capabilities
    var cap = form.querySelector('[name="capabilities"]');
    if (cap && cap.options) {
      data.capabilities = Array.from(cap.options).filter(function (o) { return o.selected; })
                                  .map(function (o) { return o.value; });
    } else {
      data.capabilities = [];
    }

    return data;
  }

  /** Submit handler */
  async function handleSubmit(event) {
    event.preventDefault();

    var form = event.target;
    var submitBtn = document.getElementById("submit-btn");
    var btnLabel = submitBtn.querySelector(".btn-label");
    var btnLoading = submitBtn.querySelector(".btn-loading");

    // Client-side validation
    window.NEV3S_DEALERS.clearErrors();
    window.NEV3S_DEALERS.clearFeedback();
    if (!window.NEV3S_DEALERS.validateAll()) {
      window.NEV3S_DEALERS.showFeedback(
        "Please correct the errors above and try again.",
        "error"
      );
      return;
    }

    // Capture Turnstile token
    var turnstileInput = form.querySelector('[name="cf-turnstile-response"]') ||
                        document.querySelector('[name="cf-turnstile-response"]');
    var turnstileToken = turnstileInput ? turnstileInput.value : null;
    if (!turnstileToken) {
      window.NEV3S_DEALERS.showFeedback(
        "Please complete the security verification.",
        "error"
      );
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    if (btnLabel) btnLabel.hidden = true;
    if (btnLoading) btnLoading.hidden = false;

    try {
      var payload = collectFormData(form);
      var config = window.NEV3S_CONFIG || {};

      var response = await fetch(config.applicationEndpoint || "/api/v1/dealer-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-turnstile-token": turnstileToken,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        var result = {};
        try { result = await response.json(); } catch (_) { /* ignore */ }
        showSuccess(form, result);
      } else if (response.status === 422) {
        // Server validation errors
        var errData = {};
        try { errData = await response.json(); } catch (_) { /* ignore */ }
        if (errData.errors && Array.isArray(errData.errors)) {
          errData.errors.forEach(function (e) {
            var el = document.querySelector('[data-for="' + e.field + '"]');
            if (el) {
              el.textContent = e.message;
              el.hidden = false;
            }
          });
        }
        window.NEV3S_DEALERS.showFeedback(
          "Please correct the errors and try again.",
          "error"
        );
      } else if (response.status === 403) {
        window.NEV3S_DEALERS.showFeedback(
          "Security verification failed. Please refresh and try again.",
          "error"
        );
      } else {
        window.NEV3S_DEALERS.showFeedback(
          "Submission failed. Please try again or contact us if the problem persists.",
          "error"
        );
      }
    } catch (err) {
      // Network failure / CORS / etc.
      console.error("Form submit error:", err);
      window.NEV3S_DEALERS.showFeedback(
        "Network error. Please check your connection and try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      if (btnLabel) btnLabel.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
    }
  }

  /** Display success message + reset form */
  function showSuccess(form, result) {
    form.style.display = "none";
    var successHtml = '<div class="form-feedback success" style="padding:2rem;text-align:center;">' +
      '<h3 style="margin:0 0 1rem;font-size:1.25rem;">✓ Application Received</h3>' +
      '<p style="margin:0 0 0.5rem;">Thank you for applying to NEV3S.</p>' +
      '<p style="margin:0 0 0.5rem;">Your application reference: <strong>' + (result.applicationId || "—") + '</strong></p>' +
      '<p style="margin:0;">We will review your application within ' +
      ((window.NEV3S_CONFIG && window.NEV3S_CONFIG.reviewWindowDays) || 3) +
      ' business days and email you at the address you provided.</p>' +
      '</div>';

    var wrapper = form.parentNode;
    var successEl = document.createElement("div");
    successEl.innerHTML = successHtml;
    wrapper.insertBefore(successEl.firstChild, form);
    successEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** Attach on load */
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("dealer-application-form");
    if (!form) return;
    form.addEventListener("submit", handleSubmit);
  });
})();
