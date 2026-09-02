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
    tierId: 'prive',
    tierTitle: 'Vows for Eternity Privé',
    currency: 'USD',
    amounts: {
      USD: 15000,
      INR: 1200000,
      GBP: 12000,
      AED: 55000
    },
    amount: 15000
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

    state.amount = state.amounts[state.currency] || 15000;
    const formatted = formatPrice(state.amount, state.currency);

    if (displayEl) displayEl.textContent = formatted;
    if (inputEl) inputEl.value = state.amount;
    if (finalAmountEl) finalAmountEl.textContent = formatted;
  };

  const openModal = (e) => {
    if (e) e.preventDefault();

    const trigger = e ? e.currentTarget : null;
    if (trigger) {
      const tierId = trigger.getAttribute('data-tier') || 'prive';
      const tierTitle = trigger.getAttribute('data-tier-name') || 'Vows for Eternity Privé';
      const usdAmount = parseInt(trigger.getAttribute('data-usd-amount') || '15000', 10);
      
      state.tierId = tierId;
      state.tierTitle = tierTitle;
      state.amounts.USD = usdAmount;
      state.amounts.INR = usdAmount * 80;
      state.amounts.GBP = Math.round(usdAmount * 0.8);
      state.amounts.AED = Math.round(usdAmount * 3.67);

      const titleEl = document.getElementById('modalTierTitle');
      if (titleEl) titleEl.textContent = tierTitle;

      tierOptions.forEach(opt => {
        if (opt.getAttribute('data-tier-option') === tierId) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
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
      tierOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');

      const tierId = opt.getAttribute('data-tier-option');
      state.tierId = tierId;

      let usdAmount = 15000;
      let title = 'Vows for Eternity Privé';

      if (tierId === 'select') {
        usdAmount = 5000;
        title = 'Vows for Eternity Select';
      } else if (tierId === 'custom') {
        usdAmount = 25000;
        title = 'Bespoke Global Matchmaking';
      }

      state.tierTitle = title;
      state.amounts.USD = usdAmount;
      state.amounts.INR = usdAmount * 80;
      state.amounts.GBP = Math.round(usdAmount * 0.8);
      state.amounts.AED = Math.round(usdAmount * 3.67);

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
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const memberName = document.getElementById('clientFullName')?.value || 'Distinguished Member';

      if (formSection) formSection.style.display = 'none';
      if (loadingSection) loadingSection.style.display = 'block';

      setTimeout(() => {
        if (loadingSection) loadingSection.style.display = 'none';
        if (successSection) successSection.style.display = 'block';

        const randomRef = 'VFE-' + Math.floor(100000 + Math.random() * 900000);
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
      }, 2000);
    });
  }

  const finishReceiptBtn = document.getElementById('finishReceiptBtn');
  if (finishReceiptBtn) {
    finishReceiptBtn.addEventListener('click', closeModal);
  }
}

/* --------------------------------------------------------------------------
   Luxury Member Authentication Controller (Supabase + Modal + Portal)
   -------------------------------------------------------------------------- */
function initMemberAuth() {
  const modal = document.getElementById('memberAuthModal');
  const openButtons = document.querySelectorAll('a[href*="#login"], .trigger-login-modal, .nav-drawer-gold-link');
  const closeBtn = document.getElementById('closeAuthModal');
  const tabButtons = document.querySelectorAll('.auth-tab-btn');
  const loginForm = document.getElementById('memberLoginForm');
  const registerForm = document.getElementById('memberRegisterForm');
  const demoLoginBtn = document.getElementById('demoLoginBtn');

  if (!modal) return;

  window.openMemberAuthModal = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    // Close sidebar drawer if open
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
    btn.addEventListener('click', window.openMemberAuthModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Auto-open modal if URL hash is #login
  if (window.location.hash === '#login') {
    setTimeout(() => {
      window.openMemberAuthModal();
    }, 250);
  }

  // Tab Switcher (Sign In vs Register)
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      if (target === 'login') {
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
      } else {
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
      }
    });
  });

  // Instant Demo Member Login Handler
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', () => {
      sessionStorage.setItem('vfe_member_session', JSON.stringify({
        authenticated: true,
        email: 'harrington.member@vowsforeternity.com',
        memberName: 'Lord & Lady Harrington',
        tier: 'Vows for Eternity Privé',
        concatMail: 'billing@vowsforeternity.in',
        loginTime: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }));

      closeModal();
      document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 350);
    });
  }

  // Form Submit Handler
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = loginForm.querySelector('input[type="email"]');
      const emailVal = emailInput && emailInput.value ? emailInput.value : 'distinguished.member@vowsforeternity.com';

      sessionStorage.setItem('vfe_member_session', JSON.stringify({
        authenticated: true,
        email: emailVal,
        memberName: 'Distinguished VFE Member',
        tier: 'Vows for Eternity Select',
        concatMail: 'billing@vowsforeternity.in',
        loginTime: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }));

      closeModal();
      document.body.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 350);
    });
  }
}
