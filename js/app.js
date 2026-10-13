/**
 * VOWS FOR ETERNITY - CLIENT EXPERIENCE & PAYMENT CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initPaymentGateway();
  initSubtleTactility();
  initMemberAuth();
});

/* --------------------------------------------------------------------------
   Subtle Tactility & Haptic Feedback
   -------------------------------------------------------------------------- */
function initSubtleTactility() {
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('button, .btn-start-conversation, .trigger-payment-modal, .footer-nav-link, .nav-drawer-link, .path-toggle-btn');
    if (target && 'vibrate' in navigator) {
      try {
        navigator.vibrate(6); // 6ms ultra-light luxury haptic tick on mobile
      } catch (err) {
        // Safe fallback if vibration permissions disabled
      }
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Dynamic Header Scroll Transition (Transparent -> Burgundy)
   -------------------------------------------------------------------------- */
function initStickyHeader() {
  const header = document.querySelector('.hero-header-bar');
  if (!header) return;

  // If header is marked as solid-header (dashboard/portal pages), keep it solid always!
  if (header.classList.contains('solid-header')) {
    header.classList.add('scrolled');
    return;
  }

  function onScroll() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial check
}

/* --------------------------------------------------------------------------
   Left Navigation Drawer Controller
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const drawer = document.getElementById('mobileNavDrawer');
  const openBtn = document.getElementById('openDrawerBtn');
  const closeBtn = document.getElementById('closeDrawerBtn');

  if (!drawer || !openBtn) return;

  let isClosing = false;

  const openDrawer = () => {
    if (isClosing) return;
    drawer.classList.add('open');
    openBtn.classList.add('active');
    if (closeBtn) closeBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = (onComplete) => {
    if (!drawer.classList.contains('open') || isClosing) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    isClosing = true;

    // Trigger Iris Rotation un-morphing back to 3 lines
    openBtn.classList.remove('active');
    if (closeBtn) closeBtn.classList.remove('active');

    // Trigger CSS slide-out & backdrop fade
    drawer.classList.remove('open');
    document.body.style.overflow = '';

    // Wait for the 0.48s smooth CSS transition to finish completely before callback
    setTimeout(() => {
      isClosing = false;
      if (typeof onComplete === 'function') onComplete();
    }, 450);
  };

  window.closeMobileDrawerGlobal = closeDrawer;

  openBtn.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeDrawer();
    });
  }

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) closeDrawer();
  });

  // OUR MEMBERSHIPS Accordion Controller: Open-on-Hover (120ms Delay) + Click Toggle
  const accordionContainer = document.querySelector('.nav-drawer-accordion');
  if (accordionContainer) {
    const accordionBtn = accordionContainer.querySelector('.nav-accordion-btn');
    const accordionContent = accordionContainer.querySelector('.nav-accordion-content');
    const accordionArrow = accordionContainer.querySelector('.nav-accordion-arrow');
    let accordionHoverTimer = null;

    const expandMemberships = () => {
      if (accordionContent) accordionContent.classList.remove('hidden');
      if (accordionArrow) accordionArrow.classList.add('rotate-180');
    };

    const collapseMemberships = () => {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('select.html') && !currentPath.includes('prive.html')) {
        if (accordionContent) accordionContent.classList.add('hidden');
        if (accordionArrow) accordionArrow.classList.remove('rotate-180');
      }
    };

    // Open on Hover
    accordionContainer.addEventListener('mouseenter', () => {
      if (accordionHoverTimer) clearTimeout(accordionHoverTimer);
      accordionHoverTimer = setTimeout(expandMemberships, 120);
    });

    accordionContainer.addEventListener('mouseleave', () => {
      if (accordionHoverTimer) clearTimeout(accordionHoverTimer);
    });

    // Click Toggle
    if (accordionBtn) {
      accordionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (accordionHoverTimer) clearTimeout(accordionHoverTimer);
        const isCurrentlyHidden = accordionContent && accordionContent.classList.contains('hidden');
        if (isCurrentlyHidden) {
          expandMemberships();
        } else {
          collapseMemberships();
        }
      });
    }
  }

  // Smooth Page Navigation Fade Transition (Smart Animate - Jitter Free)
  document.querySelectorAll('.nav-drawer-link:not(.nav-accordion-btn), .nav-subitem-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';

      // Special handler for Member Login links in drawer
      if (href.includes('#login') || link.classList.contains('trigger-login-modal') || link.classList.contains('nav-drawer-gold-link')) {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer(() => {
          if (typeof window.openMemberAuthModal === 'function') {
            window.openMemberAuthModal();
          }
        });
        return;
      }

      // Handle anchor links on same page
      if (href.startsWith('#') || href.includes(window.location.pathname + '#')) {
        closeDrawer();
        return;
      }

      e.preventDefault();

      // Smoothly fade page body during drawer closing slide
      document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';

      closeDrawer(() => {
        window.location.href = href;
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Luxury Payment Gateway Component Controller
   -------------------------------------------------------------------------- */
function initPaymentGateway() {
  const modal = document.getElementById('paymentModal');
  const openButtons = document.querySelectorAll('.trigger-payment-modal');
  const closeBtn = document.getElementById('closePaymentModal');
  const tierOptions = document.querySelectorAll('.tier-option');
  const currencySelector = document.getElementById('paymentCurrency');
  const paymentTabs = document.querySelectorAll('.payment-tab-btn');
  const tabPanes = document.querySelectorAll('.payment-tab-pane');
  
  const paymentForm = document.getElementById('luxuryPaymentForm');
  const formSection = document.getElementById('paymentFormSection');
  const loadingSection = document.getElementById('paymentLoadingSection');
  const successSection = document.getElementById('paymentSuccessSection');
  
  const receiptNameEl = document.getElementById('receiptName');
  const receiptReferenceEl = document.getElementById('receiptReference');
  const receiptPlanEl = document.getElementById('receiptPlan');
  const receiptAmountEl = document.getElementById('receiptAmount');
  const receiptDateEl = document.getElementById('receiptDate');

  if (!modal) return;

  const state = {
    tierId: 'select',
    tierTitle: 'Prithvi (The Earth Tier)',
    currency: 'USD',
    amounts: {
      USD: 499,
      INR: 40000,
      GBP: 400,
      AED: 1830
    },
    amount: 499
  };

  const currencySymbols = {
    USD: '$',
    INR: '₹',
    GBP: '£',
    AED: 'AED '
  };

  const formatPrice = (val, curr) => {
    const symbol = currencySymbols[curr] || '$';
    return `${symbol}${val.toLocaleString('en-US')}`;
  };

  const updateModalDisplay = () => {
    const displayEl = document.getElementById('displayPlanAmount');
    const inputEl = document.getElementById('customPlanAmount');
    const finalAmountEl = document.getElementById('finalPayAmount');

    state.amount = state.amounts[state.currency] || 499;
    const formatted = formatPrice(state.amount, state.currency);

    if (displayEl) displayEl.textContent = formatted;
    if (inputEl) inputEl.value = state.amount;
    if (finalAmountEl) finalAmountEl.textContent = formatted;
  };

  const openModal = (e) => {
    if (e) e.preventDefault();

    const trigger = e ? e.currentTarget : null;
    if (trigger) {
      const tierId = trigger.getAttribute('data-tier') || 'select';
      let defaultTitle = 'Prithvi (The Earth Tier)';
      let defaultUsd = 499;
      if (tierId === 'prive') {
        defaultTitle = 'Tejas (The Fire Tier)';
        defaultUsd = 749;
      } else if (tierId === 'bespoke' || tierId === 'custom') {
        defaultTitle = 'Vyom (The Space Tier)';
        defaultUsd = 999;
      }

      const tierTitle = trigger.getAttribute('data-tier-name') || defaultTitle;
      const usdAmount = parseInt(trigger.getAttribute('data-usd-amount') || defaultUsd, 10);
      
      state.tierId = tierId;
      state.tierTitle = tierTitle;
      state.amounts.USD = usdAmount;
      state.amounts.INR = usdAmount === 499 ? 40000 : (usdAmount === 749 ? 60000 : (usdAmount === 999 ? 80000 : usdAmount * 80));
      state.amounts.GBP = usdAmount === 499 ? 400 : (usdAmount === 749 ? 600 : (usdAmount === 999 ? 800 : Math.round(usdAmount * 0.8)));
      state.amounts.AED = usdAmount === 499 ? 1830 : (usdAmount === 749 ? 2750 : (usdAmount === 999 ? 3670 : Math.round(usdAmount * 3.67)));

      const titleEl = document.getElementById('modalTierTitle');
      if (titleEl) titleEl.textContent = tierTitle;

      tierOptions.forEach(opt => {
        const optTier = opt.getAttribute('data-tier-option') || opt.getAttribute('data-tier');
        if (optTier === tierId) {
          opt.classList.add('active');
          opt.classList.add('selected');
        } else {
          opt.classList.remove('active');
          opt.classList.remove('selected');
        }
      });

      updateModalDisplay();
    }

    if (formSection) formSection.style.display = 'block';
    if (loadingSection) loadingSection.style.display = 'none';
    if (successSection) successSection.style.display = 'none';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  tierOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      tierOptions.forEach(o => {
        o.classList.remove('active');
        o.classList.remove('selected');
      });
      opt.classList.add('active');
      opt.classList.add('selected');

      const tierId = opt.getAttribute('data-tier-option') || opt.getAttribute('data-tier') || 'select';
      state.tierId = tierId;

      let usdAmount = 499;
      let inrAmount = 40000;
      let gbpAmount = 400;
      let aedAmount = 1830;
      let title = 'Prithvi (The Earth Tier)';

      if (tierId === 'prive') {
        usdAmount = 749;
        inrAmount = 60000;
        gbpAmount = 600;
        aedAmount = 2750;
        title = 'Tejas (The Fire Tier)';
      } else if (tierId === 'bespoke' || tierId === 'custom') {
        usdAmount = 999;
        inrAmount = 80000;
        gbpAmount = 800;
        aedAmount = 3670;
        title = 'Vyom (The Space Tier)';
      }

      state.tierTitle = title;
      state.amounts.USD = usdAmount;
      state.amounts.INR = inrAmount;
      state.amounts.GBP = gbpAmount;
      state.amounts.AED = aedAmount;

      const titleEl = document.getElementById('modalTierTitle');
      if (titleEl) titleEl.textContent = title;

      updateModalDisplay();
    });
  });

  if (currencySelector) {
    currencySelector.addEventListener('change', (e) => {
      state.currency = e.target.value;
      updateModalDisplay();
    });
  }

  paymentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      paymentTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetPane = tab.getAttribute('data-payment-tab');
      tabPanes.forEach(pane => {
        if (pane.getAttribute('data-tab-pane') === targetPane) {
          pane.style.display = 'block';
        } else {
          pane.style.display = 'none';
        }
      });
    });
  });

  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const memberName = document.getElementById('clientFullName')?.value || 'Distinguished Member';
      const memberEmail = document.getElementById('clientEmail')?.value || 'member@vowsforeternity.com';

      if (formSection) formSection.style.display = 'none';
      if (loadingSection) loadingSection.style.display = 'block';

      try {
        const response = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: state.tierId || 'prive',
            currency: state.currency || 'USD',
            client_name: memberName,
            client_email: memberEmail,
            return_url: window.location.origin + window.location.pathname
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to initialize Stripe checkout');
        }

        if (data.url) {
          // Redirect to Stripe Hosted Checkout or Verified Return URL
          window.location.href = data.url;
          return;
        }

        // Fallback in-page receipt
        if (loadingSection) loadingSection.style.display = 'none';
        if (successSection) successSection.style.display = 'block';

        const randomRef = data.sessionId ? ('VFE-' + data.sessionId.slice(-6).toUpperCase()) : ('VFE-' + Math.floor(100000 + Math.random() * 900000));
        const today = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (receiptReferenceEl) receiptReferenceEl.textContent = randomRef;
        if (receiptDateEl) receiptDateEl.textContent = today;
        if (receiptPlanEl) receiptPlanEl.textContent = state.tierTitle;
        if (receiptAmountEl) receiptAmountEl.textContent = formatPrice(state.amount, state.currency);
        if (receiptNameEl) receiptNameEl.textContent = memberName;
      } catch (err) {
        if (loadingSection) loadingSection.style.display = 'none';
        if (formSection) formSection.style.display = 'block';
        alert(err.message || 'Payment authorization error');
      }
    });
  }

  // --- Auto-Verify Stripe Checkout Session on Return ---
  const urlParams = new URLSearchParams(window.location.search);
  const stripeSessionId = urlParams.get('session_id');
  const paymentStatus = urlParams.get('payment_status');

  if (stripeSessionId && paymentStatus === 'success') {
    fetch(`/api/payment/verify-session/${stripeSessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.invoice) {
          const inv = data.invoice;
          if (modal) modal.classList.add('open');
          if (formSection) formSection.style.display = 'none';
          if (loadingSection) loadingSection.style.display = 'none';
          if (successSection) successSection.style.display = 'block';

          if (receiptReferenceEl) receiptReferenceEl.textContent = inv.invoice_number;
          if (receiptDateEl) receiptDateEl.textContent = inv.issued_date;
          if (receiptPlanEl) receiptPlanEl.textContent = inv.tier;
          if (receiptAmountEl) receiptAmountEl.textContent = formatPrice(inv.total_amount, inv.currency);
          if (receiptNameEl) receiptNameEl.textContent = inv.client_name;

          // Update active session user's tier in sessionStorage
          try {
            const rawUser = sessionStorage.getItem('vfe_member_session');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.tier = inv.tier.replace('Vows for Eternity ', '');
              sessionStorage.setItem('vfe_member_session', JSON.stringify(u));
            }
          } catch (e) {}

          // Clean URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch(() => {});
  }

  const finishReceiptBtn = document.getElementById('finishReceiptBtn');
  if (finishReceiptBtn) {
    finishReceiptBtn.addEventListener('click', () => {
      closeModal();
      if (window.location.pathname.includes('portal.html')) {
        window.location.reload();
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Luxury Member Authentication Controller (Supabase + Modal + Portal)
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   Modern Inspired Member Authentication Controller (Sign Up / Sign In / Google)
   -------------------------------------------------------------------------- */
function initMemberAuth() {
  const modal = document.getElementById('memberAuthModal');
  const openButtons = document.querySelectorAll('a[href*="#login"], a[href*="#register"], a[href*="#signup"], .trigger-login-modal, .trigger-signup-modal, .nav-drawer-gold-link, [data-auth-trigger]');
  const closeBtns = document.querySelectorAll('#closeAuthModal, .auth-back-btn, .close-auth-btn');
  const signUpSection = document.getElementById('authSignUpSection');
  const signInSection = document.getElementById('authSignInSection');
  const switchPrompt = document.getElementById('authSwitchPrompt');
  const switchAction = document.getElementById('authSwitchAction');
  
  const loginForm = document.getElementById('memberLoginForm');
  const registerForm = document.getElementById('memberRegisterForm');

  if (!modal) return;

  // Function to switch between Sign Up & Sign In modes
  const setAuthMode = (mode = 'signup') => {
    if (mode === 'signin' || mode === 'login') {
      if (signUpSection) signUpSection.style.display = 'none';
      if (signInSection) signInSection.style.display = 'block';
      if (switchPrompt) switchPrompt.textContent = 'Not a member?';
      if (switchAction) {
        switchAction.textContent = 'Sign up';
        switchAction.setAttribute('data-target', 'signup');
      }
    } else {
      if (signUpSection) signUpSection.style.display = 'block';
      if (signInSection) signInSection.style.display = 'none';
      if (switchPrompt) switchPrompt.textContent = 'Already member?';
      if (switchAction) {
        switchAction.textContent = 'Sign in';
        switchAction.setAttribute('data-target', 'signin');
      }
    }
  };

  window.openMemberAuthModal = (e, defaultMode = 'signup') => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setAuthMode(defaultMode);

    if (typeof window.closeMobileDrawerGlobal === 'function') {
      window.closeMobileDrawerGlobal(() => {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    } else {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href') || '';
      const isLogin = href.includes('#login') || btn.classList.contains('trigger-login-modal') || btn.getAttribute('data-auth-trigger') === 'signin';
      window.openMemberAuthModal(e, isLogin ? 'signin' : 'signup');
    });
  });

  // Check URL hash on page load
  if (window.location.hash === '#login' || window.location.hash.includes('login')) {
    setTimeout(() => window.openMemberAuthModal(null, 'signin'), 150);
  } else if (window.location.hash === '#register' || window.location.hash === '#signup' || window.location.hash.includes('signup')) {
    setTimeout(() => window.openMemberAuthModal(null, 'signup'), 150);
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (switchAction) {
    switchAction.addEventListener('click', (e) => {
      e.preventDefault();
      const target = switchAction.getAttribute('data-target') || 'signin';
      setAuthMode(target);
    });
  }

  // Password Visibility Toggle
  document.querySelectorAll('.toggle-pass-btn, .auth-eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.auth-field-group, .relative');
      const passInput = group ? group.querySelector('input') : null;
      if (passInput) {
        const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passInput.setAttribute('type', type);
      }
    });
  });

  // --- Real-time Interactive Validation Checklist (Matching Inspiration Image) ---
  const regPassInput = document.getElementById('regPassword');
  const regConfirmInput = document.getElementById('regConfirmPassword');
  const regEmailInput = document.getElementById('regEmail');
  const regNameInput = document.getElementById('regFullName');

  const reqLen = document.getElementById('reqLen');
  const reqNum = document.getElementById('reqNum');
  const reqCase = document.getElementById('reqCase');

  const groupName = document.getElementById('groupRegName');
  const groupEmail = document.getElementById('groupRegEmail');
  const groupPass = document.getElementById('groupRegPass');
  const groupConfirm = document.getElementById('groupRegConfirm');

  if (regNameInput && groupName) {
    regNameInput.addEventListener('input', () => {
      if (regNameInput.value.trim().length >= 2) {
        groupName.classList.add('is-valid');
      } else {
        groupName.classList.remove('is-valid');
      }
    });
  }

  if (regEmailInput && groupEmail) {
    regEmailInput.addEventListener('input', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(regEmailInput.value.trim())) {
        groupEmail.classList.add('is-valid');
      } else {
        groupEmail.classList.remove('is-valid');
      }
    });
  }

  if (regPassInput) {
    regPassInput.addEventListener('input', () => {
      const val = regPassInput.value;
      const isLen = val.length >= 8;
      const isNum = /[0-9!@#$%^&*(),.?":{}|<>]/.test(val);
      const isCase = /[a-z]/.test(val) && /[A-Z]/.test(val);

      if (reqLen) reqLen.classList.toggle('met', isLen);
      if (reqNum) reqNum.classList.toggle('met', isNum);
      if (reqCase) reqCase.classList.toggle('met', isCase);

      if (groupPass) {
        if (isLen && isNum && isCase) {
          groupPass.classList.add('is-valid');
        } else {
          groupPass.classList.remove('is-valid');
        }
      }

      // Re-validate confirm pass
      if (regConfirmInput && regConfirmInput.value && groupConfirm) {
        groupConfirm.classList.toggle('is-valid', regConfirmInput.value === val && val.length > 0);
      }
    });
  }

  if (regConfirmInput && groupConfirm) {
    regConfirmInput.addEventListener('input', () => {
      const match = regPassInput && regPassInput.value === regConfirmInput.value && regConfirmInput.value.length > 0;
      groupConfirm.classList.toggle('is-valid', match);
    });
  }

  // --- Real Registration Form Submit Handler ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('regFullName');
      const emailInput = document.getElementById('regEmail');
      const passInput = document.getElementById('regPassword');
      const confirmInput = document.getElementById('regConfirmPassword');
      const tierInput = document.getElementById('regTier');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      let errBanner = registerForm.querySelector('.auth-error-banner');
      if (errBanner) errBanner.remove();

      if (confirmInput && passInput && confirmInput.value !== passInput.value) {
        errBanner = document.createElement('div');
        errBanner.className = 'auth-error-banner p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans rounded-xl flex items-center gap-2';
        errBanner.innerHTML = `<span>✕</span> Passwords do not match. Please re-enter.`;
        registerForm.prepend(errBanner);
        return;
      }

      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '<span>Sign Up</span>';
      if (submitBtn) {
        submitBtn.innerHTML = `<span>CREATING ACCOUNT...</span>`;
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: nameInput ? nameInput.value.trim() : 'New Candidate',
            email: emailInput ? emailInput.value.trim() : '',
            password: passInput ? passInput.value : '',
            tier: tierInput ? tierInput.value : 'Prive',
            gender: 'Male'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        localStorage.setItem('vfe_token', data.access_token);
        sessionStorage.setItem('vfe_member_session', JSON.stringify(data.user));

        closeModal();
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.style.opacity = '0';

        setTimeout(() => {
          window.location.href = 'portal.html';
        }, 300);
      } catch (err) {
        if (submitBtn) {
          submitBtn.innerHTML = originalBtnHTML;
          submitBtn.disabled = false;
        }

        errBanner = document.createElement('div');
        errBanner.className = 'auth-error-banner p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans rounded-xl flex items-center gap-2';
        errBanner.innerHTML = `<span>✕</span> ${err.message || 'Registration failed. Please try again.'}`;
        registerForm.prepend(errBanner);
      }
    });
  }

  // --- Real Login Form Submit Handler ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = loginForm.querySelector('input[type="email"]');
      const passInput = loginForm.querySelector('input[type="password"]');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      const emailVal = emailInput ? emailInput.value.trim() : '';
      const passVal = passInput ? passInput.value : '';

      let errBanner = loginForm.querySelector('.auth-error-banner');
      if (errBanner) errBanner.remove();

      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '<span>Sign In</span>';
      if (submitBtn) {
        submitBtn.innerHTML = `<span>AUTHENTICATING...</span>`;
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password: passVal })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid email or password');
        }

        localStorage.setItem('vfe_token', data.access_token);
        sessionStorage.setItem('vfe_member_session', JSON.stringify(data.user));

        closeModal();
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.style.opacity = '0';

        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'portal.html';
          }
        }, 300);
      } catch (err) {
        if (submitBtn) {
          submitBtn.innerHTML = originalBtnHTML;
          submitBtn.disabled = false;
        }

        errBanner = document.createElement('div');
        errBanner.className = 'auth-error-banner p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans rounded-xl flex items-center gap-2';
        errBanner.innerHTML = `<span>✕</span> ${err.message || 'Authentication failed. Please check your credentials.'}`;
        loginForm.prepend(errBanner);
      }
    });
  }

  // --- Google Sign-In & Sign-Up Handler ---
  document.querySelectorAll('.auth-google-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const loginEmail = document.querySelector('#memberLoginForm input[type="email"]')?.value?.trim();
      const regEmail = document.getElementById('regEmail')?.value?.trim();
      const defaultEmail = regEmail || loginEmail || 'sourav.18116@sakec.ac.in';

      const userEmail = prompt('Enter your Google Account Email to continue:', defaultEmail);
      if (!userEmail || !userEmail.trim()) return;

      const cleanEmail = userEmail.trim().toLowerCase();
      const origHTML = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-luxury" style="width:14px;height:14px;border-width:2px;display:inline-block;"></span>`;
      btn.style.pointerEvents = 'none';

      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            tier: 'Prive',
            gender: 'Male'
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Google authentication failed');
        }

        localStorage.setItem('vfe_token', data.access_token);
        sessionStorage.setItem('vfe_member_session', JSON.stringify(data.user));

        closeModal();
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.style.opacity = '0';

        setTimeout(() => {
          window.location.href = 'portal.html';
        }, 300);
      } catch (err) {
        btn.innerHTML = origHTML;
        btn.style.pointerEvents = '';
        alert(err.message || 'Google authentication failed');
      }
    });
  });

  // --- Instant VIP 1-Click Access (Red Button) ---
  document.querySelectorAll('#demoLoginBtn, #demoLoginBtn2').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'harrington.member@vowsforeternity.com',
            password: 'pass123'
          })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('vfe_token', data.access_token);
          sessionStorage.setItem('vfe_member_session', JSON.stringify(data.user));
          closeModal();
          window.location.href = 'portal.html';
        }
      } catch (err) {
        window.location.href = 'portal.html';
      }
    });
  });
}
