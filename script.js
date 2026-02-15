document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const statusConsole = document.getElementById("status-console");
  const statusBinaryEl = document.getElementById("status-binary");
  const statusTextEl = document.getElementById("status-text");

  function throttle(fn, wait) {
    let inThrottle, lastFn, lastTime;
    return function() {
      const context = this,
        args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        lastTime = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFn);
        lastFn = setTimeout(function() {
          if (Date.now() - lastTime >= wait) {
            fn.apply(context, args);
            lastTime = Date.now();
          }
        }, Math.max(wait - (Date.now() - lastTime), 0));
      }
    };
  }

  function debounce(fn, ms) {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn.apply(this, arguments);
      }, ms);
    };
  }

  let statusTimeout;
  function flashStatus(binary, text, delay = 100) {
    clearTimeout(statusTimeout);
    statusBinaryEl.textContent = binary;
    statusTextEl.textContent = "";
    
    statusBinaryEl.classList.add("status-glitch");
    statusTextEl.classList.add("status-glitch");

    setTimeout(() => {
      statusBinaryEl.classList.remove("status-glitch");
      statusTextEl.classList.remove("status-glitch");
      statusTextEl.textContent = text;
    }, 420);
  }

  function setupLoader() {
    window.addEventListener("load", () => {
      const loader = document.getElementById("loader");
      setTimeout(() => {
        if (loader) {
          loader.style.opacity = "0";
          loader.style.pointerEvents = "none";
        }
        app.classList.add("visible");
        if (window.initParticleAnimation) {
          window.initParticleAnimation();
        }
        statusConsole.classList.add("visible");
        flashStatus("01010010 01000101 01000001 01000100 01011001", "READY", 0);
        setTimeout(() => loader && loader.remove(), 600);
      }, 1800);
    });
  }

  function setupObservers() {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.classList.contains("hud-card")) {
            el.classList.add("hud-visible");
          } else {
            el.classList.add("visible");
          }
          obs.unobserve(el);
        });
      },
      { threshold: 0.18 }
    );
    document.querySelectorAll(".reveal, .hud-card, .reveal-left, .reveal-right").forEach(el => {
      revealObserver.observe(el);
    });

    const sectionObserver = new IntersectionObserver(
      throttle((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.dataset.sectionId;
            if (sectionId) {
              const binary = sectionId.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
              flashStatus(`// 0x${sectionId.toUpperCase()}`, `NAVIGATING TO #${sectionId}...`);
            }
          }
        });
      }, 200),
      { threshold: 0.4 }
    );
    document.querySelectorAll('section[data-section-id]').forEach(el => {
      sectionObserver.observe(el);
    });
  }

  function setupGlowEffect() {
    function attachGlow(selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.addEventListener("mousemove", e => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          el.style.setProperty("--glow-x", `${x}px`);
          el.style.setProperty("--glow-y", `${y}px`);
          el.style.setProperty("--glow-opacity", "1");
        });
        el.addEventListener("mouseleave", () => {
          el.style.setProperty("--glow-opacity", "0");
        });
      });
    }
    attachGlow(".card");
  }

  function setup3DTiltEffect() {
    const thm3d = document.getElementById("thm3d");
    if (thm3d) {
      thm3d.addEventListener("mousemove", e => {
        const rect = thm3d.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        thm3d.style.transform = `perspective(1000px) rotateX(${-y * 12}deg) rotateY(${x * 16}deg) scale(1.03)`;
      });
      thm3d.addEventListener("mouseleave", () => {
        thm3d.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
      });
    }
  }

  function setupEmail() {
    const copyBtn = document.getElementById("copy-email");
    const emailLink = document.getElementById("email-link");
    if (emailLink) {
      const user = emailLink.dataset.user;
      const domain = emailLink.dataset.domain;
      const email = `${user}@${domain}`;
      emailLink.href = `mailto:${email}`;
      emailLink.textContent = email;

      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(email).then(() => {
            flashStatus("01000011 01001111 01010000 01001001 01000101 01000100", "EMAIL COPIED");
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
              flashStatus("01010010 01000101 01000001 01000100 01011001", "READY");
            }, 2500);
          });
        });
      }
    }
  }

  function setupContactForm() {
    const contactForm = document.getElementById("contact-form");
    const notification = document.getElementById("form-notification");
    const emailInput = document.getElementById("email");

    if (contactForm && notification && emailInput) {
      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!isValidEmail(emailInput.value)) {
          notification.textContent = "Please enter a valid email address.";
          notification.className = "error visible";
          flashStatus("01000101 01010010 01010010 01001111 01010010", "INVALID EMAIL");
          return;
        }

        flashStatus("01010011 01000101 01001110 01000100 01001001 01001110 01000111", "SENDING...");
        
        const formData = new FormData(contactForm);
        try {
          const response = await fetch(contactForm.action, {
            method: contactForm.method,
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            notification.textContent = "Message sent successfully!";
            notification.className = "success visible";
            contactForm.reset();
            flashStatus("01010011 01010101 01000011 01000011 01000101 01010011 01010011", "SUCCESS");
          } else {
            notification.textContent = "Oops! There was a problem submitting your form.";
            notification.className = "error visible";
            flashStatus("01000101 01010010 01010010 01001111 01010010", "ERROR");
          }
        } catch (error) {
          notification.textContent = "Oops! There was a problem submitting your form.";
          notification.className = "error visible";
          flashStatus("01000101 01010010 01010010 01001111 01010010", "ERROR");
        } finally {
          setTimeout(() => {
            notification.classList.remove("visible");
            flashStatus("01010010 01000101 01000001 01000100 01011001", "READY");
          }, 4000);
        }
      });
    }
  }

  function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  function setupFooter() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function setupCertButtons() {
    const certBtns = document.querySelectorAll('.cert-btn');
    certBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          btn.blur();
        }, 2500);
      });
    });
  }

  function init() {
    setupLoader();
    setupObservers();
    setupGlowEffect();
    setup3DTiltEffect();
    setupEmail();
    setupContactForm();
    setupFooter();
    setupCertButtons();
  }

  init();
});
