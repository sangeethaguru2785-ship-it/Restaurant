/* ------------------------------------------------------------------ *
 * Stackly — Authentication System (Sign In & Sign Up)
 * Role-Based Access: Admin & Customer
 * Validation: Name (alphabets only), Phone (numbers only),
 *             Email format, Strong Password & Password Match
 * ------------------------------------------------------------------ */
(function () {
  const d = document;
  const w = window;
  const STORE_KEY = "stackly_user";

  const reducedMotion = w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- *
   * Storage helpers
   * ---------------------------------------------------------------- */
  function readUser() {
    try {
      const raw = w.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.email === "string" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeUser(user) {
    try {
      w.localStorage.setItem(STORE_KEY, JSON.stringify(user));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clearUser() {
    try {
      w.localStorage.removeItem(STORE_KEY);
    } catch (_) {
      /* nothing to do */
    }
  }

  /* ---------------------------------------------------------------- *
   * Toast notification
   * ---------------------------------------------------------------- */
  const toastEl = d.getElementById("successToast");
  let toast = null;
  if (toastEl && typeof w.bootstrap !== "undefined") {
    toast = w.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
  }

  function notify(message) {
    if (!toastEl || !toast) return;
    const body = toastEl.querySelector(".toast-body");
    if (body) body.textContent = message;
    toast.show();
  }

  /* ---------------------------------------------------------------- *
   * Navbar Sign In control (for pages with navbar)
   *
   * Public pages keep this control identical in both states: the label is
   * always "Sign In" and the target is always login.html, whatever the
   * session holds. No name, username or profile label is ever painted into
   * the header — the greeting lives on the dashboard pages only, where
   * dashboard.js reads the same session and fills [data-user-name].
   * The markup and the label footprint never change, so desktop and the
   * collapsed mobile bar stay aligned exactly as they are.
   * ---------------------------------------------------------------- */
  const navLogin = d.getElementById("navLogin");
  const onAuthPage = !!d.getElementById("loginForm") || !!d.getElementById("signupForm");

  function paintNav() {
    if (!navLogin) return;
    const text = navLogin.querySelector(".navbar-login-text");

    if (text) text.textContent = "Sign In";
    navLogin.classList.remove("is-authed");
    navLogin.setAttribute("href", "login.html");
    navLogin.dataset.authLabel = "Sign In";
    navLogin.setAttribute("aria-label", "Sign in to Stackly");
    if (onAuthPage) navLogin.setAttribute("aria-current", "page");
  }

  paintNav();

  /* ---------------------------------------------------------------- *
   * Password reveal toggles
   * ---------------------------------------------------------------- */
  d.querySelectorAll("[data-pw-toggle]").forEach((button) => {
    const input = d.getElementById(button.dataset.pwToggle);
    if (!input) return;

    button.addEventListener("click", () => {
      const reveal = input.type === "password";
      const caret = input.selectionStart;

      input.type = reveal ? "text" : "password";
      button.setAttribute("aria-pressed", reveal ? "true" : "false");
      button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");

      const icon = button.querySelector(".bi");
      if (icon) icon.className = reveal ? "bi bi-eye-slash" : "bi bi-eye";

      input.focus({ preventScroll: true });
      try {
        input.setSelectionRange(caret, caret);
      } catch (_) {}
    });
  });

  /* ---------------------------------------------------------------- *
   * Validation Rules & Real-time Handlers
   * ---------------------------------------------------------------- */
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;
  const emailRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  // Min 8 chars, uppercase, lowercase, number, special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  // 1. Name input validation (Alphabets only)
  const nameField = d.getElementById("signupName");
  if (nameField) {
    const validateName = () => {
      const val = nameField.value.trim();
      const feedback = nameField.closest(".auth-field")?.querySelector(".invalid-feedback");
      if (!val) {
        nameField.setCustomValidity("Please enter your name.");
        if (feedback) feedback.textContent = "Please enter your full name.";
      } else if (!nameRegex.test(val)) {
        nameField.setCustomValidity("Alphabets only");
        if (feedback) feedback.textContent = "Name must contain alphabets and spaces only.";
      } else if (val.length < 2) {
        nameField.setCustomValidity("Too short");
        if (feedback) feedback.textContent = "Name must be at least 2 characters.";
      } else {
        nameField.setCustomValidity("");
      }
    };
    nameField.addEventListener("input", validateName);
  }

  // 2. Phone input validation (Numbers only, 10-15 digits)
  const phoneField = d.getElementById("signupPhone");
  if (phoneField) {
    const validatePhone = () => {
      // Auto-filter non-digit characters
      phoneField.value = phoneField.value.replace(/[^0-9]/g, "");
      const val = phoneField.value.trim();
      const feedback = phoneField.closest(".auth-field")?.querySelector(".invalid-feedback");
      if (!val) {
        phoneField.setCustomValidity("Please enter your phone number.");
        if (feedback) feedback.textContent = "Please enter your phone number.";
      } else if (!phoneRegex.test(val)) {
        phoneField.setCustomValidity("Numbers only (10-15 digits)");
        if (feedback) feedback.textContent = "Phone number must contain numbers only (10 to 15 digits).";
      } else {
        phoneField.setCustomValidity("");
      }
    };
    phoneField.addEventListener("input", validatePhone);
  }

  // 3. Email input validation (Strict: letters, numbers, @, and . only)
  const emailFields = [d.getElementById("loginEmail"), d.getElementById("signupEmail")];
  emailFields.forEach((field) => {
    if (!field) return;

    field.setAttribute("pattern", "[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*\\.[a-zA-Z]{2,}");
    field.setAttribute("title", "Only letters, numbers, @, and . are allowed (e.g. name@example.com)");

    field.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;
      if (!/^[a-zA-Z0-9@.]$/.test(e.key)) e.preventDefault();
    });

    const validateEmail = () => {
      // Auto-filter non-allowed characters
      const raw = field.value;
      const filtered = raw.replace(/[^a-zA-Z0-9@.]/g, "");
      if (raw !== filtered) {
        field.value = filtered;
      }
      const val = field.value.trim();
      const feedback = field.closest(".auth-field")?.querySelector(".invalid-feedback");
      if (!val) {
        field.setCustomValidity("Please enter your email.");
        if (feedback) feedback.textContent = "Please enter your email address.";
      } else if (!emailRegex.test(val)) {
        field.setCustomValidity("Invalid email");
        if (feedback) {
          feedback.textContent =
            "Please enter a valid email address (only letters, numbers, @, and . allowed, e.g. name@example.com).";
        }
      } else {
        field.setCustomValidity("");
      }
    };
    field.addEventListener("input", validateEmail);
    field.addEventListener("paste", () => setTimeout(validateEmail, 0));
  });

  // 3b. Password validation (Sign in)
  const loginPwField = d.getElementById("loginPassword");
  const loginPwHint = d.getElementById("loginPwHint");
  if (loginPwField) {
    const validateLoginPassword = () => {
      const val = loginPwField.value;
      const feedback = loginPwField.closest(".auth-field")?.querySelector(".invalid-feedback");
      if (!val) {
        loginPwField.setCustomValidity("Please enter your password.");
        if (feedback) feedback.textContent = "Please enter your password.";
        if (loginPwHint) {
          loginPwHint.textContent = "Mix uppercase, lowercase, a number and a symbol (min 8 chars).";
        }
      } else if (!passwordRegex.test(val)) {
        loginPwField.setCustomValidity("Password complexity not met.");
        if (feedback) {
          feedback.textContent =
            "Password must have at least 8 characters, with uppercase, lowercase, number, and special character.";
        }
        if (loginPwHint) {
          loginPwHint.textContent =
            "Your password must include uppercase, lowercase, a number and a special character (min 8 chars).";
        }
      } else {
        loginPwField.setCustomValidity("");
        if (loginPwHint) loginPwHint.textContent = "Password meets all requirements.";
      }
    };
    loginPwField.addEventListener("input", validateLoginPassword);
  }

  // 4. Password validation & Strength Meter (Signup)
  const signupPwField = d.getElementById("signupPassword");
  const pwMeter = d.querySelector(".pw-meter");
  const pwHint = d.getElementById("pwHint");

  if (signupPwField) {
    const scorePassword = (val) => {
      if (!val) return 0;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
      if (/\d/.test(val)) score++;
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) score++;
      return score;
    };

    const labels = ["", "Weak", "Fair", "Good", "Strong"];

    const validateSignupPassword = () => {
      const val = signupPwField.value;
      const feedback = signupPwField.closest(".auth-field")?.querySelector("[data-pw-feedback]");
      const score = scorePassword(val);

      if (pwMeter) pwMeter.dataset.level = score ? String(score) : "";
      if (pwHint) {
        pwHint.textContent = score
          ? "Password strength: " + labels[score] + " (" + (score === 4 ? "Compliant" : "Requires upper, lower, number & special char") + ")."
          : "Mix uppercase, lowercase, a number and a symbol (min 8 chars).";
      }

      if (!val) {
        signupPwField.setCustomValidity("Please create a password.");
        if (feedback) feedback.textContent = "Please create a password.";
      } else if (!passwordRegex.test(val)) {
        signupPwField.setCustomValidity("Password complexity not met.");
        if (feedback) feedback.textContent = "Password must have at least 8 characters, with uppercase, lowercase, number, and special character.";
      } else {
        signupPwField.setCustomValidity("");
      }

      // Re-validate confirmation if populated
      if (signupConfirmField && signupConfirmField.value) {
        validateConfirm();
      }
    };

    signupPwField.addEventListener("input", validateSignupPassword);
  }

  // 5. Confirm Password validation
  const signupConfirmField = d.getElementById("signupConfirm");
  const validateConfirm = () => {
    if (!signupConfirmField || !signupPwField) return;
    const val = signupConfirmField.value;
    const pwVal = signupPwField.value;
    const feedback = signupConfirmField.closest(".auth-field")?.querySelector("[data-pw-feedback]");

    if (!val) {
      signupConfirmField.setCustomValidity("Please repeat your password.");
      if (feedback) feedback.textContent = "Repeat your password to continue.";
    } else if (val !== pwVal) {
      signupConfirmField.setCustomValidity("Passwords do not match.");
      if (feedback) feedback.textContent = "Passwords do not match. Please verify.";
    } else {
      signupConfirmField.setCustomValidity("");
    }
  };

  if (signupConfirmField) {
    signupConfirmField.addEventListener("input", validateConfirm);
  }

  /* ---------------------------------------------------------------- *
   * Form Submission Handling & Role Redirection
   * ---------------------------------------------------------------- */
  function validateForm(form) {
    // Run specific field checks before native validation
    if (form.id === "loginForm") {
      const loginEmail = d.getElementById("loginEmail");
      if (loginEmail) loginEmail.dispatchEvent(new Event("input"));
      if (loginPwField) loginPwField.dispatchEvent(new Event("input"));
    }
    if (form.id === "signupForm") {
      if (nameField) nameField.dispatchEvent(new Event("input"));
      const signupEmail = d.getElementById("signupEmail");
      if (signupEmail) signupEmail.dispatchEvent(new Event("input"));
      if (phoneField) phoneField.dispatchEvent(new Event("input"));
      if (signupPwField) signupPwField.dispatchEvent(new Event("input"));
      if (signupConfirmField) validateConfirm();
    }

    form.classList.add("was-validated");
    if (form.checkValidity()) return true;

    const firstInvalid = form.querySelector(":invalid");
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }
    return false;
  }

  // Login Form Submission
  const loginForm = d.getElementById("loginForm");
  if (loginForm) {
    const known = readUser();
    const emailField = d.getElementById("loginEmail");
    if (known && emailField) emailField.value = known.email;

    // Set role radio based on known user if available
    if (known && known.role) {
      const radio = loginForm.querySelector(`input[name="role"][value="${known.role}"]`);
      if (radio) radio.checked = true;
    }

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(loginForm)) return;

      const email = emailField.value.trim();
      const existing = readUser();
      const selectedRole = loginForm.querySelector('input[name="role"]:checked')?.value || "customer";

      const name =
        existing && existing.email.toLowerCase() === email.toLowerCase() && existing.name
          ? existing.name
          : email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);

      const userSession = {
        name: name,
        email: email,
        role: selectedRole,
        lastLogin: new Date().toISOString()
      };

      writeUser(userSession);
      paintNav();

      const targetDashboard = selectedRole === "admin" ? "admin-dashboard.html" : "customer-dashboard.html";
      const roleTitle = selectedRole === "admin" ? "Admin" : "Customer";

      notify(`Signed in as ${roleTitle}! Redirecting to ${roleTitle} Dashboard...`);

      setTimeout(() => {
        w.location.href = targetDashboard;
      }, 900);
    });
  }

  // Signup Form Submission
  const signupForm = d.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(signupForm)) return;

      const name = d.getElementById("signupName").value.trim().replace(/\s+/g, " ");
      const email = d.getElementById("signupEmail").value.trim();
      const phone = d.getElementById("signupPhone").value.trim();
      const selectedRole = signupForm.querySelector('input[name="role"]:checked')?.value || "customer";

      const newUser = {
        name: name,
        email: email,
        phone: phone,
        role: selectedRole,
        joined: new Date().toISOString()
      };

      writeUser(newUser);
      paintNav();

      const targetDashboard = selectedRole === "admin" ? "admin-dashboard.html" : "customer-dashboard.html";
      const roleTitle = selectedRole === "admin" ? "Admin" : "Customer";

      notify(`Welcome, ${name.split(" ")[0]}! Account created as ${roleTitle}. Redirecting...`);

      setTimeout(() => {
        w.location.href = targetDashboard;
      }, 950);
    });
  }

  /* ---------------------------------------------------------------- *
   * GSAP Auth Screen Animations (Two-Card Split Layout)
   * ---------------------------------------------------------------- */
  if (typeof w.gsap !== "undefined" && !reducedMotion) {
    w.gsap.from(".auth-branding-card", {
      opacity: 0,
      x: -28,
      duration: 0.9,
      ease: "power2.out",
      clearProps: "all"
    });
    w.gsap.from(".auth-card", {
      opacity: 0,
      x: 28,
      duration: 0.9,
      ease: "power2.out",
      clearProps: "all"
    });

    if (w.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      d.querySelectorAll(".auth-card .btn-primary, .auth-back-link, .auth-switch-link").forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          w.gsap.to(btn, { y: -2, scale: 1.025, duration: 0.25, ease: "power2.out", overwrite: "auto" });
        });
        btn.addEventListener("mouseleave", () => {
          w.gsap.to(btn, { y: 0, scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        });
        btn.addEventListener("mousedown", () => {
          w.gsap.to(btn, { scale: 0.98, duration: 0.1, overwrite: "auto" });
        });
        btn.addEventListener("mouseup", () => {
          w.gsap.to(btn, { scale: 1.025, duration: 0.15, overwrite: "auto" });
        });
      });
    }
  }
})();