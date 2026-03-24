/* ============================================================
   青木税理士事務所 — main.js (大改修版)
   Vanilla JS / IIFE / defer
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. Scroll Animation (with stagger)
     ============================================================ */
  function initScrollAnimations() {
    if (prefersReducedMotion()) {
      document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });
  }

  /* ============================================================
     2. Hamburger Menu
     ============================================================ */
  function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.drawer');
    if (!hamburger || !drawer) return;

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('is-open');
      drawer.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        drawer.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        hamburger.classList.remove('is-open');
        drawer.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ============================================================
     4. Header Scroll Change
     ============================================================ */
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('is-scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ============================================================
     5. FAQ Accordion
     ============================================================ */
  function initFAQ() {
    const items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    items.forEach((item) => {
      const question = item.querySelector('.faq__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        items.forEach((other) => {
          other.classList.remove('is-open');
          const btn = other.querySelector('.faq__question');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============================================================
     6. Form Validation + Confirmation + Formspree
     ============================================================ */
  function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const confirmPanel = form.querySelector('.form-confirm');
    const formFields = form.querySelector('.form-fields');
    const btnSubmit = form.querySelector('.btn-submit');
    const btnBack = form.querySelector('.btn-back');
    const btnSend = form.querySelector('.btn-send');

    if (!confirmPanel || !formFields) return;

    function validateField(field) {
      const group = field.closest('.form-group');
      if (!group) return true;
      const errorEl = group.querySelector('.form-error');
      let valid = true;

      if (field.hasAttribute('required') && !field.value.trim()) {
        valid = false;
        if (errorEl) errorEl.textContent = 'この項目は必須です';
      } else if (field.type === 'email' && field.value.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
          valid = false;
          if (errorEl) errorEl.textContent = '有効なメールアドレスを入力してください';
        }
      }
      group.classList.toggle('has-error', !valid);
      return valid;
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        let allValid = true;
        form.querySelectorAll('.form-input, .form-textarea').forEach((f) => {
          if (!validateField(f)) allValid = false;
        });
        const radios = form.querySelectorAll('input[name="inquiry-type"]');
        if (radios.length && !form.querySelector('input[name="inquiry-type"]:checked')) {
          allValid = false;
          const rg = radios[0].closest('.form-group');
          if (rg) rg.classList.add('has-error');
        }
        if (!allValid) return;

        populateConfirm();
        formFields.style.display = 'none';
        btnSubmit.style.display = 'none';
        confirmPanel.classList.add('is-active');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        formFields.style.display = '';
        btnSubmit.style.display = '';
        confirmPanel.classList.remove('is-active');
      });
    }

    if (btnSend) {
      btnSend.addEventListener('click', (e) => {
        e.preventDefault();
        fetch(form.action || 'https://formspree.io/f/your-form-id', {
          method: 'POST', body: new FormData(form),
          headers: { Accept: 'application/json' },
        })
          .then((res) => { if (res.ok) showFormSuccess(); else showFormError(); })
          .catch(() => showFormError());
      });
    }

    function populateConfirm() {
      const type = form.querySelector('input[name="inquiry-type"]:checked');
      setCV('confirm-type', type ? type.parentElement.querySelector('span').textContent : '');
      setCV('confirm-name', gfv('name'));
      setCV('confirm-email', gfv('email'));
      setCV('confirm-tel', gfv('tel') || '—');
      setCV('confirm-company', gfv('company') || '—');
      setCV('confirm-message', gfv('message'));
    }
    function setCV(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
    function gfv(n) { var f = form.querySelector('[name="' + n + '"]'); return f ? f.value.trim() : ''; }

    function showFormSuccess() {
      form.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
        '<p style="font-family:var(--font-heading-ja);font-size:24px;font-weight:700;color:var(--color-heading);margin-bottom:16px;">送信完了</p>' +
        '<p style="font-size:15px;color:var(--color-text-light);line-height:1.8;">お問い合わせありがとうございます。<br>2営業日以内にご返信いたします。</p>' +
        '</div>';
    }
    function showFormError() {
      alert('送信に失敗しました。お手数ですが、お電話にてお問い合わせください。');
    }

    form.querySelectorAll('.form-input, .form-textarea').forEach((f) => {
      f.addEventListener('blur', () => validateField(f));
    });
  }

  /* ============================================================
     7. Parallax
     ============================================================ */
  function initParallax() {
    if (prefersReducedMotion()) return;
    const bands = document.querySelectorAll('.service-band__bg');
    if (!bands.length) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          bands.forEach((bg) => {
            const rect = bg.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              const yPos = -(rect.top * 0.3);
              bg.style.transform = 'translate3d(0,' + yPos + 'px,0)';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ============================================================
     8. Smooth Scroll
     ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '#0') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerH = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH - 20, behavior: 'smooth' });
      });
    });
  }

  /* ============================================================
     9. Marquee Init — duplicate content for seamless loop
     ============================================================ */
  function initMarquee() {
    document.querySelectorAll('.marquee-track').forEach((track) => {
      // Duplicate inner content for seamless infinite scroll
      if (track.children.length && !track.dataset.cloned) {
        const items = Array.from(track.children);
        items.forEach((item) => {
          track.appendChild(item.cloneNode(true));
        });
        track.dataset.cloned = 'true';
      }
    });
  }

  /* ============================================================
     Init
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initMarquee();
    initScrollAnimations();
    initHamburger();
    initHeaderScroll();
    initFAQ();
    initForm();
    initParallax();
    initSmoothScroll();
  });
})();
