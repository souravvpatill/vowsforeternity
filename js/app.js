/**
 * VOWS FOR ETERNITY - CLIENT EXPERIENCE & PAYMENT CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initPaymentGateway();
  initSubtleTactility();
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

  const openDrawer = () => {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

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

  // Smooth Page Navigation Fade Transition (No Jitter)
  document.querySelectorAll('.nav-drawer-link:not(.nav-accordion-btn), .nav-accordion-content a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Handle anchor links on same page
      if (href.startsWith('#') || href.includes(window.location.pathname + '#')) {
        closeDrawer();
        return;
      }

      e.preventDefault();
      closeDrawer();
      document.body.style.transition = 'opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = href;
      }, 240);
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
  
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCvcInput = document.getElementById('cardCvc');
  const cardBrandIcon = document.getElementById('cardBrandIcon');
  const finalPayAmountEl = document.getElementById('finalPayAmount');
  const receiptReferenceEl = document.getElementById('receiptReference');
  const receiptDateEl = document.getElementById('receiptDate');
  const receiptPlanEl = document.getElementById('receiptPlan');
  const receiptAmountEl = document.getElementById('receiptAmount');
  const receiptNameEl = document.getElementById('receiptName');

  if (!modal) return;

  // Pricing Matrix per Currency & Tier
  const pricingData = {
    USD: { symbol: '$', select: 4500, prive: 7500, bespoke: 15000 },
    INR: { symbol: '₹', select: 300000, prive: 500000, bespoke: 1000000 },
    GBP: { symbol: '£', select: 3600, prive: 6000, bespoke: 12000 },
    EUR: { symbol: '€', select: 4100, prive: 6800, bespoke: 13800 },
    AED: { symbol: 'AED ', select: 16500, prive: 27500, bespoke: 55000 }
  };

  let state = {
    selectedTier: 'select',
    tierTitle: 'Prithvi: The Earth Tier',
    currency: 'USD',
    amount: 4500,
    selectedTab: 'card'
  };

  function formatPrice(val, curr) {
    const symbol = pricingData[curr].symbol;
    return symbol + Number(val).toLocaleString();
  }

  function updatePricingDisplay() {
    const tierData = pricingData[state.currency];
    const prices = {
      select: tierData.select,
      prive: tierData.prive,
      bespoke: tierData.bespoke
    };

    document.querySelectorAll('.tier-option').forEach(opt => {
      const tier = opt.getAttribute('data-tier');
      const priceEl = opt.querySelector('.tier-price');
      if (priceEl && prices[tier]) {
        priceEl.textContent = formatPrice(prices[tier], state.currency);
      }
    });

    state.amount = prices[state.selectedTier];
    if (finalPayAmountEl) {
      finalPayAmountEl.textContent = formatPrice(state.amount, state.currency);
    }
  }

  tierOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      tierOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selectedTier = opt.getAttribute('data-tier');
      state.tierTitle = opt.querySelector('.tier-name').textContent.trim();
      updatePricingDisplay();
    });
  });

  if (currencySelector) {
    currencySelector.addEventListener('change', (e) => {
      state.currency = e.target.value;
      updatePricingDisplay();
    });
  }

  paymentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      paymentTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tabPanes.forEach(pane => {
        pane.style.display = pane.getAttribute('data-tab-pane') === targetTab ? 'block' : 'none';
      });
      state.selectedTab = targetTab;
    });
  });

  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formatted;

      if (cardBrandIcon) {
        if (/^4/.test(value)) {
          cardBrandIcon.textContent = '💳 VISA';
        } else if (/^5[1-5]/.test(value) || /^2[2-7]/.test(value)) {
          cardBrandIcon.textContent = '💳 MASTERCARD';
        } else if (/^3[47]/.test(value)) {
          cardBrandIcon.textContent = '💳 AMEX';
        } else {
          cardBrandIcon.textContent = '💳 CARD';
        }
      }
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + ' / ' + value.substring(2);
      } else {
        e.target.value = value;
      }
    });
  }

  if (cardCvcInput) {
    cardCvcInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }

  function openModal(preferredTier = 'select') {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const targetTierOpt = document.querySelector(`.tier-option[data-tier="${preferredTier}"]`);
    if (targetTierOpt) {
      targetTierOpt.click();
    } else {
      updatePricingDisplay();
    }

    if (formSection) formSection.style.display = 'block';
    if (loadingSection) loadingSection.style.display = 'none';
    if (successSection) successSection.style.display = 'none';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tier = btn.getAttribute('data-tier') || 'select';
      openModal(tier);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
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
