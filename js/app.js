/**
 * VOWS FOR ETERNITY - CLIENT EXPERIENCE & PAYMENT CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initPaymentGateway();
});

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

  document.querySelectorAll('.nav-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
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
    USD: { symbol: '$', select: 5000, prive: 15000, bespoke: 25000 },
    INR: { symbol: '₹', select: 350000, prive: 1050000, bespoke: 1800000 },
    GBP: { symbol: '£', select: 4000, prive: 12000, bespoke: 20000 },
    EUR: { symbol: '€', select: 4600, prive: 13800, bespoke: 23000 },
    AED: { symbol: 'AED ', select: 18500, prive: 55000, bespoke: 92000 }
  };

  let state = {
    selectedTier: 'select',
    tierTitle: 'Vows for Eternity Select',
    currency: 'USD',
    amount: 5000,
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
