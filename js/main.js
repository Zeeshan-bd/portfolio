/**
 * Liquid Glass Portfolio — Interactions & Scroll Reveal
 * Unified animation system with staggered section reveals
 */

(function () {
  'use strict';

  const STAGGER_STEP = 0.1; // seconds — matches CSS --stagger-step
  const REVEAL_THRESHOLD = 0.08;
  const REVEAL_ROOT_MARGIN = '0px 0px -5% 0px';


  /* ------------------------------------------
     Scroll Reveal with Section Stagger
     ------------------------------------------ */

  function initScrollReveal() {

    const sections = document.querySelectorAll('.section, .footer');

    sections.forEach(function (section) {

      const reveals = section.querySelectorAll('[data-reveal]');

      reveals.forEach(function (el, index) {

        el.classList.add('reveal');

        el.style.setProperty(
          '--reveal-delay',
          index * STAGGER_STEP + 's'
        );

        if (
          el.matches(
            '.service-card, .process-step, .about__image, .about__text, .contact__info, .contact__form'
          )
        ) {
          el.classList.add(index % 2 ? 'reveal--right' : 'reveal--left');
        }

      });

    });


    const allReveals = document.querySelectorAll('.reveal');


    if (!('IntersectionObserver' in window)) {

      allReveals.forEach(function (el) {
        el.classList.add('is-visible');
      });

      return;
    }


    const observer = new IntersectionObserver(

      function (entries) {

        entries.forEach(function (entry) {

          if (entry.isIntersecting) {

            const el = entry.target;

            el.classList.add('is-visible');

            observer.unobserve(el);


            // Release the GPU layer once the intro animation finishes.
            // Keeping will-change on indefinitely can cause stutter.

            el.addEventListener(

              'transitionend',

              function () {

                el.style.willChange = 'auto';

              },

              { once: true }

            );

          }

        });

      },

      {
        threshold: REVEAL_THRESHOLD,
        rootMargin: REVEAL_ROOT_MARGIN,
      }

    );


    allReveals.forEach(function (el) {
      observer.observe(el);
    });

  }


  /* ------------------------------------------
     Section Entrance Motion
     ------------------------------------------ */

  function initSectionEntranceMotion() {

    const sections = document.querySelectorAll('.section, .footer');

    if (!sections.length) return;

    document.body.classList.add('motion-ready');

    if (!('IntersectionObserver' in window)) {
      sections.forEach(function (section) {
        section.classList.add('is-motion-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-motion-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

  }


  /* ------------------------------------------
     Ambient Scroll Parallax
     ------------------------------------------ */

  function initAmbientParallax() {

    const glows = document.querySelectorAll('.ambient-glow');

    if (
      !glows.length ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frameId = null;

    function updateParallax() {
      frameId = null;

      glows.forEach(function (glow, index) {
        const section = glow.closest('.section');
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const progress = Math.max(
          -1,
          Math.min(1, (window.innerHeight * 0.5 - rect.top) / window.innerHeight)
        );

        glow.style.setProperty(
          '--parallax-y',
          (progress * (28 + index * 10)).toFixed(1) + 'px'
        );
      });
    }

    function requestUpdate() {
      if (frameId === null) {
        frameId = requestAnimationFrame(updateParallax);
      }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

  }


  /* ------------------------------------------
     Magnetic Cursor
     ------------------------------------------ */

  const MAGNETIC_PULL_PX = 14;


  function initMagneticCursor() {

    // Disable magnetic hover cursor on touch devices to improve mobile scrolling performance
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const targets = document.querySelectorAll(
      '.btn, .nav__link, .nav__inner, .glass--interactive'
    );


    if (!targets.length) return;


    targets.forEach(function (el) {

      let rect = null;

      let pendingX = 0;
      let pendingY = 0;

      let rafId = null;


      function applyFrame() {

        rafId = null;

        if (!rect) return;


        const relX =
          (pendingX - (rect.left + rect.width / 2)) /
          (rect.width / 2);


        const relY =
          (pendingY - (rect.top + rect.height / 2)) /
          (rect.height / 2);


        const pullX =
          Math.max(-1, Math.min(1, relX)) *
          MAGNETIC_PULL_PX;


        const pullY =
          Math.max(-1, Math.min(1, relY)) *
          MAGNETIC_PULL_PX;


        el.style.setProperty(
          '--pull-x',
          pullX.toFixed(2) + 'px'
        );


        el.style.setProperty(
          '--pull-y',
          pullY.toFixed(2) + 'px'
        );

      }


      el.addEventListener(
        'pointerenter',
        function () {

          rect = el.getBoundingClientRect();

        }
      );


      el.addEventListener(

        'pointermove',

        function (e) {

          pendingX = e.clientX;
          pendingY = e.clientY;


          if (rafId === null) {

            rafId = requestAnimationFrame(
              applyFrame
            );

          }

        },

        { passive: true }

      );


      el.addEventListener(

        'pointerleave',

        function () {

          if (rafId !== null) {

            cancelAnimationFrame(rafId);

            rafId = null;

          }


          rect = null;


          el.style.setProperty(
            '--pull-x',
            '0px'
          );


          el.style.setProperty(
            '--pull-y',
            '0px'
          );

        }

      );

    });

  }


  /* ------------------------------------------
     Mobile Navigation Toggle
     ------------------------------------------ */

  function initNav() {

    const toggle =
      document.querySelector('.nav__toggle');

    const links =
      document.querySelector('.nav__links');

    const inner =
      document.querySelector('.nav__inner');

    const navEl =
      document.querySelector('.nav');


    if (!toggle || !links || !inner || !navEl) {
      return;
    }


    /*
     * On mobile, the dropdown is moved out from
     * inside .nav__inner.
     *
     * This prevents nested backdrop-filter issues
     * because .nav__inner itself is also glass.
     */

    const mobileQuery =
      window.matchMedia('(max-width: 640px)');


    /*
     * Position the dropdown directly underneath
     * the hamburger button.
     */

    function alignToToggle() {

      const navRect =
        navEl.getBoundingClientRect();

      const innerRect =
        inner.getBoundingClientRect();

      const toggleRect =
        toggle.getBoundingClientRect();


      /*
       * Match the dropdown's right edge to the
       * nav__inner container's right edge.
       *
       * This keeps the dropdown aligned flush
       * with the navbar's right boundary.
       */

      const rightOffset =
        navRect.right - innerRect.right;


      links.style.right =
        rightOffset + 'px';


      /*
       * Position the dropdown vertically using
       * the actual bottom of the nav__inner bar.
       *
       * This puts the dropdown directly underneath
       * the navbar.
       */

      links.style.top =
        (
          innerRect.bottom -
          navRect.top +
          8
        ) + 'px';

    }


    /*
     * Move the dropdown outside the navbar's
     * inner glass container on mobile.
     */

    function placeLinks(isMobile) {

      if (isMobile) {

        if (links.parentElement !== navEl) {

          navEl.appendChild(links);

        }

        alignToToggle();

      } else {

        if (links.parentElement !== inner) {

          inner.appendChild(links);

          links.style.right = '';

          links.style.top = '';

        }


        links.classList.remove('is-open');


        toggle.setAttribute(
          'aria-expanded',
          'false'
        );

      }

    }


    /*
     * Initial placement.
     */

    placeLinks(
      mobileQuery.matches
    );


    /*
     * Reposition when switching between
     * mobile and desktop sizes.
     */

    mobileQuery.addEventListener(
      'change',
      function (e) {

        placeLinks(e.matches);

      }
    );


    /*
     * Recalculate position when the browser
     * is resized.
     */

    window.addEventListener(
      'resize',
      function () {

        if (mobileQuery.matches) {

          alignToToggle();

        }

      }
    );


    /*
     * Hamburger click.
     */

    toggle.addEventListener(

      'click',

      function (e) {

        e.stopPropagation();


        /*
         * Recalculate immediately before opening
         * so the dropdown is always exactly below
         * the hamburger.
         */

        if (mobileQuery.matches) {

          alignToToggle();

        }


        const isOpen =
          links.classList.toggle('is-open');


        toggle.setAttribute(
          'aria-expanded',
          isOpen
        );

      }

    );


    /*
     * Close menu after clicking a navigation item.
     */

    links
      .querySelectorAll('.nav__link')
      .forEach(function (link) {

        link.addEventListener(
          'click',
          function () {

            links.classList.remove(
              'is-open'
            );


            toggle.setAttribute(
              'aria-expanded',
              'false'
            );

          }
        );

      });


    /*
     * Close menu when clicking outside.
     */

    document.addEventListener(

      'click',

      function (e) {

        if (
          !toggle.contains(e.target) &&
          !links.contains(e.target)
        ) {

          links.classList.remove(
            'is-open'
          );


          toggle.setAttribute(
            'aria-expanded',
            'false'
          );

        }

      }

    );

  }


  /* ------------------------------------------
     Smooth anchor scroll offset for fixed nav
     ------------------------------------------ */

  function initSmoothScroll() {

    document
      .querySelectorAll('a[href^="#"]')
      .forEach(function (anchor) {

        anchor.addEventListener(

          'click',

          function (e) {

            const targetId =
              this.getAttribute('href');


            if (targetId === '#') {
              return;
            }


            const target =
              document.querySelector(targetId);


            if (!target) {
              return;
            }


            e.preventDefault();


            const navHeight =
              parseInt(

                getComputedStyle(
                  document.documentElement
                ).getPropertyValue(
                  '--nav-height'
                ),

                10

              ) || 72;


            const top =
              target.getBoundingClientRect().top +
              window.scrollY -
              navHeight;


            window.scrollTo({

              top: top,

              behavior: 'smooth',

            });

          }

        );

      });

  }


  /* ------------------------------------------
     Contact form — prevent default submit
     ------------------------------------------ */

  function initForm() {

    const form =
      document.querySelector('.contact__form');


    if (!form) {
      return;
    }


    form.addEventListener(

      'submit',

      function (e) {

        e.preventDefault();


        const btn =
          form.querySelector(
            'button[type="submit"]'
          );


        const originalText =
          btn.textContent;


        btn.textContent =
          'Sending...';


        btn.disabled = true;


        const formData = new FormData(form);


        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        })
        .then(async function (response) {
          let json = await response.json();
          if (response.status === 200) {
            btn.textContent = 'Message Sent';
            form.reset();
          } else {
            console.error(json);
            btn.textContent = 'Error Sending';
          }
        })
        .catch(function (error) {
          console.error(error);
          btn.textContent = 'Error Sending';
        })
        .then(function () {
          setTimeout(

            function () {

              btn.textContent =
                originalText;


              btn.disabled = false;

            },

            3000

          );
        });

      }

    );

  }


  /* ------------------------------------------
     Typewriter Hero Text
     ------------------------------------------ */

  function initTextRotate() {

    const els =
      document.querySelectorAll(
        '.text-rotate'
      );


    els.forEach(function (el) {

      const words =
        (
          el.getAttribute(
            'data-words'
          ) || ''
        )

        .split('|')

        .map(function (w) {

          return w.trim();

        })

        .filter(Boolean);


      if (words.length === 0) {
        return;
      }


      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      
      const typingSpeed = 80;    // ms per letter while typing
      const deletingSpeed = 40;  // ms per letter while deleting
      const pauseAfterType = 2000; // ms to display full word
      const pauseAfterDelete = 400; // ms before starting next word


      function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          charIndex--;
        } else {
          charIndex++;
        }

        el.textContent = currentWord.substring(0, charIndex);

        let delta = isDeleting ? deletingSpeed : typingSpeed;

        if (!isDeleting && charIndex === currentWord.length) {
          delta = pauseAfterType;
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delta = pauseAfterDelete;
        }

        setTimeout(type, delta);
      }

      el.textContent = '';
      type();

    });

  }


  /* ------------------------------------------
     Init
     ------------------------------------------ */

  document.addEventListener(

    'DOMContentLoaded',

    function () {

      initScrollReveal();

      initSectionEntranceMotion();

      initAmbientParallax();

      initNav();

      initSmoothScroll();

      initForm();

      initTextRotate();

    }

  );

})();
