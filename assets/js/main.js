(function () {
  const d = document;
  const w = window;
  const root = d.documentElement;

  const hasGSAP = typeof w.gsap !== "undefined" && typeof w.ScrollTrigger !== "undefined";
  const reducedMotion = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = w.innerWidth < 768;
  const isFinePointer = w.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Signals to CSS that JS is driving reveal states (disables competing CSS transitions)
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  if (hasGSAP) w.gsap.registerPlugin(w.ScrollTrigger);

  // Year
  const yearEl = d.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

  /* ------------------------------------------------------------------ *
   * 1. Boot (idempotent single entry point)
   * ------------------------------------------------------------------ */
  let booted = false;

  function boot() {
    if (booted) return;
    booted = true;
    d.body.classList.add("loaded");
    d.querySelector(".hero-section")?.classList.add("loaded");
    initAnimations();
    initEmailValidation();
    initFieldValidation();
  }

  /* ------------------------------------------------------------------ *
   * 2. Scroll chrome (progress bar, navbar, parallax)
   * ------------------------------------------------------------------ */
  const scrollProgress = d.getElementById("scrollProgress");
  const navbar = d.getElementById("navbar");
  const heroBg = d.querySelector(".hero-bg.parallax");
  const parallaxLayers = Array.from(d.querySelectorAll("[data-parallax]"));

  function onScroll() {
    const y = w.scrollY || root.scrollTop;

    if (scrollProgress) {
      const max = root.scrollHeight - root.clientHeight;
      scrollProgress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }

    if (navbar) navbar.classList.toggle("scrolled", y > 60);

    if (!reducedMotion) {
      if (heroBg) heroBg.style.transform = "translateY(" + y * 0.22 + "px)";
      parallaxLayers.forEach((layer) => {
        const rect = layer.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > w.innerHeight + 200) return;
        const speed = parseFloat(layer.dataset.parallax) || 0.08;
        const offset = (rect.top - w.innerHeight / 2) * speed;
        layer.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
      });
    }
  }

  let ticking = false;
  w.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      w.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  w.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ *
   * 3. Mobile nav auto-close
   * ------------------------------------------------------------------ */
  const navCollapse = d.getElementById("navContent");
  const bsCollapse =
    navCollapse && typeof w.bootstrap !== "undefined" ? new w.bootstrap.Collapse(navCollapse, { toggle: false }) : null;

  d.querySelectorAll("#navContent .nav-link, #navContent .btn").forEach((link) => {
    link.addEventListener("click", () => {
      if (navCollapse && navCollapse.classList.contains("show")) bsCollapse?.hide();
    });
  });

  /* ------------------------------------------------------------------ *
   * 4. Reveal & animation tracking helpers
   * ------------------------------------------------------------------ */
  const revealEls = Array.from(d.querySelectorAll(".reveal"));
  const revealed = new WeakSet();

  function commitReveal(el) {
    if (!el || revealed.has(el)) return;
    revealed.add(el);
    el.classList.add("active");
    if (hasGSAP) {
      w.gsap.set(el, { clearProps: "opacity,transform,willChange" });
    }
  }

  function initRevealObserver() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          commitReveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * 5. Header — smooth load animation
   * ------------------------------------------------------------------ */
  function initHeaderAnimation() {
    if (reducedMotion || !hasGSAP) return;
    const nav = d.getElementById("navbar");
    if (!nav) return;

    const brand = nav.querySelector(".navbar-brand");
    const navItems = Array.from(nav.querySelectorAll("#navContent .nav-item"));
    const navLogin = d.getElementById("navLogin");
    const toggler = nav.querySelector(".navbar-toggler");

    const tl = w.gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      nav,
      { y: -35, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, clearProps: "transform,opacity" },
      0
    );

    if (brand) {
      tl.fromTo(
        brand,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, clearProps: "transform,opacity" },
        0.1
      );
    }

    if (navItems.length) {
      tl.fromTo(
        navItems,
        { y: -15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
        0.2
      );
    }

    if (navLogin) {
      tl.fromTo(
        navLogin,
        { scale: 0.88, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)", clearProps: "transform,opacity" },
        0.35
      );
    }

    if (toggler) {
      tl.fromTo(
        toggler,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, clearProps: "opacity" },
        0.25
      );
    }
  }

  function splitHeroWords(el, text) {
    const label = (text || el.textContent || "").trim().replace(/\s+/g, " ");
    if (!label) return [];

    el.setAttribute("aria-label", label);
    el.textContent = "";

    const words = label.split(" ");
    const inners = [];

    words.forEach((word, index) => {
      const mask = d.createElement("span");
      mask.className = "hero-split-word";
      mask.setAttribute("aria-hidden", "true");

      const inner = d.createElement("span");
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);

      if (index < words.length - 1) el.appendChild(d.createTextNode(" "));
      inners.push(inner);
    });

    return inners;
  }

  const HERO_PHRASES = [
    "Elevate Your Dining Experience",
    "Savor the Art of Fine Dining",
    "Discover a World of Flavour",
    "Celebrate Taste and Craft",
  ];

  function startHeroRotation(h1, phrases, hero) {
    if (!h1 || !phrases || phrases.length < 2) return;

    let index = 0;
    let timer = null;
    let inView = true;
    let busy = false;

    const schedule = () => {
      if (timer || busy) return;
      timer = w.gsap.delayedCall(2.8, tick);
    };

    const tick = () => {
      timer = null;
      if (d.hidden || !inView || busy) return;
      cycle();
    };

    const cycle = () => {
      busy = true;
      const current = Array.from(h1.querySelectorAll(".hero-split-word > span"));

      w.gsap.to(current, {
        yPercent: -118,
        opacity: 0,
        rotate: -4,
        duration: 0.45,
        ease: "power2.in",
        stagger: 0.035,
        onComplete: () => {
          index = (index + 1) % phrases.length;
          const next = splitHeroWords(h1, phrases[index]);

          w.gsap.set(next, { yPercent: 118, opacity: 0, rotate: 4 });
          w.gsap.to(next, {
            yPercent: 0,
            opacity: 1,
            rotate: 0,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.07,
            clearProps: "transform,opacity",
            onComplete: () => {
              busy = false;
              schedule();
            },
          });
        },
      });
    };

    const onVisibility = () => {
      if (!d.hidden && inView && !busy) schedule();
    };
    d.addEventListener("visibilitychange", onVisibility);

    if (hero && "IntersectionObserver" in w) {
      const io = new w.IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting;
          if (inView && !busy && !d.hidden) schedule();
        },
        { threshold: 0.25 }
      );
      io.observe(hero);
    }

    schedule();
  }

  /* ------------------------------------------------------------------ *
   * 6. Hero section — smooth entrance animation (Home & Subpages)
   * ------------------------------------------------------------------ */
  function initHeroAnimation() {
    if (reducedMotion || !hasGSAP) return;

    // Home Hero
    const hero = d.getElementById("hero");
    if (hero) {
      const heroTl = w.gsap.timeline({ defaults: { ease: "power3.out" } });

      const bg = hero.querySelector(".hero-bg");
      if (bg) {
        heroTl.fromTo(
          bg,
          { scale: 1.08, opacity: 0.8 },
          { scale: 1, opacity: 1, duration: 1.8, ease: "power2.out", clearProps: "opacity" },
          0
        );
      }

      const eyebrow = hero.querySelector(".eyebrow");
      if (eyebrow) {
        heroTl.fromTo(
          eyebrow,
          { y: 24, opacity: 0, letterSpacing: "0.62em" },
          {
            y: 0,
            opacity: 1,
            letterSpacing: "0.38em",
            duration: 1,
            ease: "power3.out",
            clearProps: "transform,opacity,letterSpacing",
          },
          0.15
        );
      }

      const h1 = hero.querySelector("h1");
      if (h1) {
        const h1Words = splitHeroWords(h1, HERO_PHRASES[0]);
        if (h1Words.length) {
          heroTl.fromTo(
            h1Words,
            { yPercent: 118, opacity: 0, rotate: 4 },
            {
              yPercent: 0,
              opacity: 1,
              rotate: 0,
              duration: 1.05,
              ease: "power4.out",
              stagger: 0.07,
              clearProps: "transform,opacity",
            },
            0.28
          );
        } else {
          heroTl.fromTo(
            h1,
            { y: 38, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.15, ease: "power3.out", clearProps: "transform,opacity" },
            0.3
          );
        }

        heroTl.eventCallback("onComplete", () => startHeroRotation(h1, HERO_PHRASES, hero));
      }

      const lead = hero.querySelector("p.lead");
      if (lead) {
        heroTl.fromTo(
          lead,
          { y: 26, opacity: 0, filter: "blur(10px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            clearProps: "transform,opacity,filter",
          },
          0.5
        );
      }

      const btns = Array.from(hero.querySelectorAll(".d-flex .btn"));
      if (btns.length) {
        heroTl.fromTo(
          btns,
          { y: 22, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: "back.out(1.4)",
            clearProps: "transform,opacity",
          },
          0.68
        );
      }

      const scrollInd = hero.querySelector(".scroll-indicator");
      if (scrollInd) {
        heroTl.fromTo(
          scrollInd,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, clearProps: "transform,opacity" },
          0.85
        );

        // Continuous subtle pulsing/floating animation on mouse wheel
        const wheel = scrollInd.querySelector(".wheel");
        if (wheel) {
          w.gsap.to(wheel, {
            y: 6,
            opacity: 0.25,
            repeat: -1,
            yoyo: true,
            duration: 1.2,
            ease: "power1.inOut",
          });
        }
      }
    }

    // Subpage Hero
    const pageHero = d.querySelector(".page-hero");
    if (pageHero) {
      const pageTl = w.gsap.timeline({ defaults: { ease: "power3.out" } });

      const bg = pageHero.querySelector(".page-hero-bg");
      if (bg) {
        pageTl.fromTo(
          bg,
          { scale: 1.06 },
          { scale: 1, duration: 1.6, ease: "power2.out", clearProps: "transform" },
          0
        );
      }

      const breadcrumb = pageHero.querySelector(".breadcrumb-custom");
      if (breadcrumb) {
        pageTl.fromTo(
          breadcrumb,
          { y: -15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, clearProps: "transform,opacity" },
          0.1
        );
      }

      const eyebrow = pageHero.querySelector(".eyebrow");
      if (eyebrow) {
        pageTl.fromTo(
          eyebrow,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, clearProps: "transform,opacity" },
          0.2
        );
      }

      const title = pageHero.querySelector(".page-hero-title");
      if (title) {
        pageTl.fromTo(
          title,
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.05, clearProps: "transform,opacity" },
          0.3
        );
      }

      const lead = pageHero.querySelector(".lead");
      if (lead) {
        pageTl.fromTo(
          lead,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, clearProps: "transform,opacity" },
          0.4
        );
      }

      const subnavLinks = Array.from(pageHero.querySelectorAll(".page-subnav-link"));
      if (subnavLinks.length) {
        pageTl.fromTo(
          subnavLinks,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.04,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
          0.5
        );
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. About / Who We Are — scroll reveal animation
   * ------------------------------------------------------------------ */
  function initAboutSectionAnimation() {
    if (reducedMotion || !hasGSAP) return;

    // Dual-layer image stack in About / Our Story
    d.querySelectorAll(".image-stack").forEach((stack) => {
      const parentSection = stack.closest("section") || stack;
      const mainImg = stack.querySelector(".image-main");
      const overlayImg = stack.querySelector(".image-overlay");

      if (mainImg) {
        w.gsap.fromTo(
          mainImg,
          { x: isMobile ? 0 : -35, y: 30, opacity: 0, scale: 0.96 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: stack, start: "top 85%", once: true },
            onComplete: () => {
              commitReveal(stack);
              w.gsap.set(mainImg, { clearProps: "transform,opacity,willChange" });
            },
          }
        );
      }

      if (overlayImg) {
        w.gsap.fromTo(
          overlayImg,
          { x: isMobile ? 0 : 25, y: 40, opacity: 0, scale: 0.94 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.25,
            delay: 0.2,
            ease: "power3.out",
            scrollTrigger: { trigger: stack, start: "top 85%", once: true },
            onComplete: () => {
              w.gsap.set(overlayImg, { clearProps: "transform,opacity,willChange" });
            },
          }
        );

        // Subtle depth scrub on scroll
        if (!isMobile) {
          w.gsap.to(overlayImg, {
            y: -24,
            ease: "none",
            scrollTrigger: {
              trigger: parentSection,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
      }
    });

    // About text columns (story, philosophy, values)
    d.querySelectorAll(
      "#welcome .col-lg-6:last-child > .reveal, #story .col-lg-6:last-child > .reveal, #team-teaser .col-lg-6:first-child > .reveal"
    ).forEach((textWrap) => {
      const children = Array.from(textWrap.children);
      w.gsap.fromTo(
        children,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: textWrap, start: "top 85%", once: true },
          onComplete: () => {
            commitReveal(textWrap);
            w.gsap.set(children, { clearProps: "transform,opacity" });
          },
        }
      );
    });

    // Milestones Timeline
    const timeline = d.querySelector(".timeline");
    if (timeline) {
      const items = Array.from(timeline.querySelectorAll(".timeline-item"));
      w.gsap.fromTo(
        items,
        { x: isMobile ? 0 : -25, y: 25, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: timeline, start: "top 85%", once: true },
          onComplete: () => {
            items.forEach(commitReveal);
            w.gsap.set(items, { clearProps: "transform,opacity" });
          },
        }
      );

      const dots = Array.from(timeline.querySelectorAll(".timeline-dot"));
      w.gsap.fromTo(
        dots,
        { scale: 0 },
        {
          scale: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: "back.out(2)",
          scrollTrigger: { trigger: timeline, start: "top 85%", once: true },
          onComplete: () => {
            w.gsap.set(dots, { clearProps: "transform" });
          },
        }
      );
    }
  }

  /* ------------------------------------------------------------------ *
   * 8. Services — cards stagger animation
   * ------------------------------------------------------------------ */
  function initServicesAnimation() {
    if (reducedMotion || !hasGSAP) return;

    const serviceSections = [
      "#pillars",
      "#wine-cellar",
      "#private-events",
      "#values",
      "#philosophy",
      "#spaces",
      "#experiences",
      "#occasions",
      "#departments",
      "#etiquette",
    ];

    serviceSections.forEach((sel) => {
      const section = d.querySelector(sel);
      if (!section) return;

      // Heading
      const heading = section.querySelector(".section-heading, .col-lg-8.text-center");
      if (heading) {
        const headingEls = Array.from(heading.querySelectorAll(".eyebrow, h2, p"));
        w.gsap.fromTo(
          headingEls,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            onComplete: () => {
              commitReveal(heading);
              w.gsap.set(headingEls, { clearProps: "transform,opacity" });
            },
          }
        );
      }

      // Feature & Info Cards Stagger
      const cards = Array.from(
        section.querySelectorAll(".feature-card, .info-card, .department-card, .policy-card")
      );
      if (cards.length) {
        const cardParentReveals = cards.map((c) => c.closest(".reveal")).filter(Boolean);
        w.gsap.fromTo(
          cards,
          { y: isMobile ? 24 : 45, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: isMobile ? 0.75 : 0.95,
            stagger: isMobile ? 0.06 : 0.11,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cards[0].closest(".row") || section,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              cardParentReveals.forEach(commitReveal);
              w.gsap.set(cards, { clearProps: "transform,opacity,scale,willChange" });
            },
          }
        );

        // Micro-pop for icons
        const icons = Array.from(
          section.querySelectorAll(".feature-card i, .info-card-icon, .department-card i")
        );
        if (icons.length) {
          w.gsap.fromTo(
            icons,
            { scale: 0.7, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              stagger: isMobile ? 0.06 : 0.11,
              delay: 0.15,
              ease: "back.out(1.8)",
              scrollTrigger: {
                trigger: cards[0].closest(".row") || section,
                start: "top 85%",
                once: true,
              },
              onComplete: () => {
                w.gsap.set(icons, { clearProps: "transform,opacity" });
              },
            }
          );
        }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. Selected Work / Portfolio — image + text reveal animation
   * ------------------------------------------------------------------ */
  function initSelectedWorkAnimation() {
    if (reducedMotion || !hasGSAP) return;

    // Signature Specialties
    const specialtiesSection = d.getElementById("specialties");
    if (specialtiesSection) {
      const specialCards = Array.from(specialtiesSection.querySelectorAll(".special-card"));
      const cardReveals = specialCards.map((c) => c.closest(".reveal")).filter(Boolean);

      if (specialCards.length) {
        w.gsap.fromTo(
          specialCards,
          { y: isMobile ? 28 : 50, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: isMobile ? 0.8 : 1,
            stagger: isMobile ? 0.08 : 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: specialtiesSection.querySelector(".row.g-4") || specialtiesSection,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              cardReveals.forEach(commitReveal);
              w.gsap.set(specialCards, { clearProps: "transform,opacity,scale,willChange" });
            },
          }
        );

        // Images inside special cards un-scale
        const specialImgs = Array.from(specialtiesSection.querySelectorAll(".special-card-img img"));
        w.gsap.fromTo(
          specialImgs,
          { scale: 1.15 },
          {
            scale: 1,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: specialtiesSection.querySelector(".row.g-4") || specialtiesSection,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              w.gsap.set(specialImgs, { clearProps: "transform" });
            },
          }
        );

        // Badges pop
        const badges = Array.from(specialtiesSection.querySelectorAll(".special-card-badge"));
        w.gsap.fromTo(
          badges,
          { scale: 0.7, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.14,
            delay: 0.25,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: specialtiesSection.querySelector(".row.g-4") || specialtiesSection,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              w.gsap.set(badges, { clearProps: "transform,opacity" });
            },
          }
        );
      }
    }

    // Menu preview cards
    const menuPreview = d.getElementById("menu-preview");
    if (menuPreview) {
      const menuCards = Array.from(menuPreview.querySelectorAll(".menu-card"));
      const cardReveals = menuCards.map((c) => c.closest(".reveal")).filter(Boolean);

      if (menuCards.length) {
        w.gsap.fromTo(
          menuCards,
          { y: isMobile ? 20 : 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: menuCards[0].closest(".col-lg-7") || menuPreview,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              cardReveals.forEach(commitReveal);
              w.gsap.set(menuCards, { clearProps: "transform,opacity" });
            },
          }
        );
      }
    }

    // Chef's Table Counter Experience
    const chefTable = d.getElementById("chef-table");
    if (chefTable) {
      const media = chefTable.querySelector(".media-frame img");
      if (media && !isMobile) {
        w.gsap.to(media, {
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: chefTable,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }

    // Gallery preview & Gallery page items
    d.querySelectorAll("#gallery-preview, #gallery").forEach((gallery) => {
      const items = Array.from(gallery.querySelectorAll(".gallery-item"));
      const itemReveals = items.map((it) => it.closest(".reveal")).filter(Boolean);

      if (items.length) {
        w.gsap.fromTo(
          items,
          { y: isMobile ? 20 : 35, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: gallery, start: "top 85%", once: true },
            onComplete: () => {
              itemReveals.forEach(commitReveal);
              w.gsap.set(items, { clearProps: "transform,opacity,scale" });
            },
          }
        );
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 10. The People / Team — cards stagger animation
   * ------------------------------------------------------------------ */
  function initTeamAnimation() {
    if (reducedMotion || !hasGSAP) return;

    d.querySelectorAll("#chefs-preview, #chefs, #profiles, #brigade").forEach((section) => {
      const chefCards = Array.from(section.querySelectorAll(".chef-card, .profile-card"));
      if (!chefCards.length) return;

      const cardReveals = chefCards.map((c) => c.closest(".reveal")).filter(Boolean);

      w.gsap.fromTo(
        chefCards,
        { y: isMobile ? 28 : 55, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: isMobile ? 0.8 : 1,
          stagger: isMobile ? 0.08 : 0.14,
          ease: "power3.out",
          scrollTrigger: {
            trigger: chefCards[0].closest(".row") || section,
            start: "top 85%",
            once: true,
          },
          onComplete: () => {
            cardReveals.forEach(commitReveal);
            w.gsap.set(chefCards, { clearProps: "transform,opacity,scale,willChange" });
          },
        }
      );

      // Photos subtle unscale
      const photos = Array.from(section.querySelectorAll(".chef-card-img img, .profile-card-img img"));
      w.gsap.fromTo(
        photos,
        { scale: 1.14 },
        {
          scale: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: chefCards[0].closest(".row") || section,
            start: "top 85%",
            once: true,
          },
          onComplete: () => {
            w.gsap.set(photos, { clearProps: "transform" });
          },
        }
      );

      // Social icons bounce
      const socials = Array.from(section.querySelectorAll(".social-icon"));
      if (socials.length) {
        w.gsap.fromTo(
          socials,
          { scale: 0.5, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "back.out(2)",
            delay: 0.3,
            scrollTrigger: {
              trigger: chefCards[0].closest(".row") || section,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              w.gsap.set(socials, { clearProps: "transform,opacity" });
            },
          }
        );
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 11. Client Words / Testimonials — smooth reveal animation
   * ------------------------------------------------------------------ */
  function initTestimonialsAnimation() {
    if (reducedMotion || !hasGSAP) return;

    d.querySelectorAll("#testimonials, #reviews, #feedback").forEach((section) => {
      const heading = section.querySelector(".section-heading, .col-lg-8.text-center");
      if (heading) {
        const headingEls = Array.from(heading.querySelectorAll(".eyebrow, h2, p"));
        w.gsap.fromTo(
          headingEls,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            onComplete: () => {
              commitReveal(heading);
              w.gsap.set(headingEls, { clearProps: "transform,opacity" });
            },
          }
        );
      }

      const cards = Array.from(section.querySelectorAll(".testimonial-card, .feedback-card"));
      if (!cards.length) return;

      const cardReveals = cards.map((c) => c.closest(".reveal")).filter(Boolean);

      w.gsap.fromTo(
        cards,
        { y: isMobile ? 24 : 40, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: cards[0], start: "top 85%", once: true },
          onComplete: () => {
            cardReveals.forEach(commitReveal);
            w.gsap.set(cards, { clearProps: "transform,opacity,scale" });
          },
        }
      );

      // Quote icon rotate & scale
      const quoteIcons = Array.from(section.querySelectorAll(".quote-icon"));
      if (quoteIcons.length) {
        w.gsap.fromTo(
          quoteIcons,
          { scale: 0.5, rotation: -12, opacity: 0 },
          {
            scale: 1,
            rotation: 0,
            opacity: 0.35,
            duration: 0.9,
            ease: "back.out(1.8)",
            scrollTrigger: { trigger: cards[0], start: "top 85%", once: true },
            onComplete: () => {
              w.gsap.set(quoteIcons, { clearProps: "transform,opacity" });
            },
          }
        );
      }

      // Star sparkles
      const stars = Array.from(section.querySelectorAll(".stars i"));
      if (stars.length) {
        w.gsap.fromTo(
          stars,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            stagger: 0.07,
            ease: "back.out(2.5)",
            delay: 0.2,
            scrollTrigger: { trigger: cards[0], start: "top 85%", once: true },
            onComplete: () => {
              w.gsap.set(stars, { clearProps: "transform,opacity" });
            },
          }
        );
      }

      // Parallax drift on scroll
      if (!isMobile && section.id === "testimonials") {
        cards.forEach((card) => {
          w.gsap.to(card, {
            y: -18,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
      }

      // Carousel slide hook for fluid review switches
      const carousel = section.querySelector(".carousel");
      if (carousel) {
        carousel.addEventListener("slide.bs.carousel", (e) => {
          const nextSlide = e.relatedTarget;
          if (!nextSlide) return;
          const text = nextSlide.querySelector(".testimonial-text");
          const footer = nextSlide.querySelector("footer");
          const slideStars = Array.from(nextSlide.querySelectorAll(".stars i"));

          if (text) {
            w.gsap.fromTo(
              text,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "transform,opacity" }
            );
          }
          if (footer) {
            w.gsap.fromTo(
              footer,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: "power2.out", clearProps: "transform,opacity" }
            );
          }
          if (slideStars.length) {
            w.gsap.fromTo(
              slideStars,
              { scale: 0.5, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(2)", clearProps: "transform,opacity" }
            );
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 12. CTA sections — text and button animation
   * ------------------------------------------------------------------ */
  function initCtaAnimation() {
    if (reducedMotion || !hasGSAP) return;

    d.querySelectorAll(".cta-band, .showcase-band").forEach((cta) => {
      const eyebrow = cta.querySelector(".eyebrow");
      const h2 = cta.querySelector("h2");
      const lead = cta.querySelector("p.lead, p:not(.eyebrow)");
      const btns = Array.from(cta.querySelectorAll(".btn"));
      const revealParent = cta.querySelector(".reveal");

      const tl = w.gsap.timeline({
        scrollTrigger: { trigger: cta, start: "top 82%", once: true },
        onComplete: () => {
          if (revealParent) commitReveal(revealParent);
          w.gsap.set([eyebrow, h2, lead, ...btns].filter(Boolean), { clearProps: "transform,opacity" });
        },
      });

      if (eyebrow) {
        tl.fromTo(eyebrow, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0);
      }
      if (h2) {
        tl.fromTo(h2, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      }
      if (lead) {
        tl.fromTo(lead, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.2);
      }
      if (btns.length) {
        tl.fromTo(
          btns,
          { y: 22, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.12, ease: "back.out(1.6)" },
          0.3
        );
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 13. Newsletter — smooth scroll reveal
   * ------------------------------------------------------------------ */
  function initNewsletterAnimation() {
    if (reducedMotion || !hasGSAP) return;

    d.querySelectorAll(".newsletter-section, #newsletter, .newsletter").forEach((nl) => {
      const card = nl.querySelector(".newsletter-card") || nl;
      const badge = nl.querySelector(".newsletter-badge, .eyebrow");
      const title = nl.querySelector(".newsletter-title, h2, h3, .card-title");
      const desc = nl.querySelector("p.lead, p:not(.newsletter-note):not(.small)");
      const inputGroup = nl.querySelector(".newsletter-input-group, form");
      const note = nl.querySelector(".newsletter-note, p.small");

      const tl = w.gsap.timeline({
        scrollTrigger: { trigger: nl, start: "top 85%", once: true },
        onComplete: () => {
          commitReveal(nl);
          w.gsap.set([card, badge, title, desc, inputGroup, note].filter(Boolean), {
            clearProps: "transform,opacity",
          });
        },
      });

      if (card && card !== nl) {
        tl.fromTo(
          card,
          { y: isMobile ? 25 : 45, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: "power3.out" },
          0
        );
      }
      if (badge) {
        tl.fromTo(
          badge,
          { y: 16, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "back.out(1.5)" },
          0.15
        );
      }
      if (title) {
        tl.fromTo(
          title,
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" },
          0.25
        );
      }
      if (desc) {
        tl.fromTo(
          desc,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          0.35
        );
      }
      if (inputGroup) {
        tl.fromTo(
          inputGroup,
          { y: 24, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: "back.out(1.3)" },
          0.45
        );
      }
      if (note) {
        tl.fromTo(
          note,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          0.6
        );
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 14. Footer — subtle entrance animation
   * ------------------------------------------------------------------ */
  function initFooterAnimation() {
    if (reducedMotion || !hasGSAP) return;

    const footer = d.querySelector("footer.footer-section, footer");
    if (!footer) return;

    const cols = Array.from(footer.querySelectorAll(".footer-col"));
    const colReveals = cols.map((c) => c.closest(".reveal")).filter(Boolean);

    if (cols.length) {
      w.gsap.fromTo(
        cols,
        { y: isMobile ? 22 : 38, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: isMobile ? 0.06 : 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: footer, start: "top 85%", once: true },
          onComplete: () => {
            colReveals.forEach(commitReveal);
            w.gsap.set(cols, { clearProps: "transform,opacity" });
          },
        }
      );

      // Social icons micro-bounce
      const socials = Array.from(footer.querySelectorAll(".footer-social li a"));
      if (socials.length) {
        w.gsap.fromTo(
          socials,
          { scale: 0.7, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "back.out(2)",
            delay: 0.35,
            scrollTrigger: { trigger: footer, start: "top 85%", once: true },
            onComplete: () => {
              w.gsap.set(socials, { clearProps: "transform,opacity" });
            },
          }
        );
      }

      // Divider & bottom copyright row
      const bottomRow = footer.querySelector(".row:last-child");
      const hr = footer.querySelector("hr");
      if (bottomRow || hr) {
        w.gsap.fromTo(
          [hr, bottomRow].filter(Boolean),
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.45,
            scrollTrigger: { trigger: footer, start: "top 85%", once: true },
            onComplete: () => {
              w.gsap.set([hr, bottomRow].filter(Boolean), { clearProps: "transform,opacity" });
            },
          }
        );
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * 15. Images — fade + slight slide/scale animation
   * ------------------------------------------------------------------ */
  function initImageAnimations() {
    if (reducedMotion || !hasGSAP) return;

    d.querySelectorAll(".media-frame img, .showcase-image img").forEach((img) => {
      w.gsap.fromTo(
        img,
        { scale: 1.12, opacity: 0.9 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: { trigger: img.parentElement || img, start: "top 90%", once: true },
          onComplete: () => {
            w.gsap.set(img, { clearProps: "transform,opacity" });
          },
        }
      );
    });
  }

  /* ------------------------------------------------------------------ *
   * 16. Cards — staggered animation
   * ------------------------------------------------------------------ */
  function initCardsStaggerEngine() {
    if (reducedMotion || !hasGSAP) return;

    const unhandledCardContainers = d.querySelectorAll(
      ".stats-section .row, #concierge-status, #neighborhood .row, #etiquette .row"
    );
    unhandledCardContainers.forEach((container) => {
      const cards = Array.from(container.querySelectorAll(".stat-card, .status-callout, .info-card, .status-banner"));
      if (!cards.length) return;

      const cardReveals = cards.map((c) => c.closest(".reveal")).filter((el) => el && !revealed.has(el));

      w.gsap.fromTo(
        cards,
        { y: isMobile ? 20 : 40, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: container, start: "top 88%", once: true },
          onComplete: () => {
            cardReveals.forEach(commitReveal);
            w.gsap.set(cards, { clearProps: "transform,opacity,scale" });
          },
        }
      );
    });
  }

  /* ------------------------------------------------------------------ *
   * 17. Buttons — subtle hover animation (GSAP mouseenter/leave/down)
   * ------------------------------------------------------------------ */
  function initButtonHoverAnimations() {
    if (reducedMotion || !hasGSAP || !isFinePointer) return;

    const buttons = d.querySelectorAll(".btn-primary, .btn-outline-light, .navbar-login, .btn-filter, .social-icon");
    buttons.forEach((btn) => {
      const icon = btn.querySelector("i, .bi");
      const isLeftArrow =
        icon && (icon.classList.contains("bi-arrow-left") || icon.classList.contains("bi-chevron-left"));
      const nudge = isLeftArrow ? -3 : 3;

      btn.addEventListener("mouseenter", () => {
        w.gsap.to(btn, { y: -3, scale: 1.03, duration: 0.28, ease: "power2.out", overwrite: "auto" });
        if (icon && !btn.classList.contains("social-icon")) {
          w.gsap.to(icon, { x: nudge, duration: 0.28, ease: "power2.out", overwrite: "auto" });
        }
      });

      btn.addEventListener("mouseleave", () => {
        w.gsap.to(btn, { y: 0, scale: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        if (icon && !btn.classList.contains("social-icon")) {
          w.gsap.to(icon, { x: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        }
      });

      btn.addEventListener("mousedown", () => {
        w.gsap.to(btn, { scale: 0.97, duration: 0.12, ease: "power1.out", overwrite: "auto" });
      });

      btn.addEventListener("mouseup", () => {
        w.gsap.to(btn, { scale: 1.03, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 18. Counters
   * ------------------------------------------------------------------ */
  function initCounters() {
    const counters = Array.from(d.querySelectorAll(".counter"));
    if (!counters.length) return;

    const run = (counter) => {
      const target = parseInt(counter.dataset.target || "0", 10);
      if (!target) return;
      if (reducedMotion || !hasGSAP) {
        counter.textContent = target.toLocaleString();
        return;
      }
      const state = { value: 0 };
      w.gsap.to(state, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          counter.textContent = Math.floor(state.value).toLocaleString();
        },
      });
    };

    if (hasGSAP && !reducedMotion) {
      w.ScrollTrigger.batch(counters, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => batch.forEach(run),
      });
    } else {
      counters.forEach(run);
    }
  }

  /* ------------------------------------------------------------------ *
   * 19. Generic reveals fallback (ensures 100% elements are revealed)
   * ------------------------------------------------------------------ */
  function initGenericReveals() {
    const remaining = revealEls.filter((el) => !revealed.has(el));
    if (!remaining.length) return;

    if (reducedMotion || !hasGSAP) {
      remaining.forEach(commitReveal);
      if (reducedMotion) return;
      initRevealObserver();
      return;
    }

    w.gsap.set(remaining, { willChange: "transform, opacity" });

    w.ScrollTrigger.batch(remaining, {
      start: "top 88%",
      once: true,
      batchMax: 6,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          w.gsap.fromTo(
            el,
            { y: isMobile ? 24 : 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.95,
              ease: "power3.out",
              delay: Math.min(i, 4) * 0.08,
              overwrite: true,
              onComplete: () => commitReveal(el),
              onInterrupt: () => commitReveal(el),
            }
          );
        });
      },
    });

    // Safety net: anything already on screen shows immediately
    w.ScrollTrigger.addEventListener("refreshInit", () => {
      remaining.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < w.innerHeight && rect.bottom > 0) commitReveal(el);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 20. Master Animation Orchestrator
   * ------------------------------------------------------------------ */
  function initAnimations() {
    initHeaderAnimation();
    initHeroAnimation();
    initAboutSectionAnimation();
    initServicesAnimation();
    initSelectedWorkAnimation();
    initTeamAnimation();
    initTestimonialsAnimation();
    initCtaAnimation();
    initNewsletterAnimation();
    initFooterAnimation();
    initImageAnimations();
    initCardsStaggerEngine();
    initButtonHoverAnimations();
    initCounters();
    initGenericReveals();

    if (hasGSAP) w.ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------ *
   * 21. Menu filtering
   * ------------------------------------------------------------------ */
  const filterButtons = Array.from(d.querySelectorAll(".btn-filter"));
  const menuItems = Array.from(d.querySelectorAll(".menu-item"));

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      const filter = btn.dataset.filter || "all";
      const matching = menuItems.filter((item) => filter === "all" || item.dataset.category === filter);

      menuItems.forEach((item) => {
        const isMatch = matching.includes(item);
        item.classList.toggle("hide", !isMatch);
        item.classList.toggle("show", isMatch);
      });

      if (!reducedMotion && hasGSAP) {
        w.gsap.fromTo(
          matching,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.05,
            overwrite: true,
            clearProps: "opacity,transform",
          }
        );
      }
    });
  });

  /* ------------------------------------------------------------------ *
   * 22. Lightbox
   * ------------------------------------------------------------------ */
  if (typeof w.GLightbox !== "undefined") {
    const lightboxOptions = {
      selector: ".glightbox",
      touchNavigation: true,
      loop: true,
      autoplayVideos: false,
      openEffect: "fade",
      closeEffect: "fade",
      slideEffect: "fade",
    };

    w.stacklyLightbox = w.GLightbox(lightboxOptions);

    w.setLightboxElements = function (elements) {
      const instance = w.stacklyLightbox;
      if (!instance || typeof instance.setElements !== "function") return;

      const nodes = elements || [];
      instance.setElements(nodes);

      (instance.elements || []).forEach((entry, i) => {
        if (entry && !entry.node && nodes[i]) entry.node = nodes[i];
      });
    };
  }

  /* ------------------------------------------------------------------ *
   * 23. Forms & Strict Email Validation (letters, numbers, @, . only)
   * ------------------------------------------------------------------ */
  const EMAIL_STRICT_REGEX = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

  function attachEmailValidation(input) {
    if (!input || input.__emailBound) return;
    input.__emailBound = true;

    input.setAttribute("pattern", "[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*\\.[a-zA-Z]{2,}");
    input.setAttribute("title", "Only letters, numbers, @, and . are allowed (e.g. name@example.com)");

    // 1. Prevent typing disallowed characters (only letters, numbers, @, and .)
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;
      if (!/^[a-zA-Z0-9@.]$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // 2. Real-time sanitation and format validation
    const validate = () => {
      const raw = input.value;
      const filtered = raw.replace(/[^a-zA-Z0-9@.]/g, "");
      if (raw !== filtered) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const diff = raw.length - filtered.length;
        input.value = filtered;
        if (start !== null) {
          input.setSelectionRange(Math.max(0, start - diff), Math.max(0, end - diff));
        }
      }

      const val = input.value.trim();
      const feedback = input.closest(".col-md-6, .auth-field, .mb-3, form")?.querySelector(".invalid-feedback");

      if (!val) {
        if (input.required) {
          input.setCustomValidity("Please enter your email address.");
          if (feedback) feedback.textContent = "Please enter your email address.";
        } else {
          input.setCustomValidity("");
        }
      } else if (!EMAIL_STRICT_REGEX.test(val)) {
        input.setCustomValidity("Please enter a valid email format (only letters, numbers, @, and . allowed).");
        if (feedback) {
          feedback.textContent =
            "Please enter a valid email (only letters, numbers, @, and . allowed, e.g. name@example.com).";
        }
      } else {
        input.setCustomValidity("");
      }
    };

    input.addEventListener("input", validate);
    input.addEventListener("blur", validate);
    input.addEventListener("paste", () => setTimeout(validate, 0));

    if (input.value) validate();
  }

  function initEmailValidation() {
    d.querySelectorAll('input[type="email"], input[name="email"], #email').forEach(attachEmailValidation);

    // Newsletter forms: validate the email, then hand off to the stub page.
    // preventDefault is unconditional so the browser never performs its native
    // GET submission; only a valid address navigates, to the form's action.
    d.querySelectorAll(".newsletter-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const emailInput = form.querySelector('input[type="email"], input[name="email"]');
        if (!emailInput) return;

        emailInput.dispatchEvent(new Event("input"));
        const val = emailInput.value.trim();

        if (!val || !EMAIL_STRICT_REGEX.test(val)) {
          emailInput.setCustomValidity("Please enter a valid email address (only letters, numbers, @, and . allowed).");
          emailInput.reportValidity();
          emailInput.focus();

          if (hasGSAP && !reducedMotion) {
            w.gsap.fromTo(
              emailInput.closest(".newsletter-input-group") || emailInput,
              { x: -8 },
              { x: 0, duration: 0.45, ease: "elastic.out(1.2, 0.3)", clearProps: "transform" }
            );
          }
          return;
        }

        emailInput.setCustomValidity("");
        w.location.href = form.getAttribute("action") || "404.html";
      });
    });
  }

  /* Name (letters & spaces only) and Phone (digits only) validation.
     Applies to contact/reservation forms on both desktop and mobile: keydown
     blocks disallowed keys, while input/blur/paste re-validate (mobile
     keyboards and paste do not reliably emit usable keydown events). */
  const NAME_ONLY_REGEX = /^[A-Za-z\s]+$/;
  const DIGITS_ONLY_REGEX = /^[0-9]+$/;

  function setFieldState(input, feedback, message) {
    if (message) {
      input.setCustomValidity(message);
      input.classList.add("is-invalid");
      if (feedback) feedback.textContent = message;
    } else {
      input.setCustomValidity("");
      input.classList.remove("is-invalid");
    }
  }

  function attachNameValidation(input) {
    if (!input || input.__nameBound) return;
    input.__nameBound = true;

    input.setAttribute("inputmode", "text");
    input.setAttribute("pattern", "[A-Za-z\\s]+");
    input.setAttribute("title", "Letters and spaces only.");

    // 1. Block disallowed characters while typing (desktop)
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.key.length > 1) return;
      if (!/^[A-Za-z\s]$/.test(e.key)) e.preventDefault();
    });

    // 2. Real-time + submission validation (covers mobile & paste)
    const validate = () => {
      const val = input.value.trim();
      const feedback = input.closest(".col-md-6, .auth-field, .mb-3, form")?.querySelector(".invalid-feedback");

      if (!val) {
        setFieldState(input, feedback, input.required ? "Please enter your full name." : "");
      } else if (!NAME_ONLY_REGEX.test(input.value)) {
        setFieldState(input, feedback, "Name can contain letters and spaces only (no numbers or symbols).");
      } else {
        setFieldState(input, feedback, "");
      }
    };

    input.addEventListener("input", validate);
    input.addEventListener("blur", validate);
    input.addEventListener("paste", () => setTimeout(validate, 0));
    if (input.value) validate();
  }

  function attachPhoneValidation(input) {
    if (!input || input.__phoneBound) return;
    input.__phoneBound = true;

    input.setAttribute("inputmode", "numeric");
    input.setAttribute("pattern", "[0-9]+");
    input.setAttribute("title", "Numbers only.");

    // 1. Block disallowed characters while typing (desktop)
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.key.length > 1) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });

    // 2. Real-time + submission validation (covers mobile & paste)
    const validate = () => {
      const val = input.value.trim();
      const feedback = input.closest(".col-md-6, .auth-field, .mb-3, form")?.querySelector(".invalid-feedback");

      if (!val) {
        setFieldState(input, feedback, input.required ? "Please enter your phone number." : "");
      } else if (!DIGITS_ONLY_REGEX.test(val)) {
        setFieldState(input, feedback, "Phone number can contain numbers only (no letters or symbols).");
      } else {
        setFieldState(input, feedback, "");
      }
    };

    input.addEventListener("input", validate);
    input.addEventListener("blur", validate);
    input.addEventListener("paste", () => setTimeout(validate, 0));
    if (input.value) validate();
  }

  function initFieldValidation() {
    d.querySelectorAll('.needs-validation input[name="name"]').forEach(attachNameValidation);
    d.querySelectorAll('.needs-validation input[name="phone"]').forEach(attachPhoneValidation);
  }

  const successToastEl = d.getElementById("successToast");
  let toastInstance = null;
  if (successToastEl && typeof w.bootstrap !== "undefined") {
    toastInstance = w.bootstrap.Toast.getOrCreateInstance(successToastEl, { delay: 4000 });
  }

  function showSuccess(message) {
    if (!successToastEl || !toastInstance) return;
    const body = successToastEl.querySelector(".toast-body");
    if (body && message) body.textContent = message;
    toastInstance.show();
  }

  d.querySelectorAll(".needs-validation").forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Enforce email/name/phone validation on all relevant fields inside form
        form.querySelectorAll('input[type="email"], input[name="email"], #email').forEach((em) => {
          em.dispatchEvent(new Event("input"));
        });
        form.querySelectorAll('input[name="name"], input[name="phone"]').forEach((fld) => {
          fld.dispatchEvent(new Event("input"));
        });

        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          const firstInvalid = form.querySelector(":invalid");
          if (firstInvalid) {
            firstInvalid.focus({ preventScroll: true });
            firstInvalid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
          }
          return;
        }

        // Forms that mark a target hand off to it once every field validates,
        // instead of the toast + reset the other forms below still do.
        if (form.dataset.redirect) {
          w.location.href = form.dataset.redirect;
          return;
        }

        const name = form.querySelector("#name");
        form.classList.remove("was-validated");
        form.reset();

        if (name && w.gsap && !reducedMotion) {
          w.gsap.fromTo(
            form,
            { scale: 0.99 },
            { scale: 1, duration: 0.4, ease: "power2.out", clearProps: "transform" }
          );
        }

        showSuccess(
          form.dataset.successMessage ||
            "Thank you! Your reservation request has been received. We'll confirm shortly."
        );
      },
      false
    );
  });

  /* ------------------------------------------------------------------ *
   * 24. Misc & Lifecycle listeners
   * ------------------------------------------------------------------ */
  const dateInput = d.getElementById("date");
  if (dateInput) {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    dateInput.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
  }

  // Keep ScrollTrigger positions accurate once fonts/images settle
  w.addEventListener("load", () => {
    if (hasGSAP) w.ScrollTrigger.refresh();
    onScroll();
  });
  if (d.fonts && d.fonts.ready && hasGSAP) {
    d.fonts.ready.then(() => w.ScrollTrigger.refresh());
  }

  boot();
})();