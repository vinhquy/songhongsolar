/* ============================================================
   SÔNG HỒNG RENEWABLE ENERGY — Main JS
   Features:
   - Sticky header effect on scroll
   - Mobile menu toggle + close behavior
   - Smooth scroll for internal links
   - Scroll reveal animations (IntersectionObserver)
   - Counter animation for stats
   - Form validation + simulated submit feedback
   - Back-to-top button
   ============================================================ */

(function () {
  'use strict';

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const isValidVietnamPhone = (phone) => {
    // Accepts formats: 09xxxxxxxx, 03xxxxxxxx, +84xxxxxxxxx, with spaces/dots
    const normalized = phone.replace(/[\s.\-]/g, '');
    return /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(normalized);
  };

  const isValidEmail = (email) => {
    if (!email) return true; // Optional fields accepted if empty
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  };

  // -----------------------------
  // Sticky Header
  // -----------------------------
  const header = $('#header');

  const handleHeaderScroll = () => {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  handleHeaderScroll();
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  // -----------------------------
  // Mobile Menu
  // -----------------------------
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobile-nav');
  const mobileLinks = $$('.mobile-nav-link');

  const closeMobileNav = () => {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.remove('active');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const openMobileNav = () => {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.add('active');
    mobileNav.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      isOpen ? closeMobileNav() : openMobileNav();
    });

    // Close when clicking any mobile nav link
    mobileLinks.forEach((link) => link.addEventListener('click', closeMobileNav));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });

    // Close when resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  // -----------------------------
  // Smooth Scroll for Anchor Links
  // -----------------------------
  const internalLinks = $$('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();

      // Offset for fixed header
      const headerOffset = 72;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });

  // -----------------------------
  // Scroll Reveal Animations
  // -----------------------------
  const revealItems = $$('.fade-up');

  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    // Fallback for old browsers
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  // -----------------------------
  // Stats Counter Animation
  // -----------------------------
  const statNumbers = $$('.stat-number');
  let statsStarted = false;

  const animateCounter = (el, target, duration = 1600) => {
    const hasMw = el.innerHTML.includes('MW+');
    const hasPlus = !hasMw && el.innerHTML.includes('+');
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(target * eased);

      if (hasMw) {
        el.innerHTML = `${current}<span>MW+</span>`;
      } else if (hasPlus) {
        el.innerHTML = `${current}<span>+</span>`;
      } else {
        el.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const statsSection = $('#stats');

  if (statsSection && statNumbers.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || statsStarted) return;

          statsStarted = true;
          statNumbers.forEach((stat, index) => {
            const target = parseInt(stat.dataset.target || '0', 10);
            setTimeout(() => animateCounter(stat, target), index * 150);
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    statsObserver.observe(statsSection);
  }

  // -----------------------------
  // Toast Notification
  // -----------------------------
  const toast = $('#toast');
  let toastTimeout;

  const showToast = (message, type = 'success') => {
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = type === 'error' ? '#b91c1c' : '#1a6e3c';
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // -----------------------------
  // Form Handling
  // -----------------------------
  const leadForm = $('#leadFormEl');
  const ctaForm = $('#ctaFormEl');

  const setFieldError = (field, message) => {
    field.style.borderColor = '#dc2626';
    field.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.12)';

    // Only one error hint per field
    let hint = field.parentElement.querySelector('.error-hint');
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'error-hint';
      hint.style.color = '#dc2626';
      hint.style.fontSize = '0.75rem';
      hint.style.display = 'block';
      hint.style.marginTop = '6px';
      field.parentElement.appendChild(hint);
    }
    hint.textContent = message;
  };

  const clearFieldError = (field) => {
    field.style.borderColor = '';
    field.style.boxShadow = '';
    const hint = field.parentElement.querySelector('.error-hint');
    if (hint) hint.remove();
  };

  const validateRequired = (field, label) => {
    if (!field || !field.value.trim()) {
      setFieldError(field, `${label} là thông tin bắt buộc.`);
      return false;
    }
    clearFieldError(field);
    return true;
  };

  const simulateSubmit = (form, submitBtn, successMessage) => {
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.8';
    submitBtn.innerHTML = 'Đang gửi thông tin...';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.innerHTML = originalText;
      form.reset();
      showToast(successMessage);
    }, 1200);
  };

  const bindLiveValidation = (form) => {
    if (!form) return;
    const fields = $$('input, select', form);

    fields.forEach((field) => {
      field.addEventListener('input', () => clearFieldError(field));
      field.addEventListener('change', () => clearFieldError(field));
    });
  };

  if (leadForm) {
    bindLiveValidation(leadForm);

    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = $('#lead-name');
      const phone = $('#lead-phone');
      const email = $('#lead-email');
      const province = $('#lead-province');
      const type = $('#lead-type');

      const checks = [
        validateRequired(name, 'Họ và tên'),
        validateRequired(phone, 'Số điện thoại'),
        validateRequired(province, 'Tỉnh/Thành phố'),
        validateRequired(type, 'Loại công trình')
      ];

      if (phone && phone.value && !isValidVietnamPhone(phone.value)) {
        setFieldError(phone, 'Số điện thoại không đúng định dạng Việt Nam.');
        checks.push(false);
      }

      if (email && email.value && !isValidEmail(email.value)) {
        setFieldError(email, 'Email không hợp lệ. Vui lòng kiểm tra lại.');
        checks.push(false);
      }

      if (checks.some((c) => !c)) {
        showToast('Vui lòng kiểm tra lại thông tin bắt buộc.', 'error');
        return;
      }

      const submitBtn = $('button[type="submit"]', leadForm);
      simulateSubmit(
        leadForm,
        submitBtn,
        '✅ Cảm ơn bạn! Chuyên viên Sông Hồng sẽ liên hệ trong vòng 24 giờ.'
      );
    });
  }

  if (ctaForm) {
    bindLiveValidation(ctaForm);

    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = $('#cta-name');
      const phone = $('#cta-phone');
      const email = $('#cta-email');

      const checks = [
        validateRequired(name, 'Họ và tên'),
        validateRequired(phone, 'Số điện thoại')
      ];

      if (phone && phone.value && !isValidVietnamPhone(phone.value)) {
        setFieldError(phone, 'Số điện thoại không đúng định dạng Việt Nam.');
        checks.push(false);
      }

      if (email && email.value && !isValidEmail(email.value)) {
        setFieldError(email, 'Email không hợp lệ. Vui lòng kiểm tra lại.');
        checks.push(false);
      }

      if (checks.some((c) => !c)) {
        showToast('Vui lòng điền đúng các trường bắt buộc.', 'error');
        return;
      }

      const submitBtn = $('button[type="submit"]', ctaForm);
      simulateSubmit(
        ctaForm,
        submitBtn,
        '✅ Đã gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm nhất.'
      );
    });
  }

  // -----------------------------
  // Back To Top
  // -----------------------------
  const backToTopBtn = $('#back-to-top');

  const toggleBackToTop = () => {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -----------------------------
  // Small polish: parallax-like hero background movement
  // -----------------------------
  const heroBg = $('.hero-bg');
  const handleHeroMotion = () => {
    if (!heroBg) return;
    const offset = Math.min(window.scrollY * 0.08, 40);
    heroBg.style.transform = `scale(1.03) translateY(${offset}px)`;
  };

  window.addEventListener('scroll', handleHeroMotion, { passive: true });

})();
