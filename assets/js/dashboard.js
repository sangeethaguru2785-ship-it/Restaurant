/* =============================================================
   Stackly — Premium Restaurant Dashboards JavaScript
   Controls: Mobile sidebar toggle, Chart.js instances,
             GSAP animations, counters, and auth sync.
   ============================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const d = document;
  const w = window;

  /* ---------------------------------------------------------------- *
   * 1. Mobile Sidebar Toggle & Backdrop
   * ---------------------------------------------------------------- */
  const sidebar = d.getElementById("dashboardSidebar");
  const sidebarToggle = d.getElementById("sidebarToggle");
  const sidebarClose = d.getElementById("sidebarClose");
  const backdrop = d.getElementById("sidebarBackdrop");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("show");
    if (backdrop) backdrop.classList.add("active");
    d.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("show");
    if (backdrop) backdrop.classList.remove("active");
    d.body.style.overflow = "";
  }

  if (sidebarToggle) sidebarToggle.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);

  // Close sidebar on pressing Escape
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("show")) {
      closeSidebar();
    }
  });

  /* ---------------------------------------------------------------- *
   * 2. GSAP Entrance Animations
   * ---------------------------------------------------------------- */
  if (typeof gsap !== "undefined") {
    // Stagger in stat cards only in active section
    gsap.from(".dashboard-section.active .stat-card-anim", {
      opacity: 0,
      y: 28,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });

    // Fade in sections only in active section
    gsap.from(".dashboard-section.active .dash-card-anim", {
      opacity: 0,
      y: 35,
      duration: 0.9,
      stagger: 0.15,
      delay: 0.25,
      ease: "power2.out",
      clearProps: "all"
    });
  }

  /* ---------------------------------------------------------------- *
   * 3. Number Counter Animation
   * ---------------------------------------------------------------- */
  const counters = d.querySelectorAll(".dash-counter");
  counters.forEach(function (counter) {
    const target = parseFloat(counter.getAttribute("data-target") || 0);
    const prefix = counter.getAttribute("data-prefix") || "";
    const suffix = counter.getAttribute("data-suffix") || "";
    const isCurrency = prefix === "$";

    let current = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      if (isCurrency) {
        counter.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
      } else if (Number.isInteger(target)) {
        counter.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
      } else {
        counter.textContent = prefix + current.toFixed(1) + suffix;
      }
    }, stepTime);
  });

  /* ---------------------------------------------------------------- *
   * 4. Admin Revenue Chart (Chart.js)
   * ---------------------------------------------------------------- */
  const revenueChartCanvas = d.getElementById("revenueChart");
  if (revenueChartCanvas && typeof Chart !== "undefined") {
    const ctx = revenueChartCanvas.getContext("2d");

    // Gradients
    const gradientGold = ctx.createLinearGradient(0, 0, 0, 300);
    gradientGold.addColorStop(0, "rgba(201, 162, 39, 0.35)");
    gradientGold.addColorStop(1, "rgba(201, 162, 39, 0.0)");

    const gradientBurgundy = ctx.createLinearGradient(0, 0, 0, 300);
    gradientBurgundy.addColorStop(0, "rgba(122, 31, 43, 0.4)");
    gradientBurgundy.addColorStop(1, "rgba(122, 31, 43, 0.0)");

    const chartDataSets = {
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        revenue: [5800, 6200, 5400, 7800, 11400, 13800, 9200],
        orders: [42, 48, 39, 56, 88, 104, 76]
      },
      "30d": {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        revenue: [38200, 44500, 49800, 56200],
        orders: [280, 320, 365, 410]
      },
      "1y": {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        revenue: [120000, 115000, 140000, 155000, 175000, 190000, 185000, 195000, 210000, 225000, 240000, 260000],
        orders: [850, 820, 990, 1100, 1250, 1340, 1310, 1390, 1480, 1580, 1690, 1820]
      }
    };

    let activePeriod = "7d";

    const revenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartDataSets[activePeriod].labels,
        datasets: [
          {
            label: "Revenue ($)",
            data: chartDataSets[activePeriod].revenue,
            borderColor: "#c9a227",
            backgroundColor: gradientGold,
            borderWidth: 2.5,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: "#c9a227",
            pointBorderColor: "#171615",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: "y"
          },
          {
            label: "Orders Count",
            data: chartDataSets[activePeriod].orders,
            borderColor: "#9a2a38",
            backgroundColor: gradientBurgundy,
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.38,
            pointBackgroundColor: "#9a2a38",
            pointBorderColor: "#171615",
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5.5,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: "#ddd4c0",
              font: { family: "Inter", size: 12 },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 18
            }
          },
          tooltip: {
            backgroundColor: "rgba(17, 17, 17, 0.95)",
            titleColor: "#e3c766",
            bodyColor: "#f7f1e3",
            borderColor: "rgba(201, 162, 39, 0.3)",
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(247, 241, 227, 0.06)",
              drawBorder: false
            },
            ticks: {
              color: "#a39b8b",
              font: { family: "Inter", size: 11 }
            }
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            grid: {
              color: "rgba(247, 241, 227, 0.06)",
              drawBorder: false
            },
            ticks: {
              color: "#a39b8b",
              font: { family: "Inter", size: 11 },
              callback: function (val) {
                return "$" + (val >= 1000 ? (val / 1000) + "k" : val);
              }
            }
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: "#a39b8b",
              font: { family: "Inter", size: 11 }
            }
          }
        }
      }
    });

    // Chart period buttons
    const periodButtons = d.querySelectorAll("[data-period]");
    periodButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        periodButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const period = btn.getAttribute("data-period");
        if (chartDataSets[period]) {
          revenueChart.data.labels = chartDataSets[period].labels;
          revenueChart.data.datasets[0].data = chartDataSets[period].revenue;
          revenueChart.data.datasets[1].data = chartDataSets[period].orders;
          revenueChart.update();
        }
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * 5. Category Distribution Donut Chart (Admin)
   * ---------------------------------------------------------------- */
  const categoryChartCanvas = d.getElementById("categoryChart");
  if (categoryChartCanvas && typeof Chart !== "undefined") {
    new Chart(categoryChartCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Chef's Special Menus", "Individual Dishes", "Wine Cellar", "Private Dining"],
        datasets: [
          {
            data: [42, 28, 18, 12],
            backgroundColor: ["#c9a227", "#7a1f2b", "#5e1721", "#e3c766"],
            borderColor: "#171615",
            borderWidth: 3,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ddd4c0",
              font: { family: "Inter", size: 11 },
              padding: 14,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: "rgba(17, 17, 17, 0.95)",
            titleColor: "#e3c766",
            bodyColor: "#f7f1e3",
            borderColor: "rgba(201, 162, 39, 0.3)",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return " " + context.label + ": " + context.parsed + "%";
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * 6. User Profile & Dynamic Welcome Sync
   * ---------------------------------------------------------------- */
  try {
    const raw = localStorage.getItem("stackly_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.name) {
        const welcomeEls = d.querySelectorAll("[data-user-name]");
        welcomeEls.forEach(function (el) {
          el.textContent = user.name;
        });

        const avatarEls = d.querySelectorAll("[data-user-initials]");
        const initials = user.name
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        avatarEls.forEach(function (el) {
          el.textContent = initials || "U";
        });
      }
    }
  } catch (_) {}

  /* ---------------------------------------------------------------- *
   * 7. Section Navigation Router (SPA Style)
   * ---------------------------------------------------------------- */
  function switchSection(targetId) {
    if (!targetId) return;

    // Clean up identifier (e.g. "#orders" -> "orders" or "section-orders")
    let raw = targetId.replace(/^#/, "").trim();
    let targetEl = d.getElementById(raw);
    if (!targetEl && !raw.startsWith("section-")) {
      targetEl = d.getElementById("section-" + raw);
    }
    if (!targetEl && raw.startsWith("section-")) {
      targetEl = d.getElementById(raw.replace(/^section-/, ""));
    }

    if (!targetEl) return;

    const resolvedId = targetEl.id; // e.g. "section-orders"
    const slug = resolvedId.replace(/^section-/, ""); // e.g. "orders"

    // 1. Hide all sections & show target
    const currentSections = d.querySelectorAll(".dashboard-section");
    currentSections.forEach(function (sec) {
      sec.classList.remove("active");
    });
    targetEl.classList.add("active");

    // 2. Update active states on sidebar navigation
    const currentNavLinks = d.querySelectorAll(".sidebar-nav .sidebar-link");
    currentNavLinks.forEach(function (link) {
      const href = (link.getAttribute("href") || "").replace(/^#/, "");
      const dataSec = (link.getAttribute("data-section") || "").replace(/^section-/, "");

      if (href === slug || dataSec === slug || href === resolvedId || dataSec === resolvedId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // 3. Update URL hash without causing a page jump
    try {
      if (w.history.pushState) {
        w.history.pushState(null, null, "#" + slug);
      } else {
        w.location.hash = slug;
      }
    } catch (_) {}

    // 4. Smooth scroll to top of viewport
    w.scrollTo({ top: 0, behavior: "smooth" });

    // 5. If on mobile view, close the sidebar drawer
    if (w.innerWidth < 992) {
      closeSidebar();
    }

    // 6. GSAP smooth fade & slide entrance
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        targetEl,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "all" }
      );
    }

    // 7. If Revenue chart is in view, refresh it
    if ((slug === "dashboard" || slug === "reports") && typeof revenueChart !== "undefined" && revenueChart) {
      setTimeout(function () {
        revenueChart.resize();
      }, 50);
    }
  }

  // Bind click on sidebar links
  const sidebarLinks = d.querySelectorAll(".sidebar-nav .sidebar-link");
  sidebarLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    const dataSec = link.getAttribute("data-section") || "";

    if (href.startsWith("#") || dataSec) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const target = dataSec || href.slice(1);
        switchSection(target);
      });
    }
  });

  // Cross-section links (e.g. [data-switch-section="section-orders"] or href="#...")
  d.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-switch-section]");
    if (trigger) {
      e.preventDefault();
      const target = trigger.getAttribute("data-switch-section");
      if (target) switchSection(target);
    }
  });

  // Deep-linking via URL hash on initial load
  if (w.location.hash) {
    const initialHash = w.location.hash.slice(1);
    if (initialHash) {
      switchSection(initialHash);
    }
  }

  // Handle browser Back / Forward history navigation
  w.addEventListener("hashchange", function () {
    if (w.location.hash) {
      switchSection(w.location.hash.slice(1));
    }
  });

  /* ---------------------------------------------------------------- *
   * 8. Toast Feedback Utility
   * ---------------------------------------------------------------- */
  let toastTimer = null;
  function showToast(message, iconClass) {
    let toast = d.getElementById("dashToast");
    if (!toast) {
      toast = d.createElement("div");
      toast.id = "dashToast";
      toast.className = "dash-toast";
      d.body.appendChild(toast);
    }

    const iconHtml = iconClass ? `<i class="${iconClass} text-gold"></i>` : `<i class="bi bi-check2-circle text-gold"></i>`;
    toast.innerHTML = `${iconHtml}<span>${message}</span>`;
    toast.classList.add("show");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3200);
  }

  // Expose toast globally for quick button triggers
  w.showDashToast = showToast;

  // Intercept Save Settings & Profile forms
  const feedbackForms = d.querySelectorAll("[data-feedback-form]");
  feedbackForms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const msg = form.getAttribute("data-feedback-msg") || "Preferences updated successfully.";
      showToast(msg, "bi bi-check2-circle");
    });
  });

  /* ---------------------------------------------------------------- *
   * 9. In-Page Tab Filters
   * ---------------------------------------------------------------- */
  // Generic Filter handler
  function setupFilter(btnSelector, itemSelector, dataAttr) {
    const buttons = d.querySelectorAll(btnSelector);
    const items = d.querySelectorAll(itemSelector);

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filterVal = btn.getAttribute(dataAttr) || "all";

        items.forEach(function (item) {
          const itemVal = item.getAttribute(dataAttr) || "";
          if (filterVal === "all" || itemVal === filterVal || itemVal.includes(filterVal)) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
    });
  }

  // Orders status filter (Admin)
  setupFilter("[data-order-filter]", ".order-row-item", "data-order-status");

  // Reservation status filter (Admin: upcoming, seated, completed)
  setupFilter("[data-res-filter]", ".res-row-item", "data-res-status");

  // Customer tier filter (Admin)
  setupFilter("[data-customer-filter]", ".customer-row-item", "data-customer-tier");

  // Menu category filter (Admin)
  setupFilter("[data-menu-category]", ".menu-card-item", "data-menu-category");

  // Reviews star filter (Admin)
  setupFilter("[data-review-filter]", ".review-row-item", "data-review-rating");

  // Customer Orders filter (Customer)
  setupFilter("[data-cust-order-filter]", ".cust-order-item", "data-cust-order-type");

  // Customer Reservations filter (Customer)
  setupFilter("[data-cust-res-filter]", ".cust-res-item", "data-cust-res-status");

  // Customer Favorites filter (Customer)
  setupFilter("[data-cust-fav-filter]", ".cust-fav-item", "data-cust-fav-type");

  /* ---------------------------------------------------------------- *
   * 10. Real-time Search Handlers
   * ---------------------------------------------------------------- */
  function setupSearch(inputId, itemSelector) {
    const input = d.getElementById(inputId);
    if (!input) return;

    input.addEventListener("input", function () {
      const q = input.value.toLowerCase().trim();
      const items = d.querySelectorAll(itemSelector);
      items.forEach(function (item) {
        const text = (item.textContent || "").toLowerCase();
        if (!q || text.includes(q)) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  setupSearch("orderSearchInput", ".order-row-item");
  setupSearch("customerSearchInput", ".customer-row-item");
  setupSearch("menuSearchInput", ".menu-card-item");
  setupSearch("custOrderSearchInput", ".cust-order-item");

  /* ---------------------------------------------------------------- *
   * 11. Interactive Switches & Action Buttons
   * ---------------------------------------------------------------- */
  d.addEventListener("change", function (e) {
    if (e.target.matches("[data-menu-toggle]")) {
      const isChecked = e.target.checked;
      const dishName = e.target.getAttribute("data-dish-name") || "Item";
      showToast(`${dishName} is now ${isChecked ? "Available" : "Marked as Sold Out"}`, isChecked ? "bi bi-check-circle" : "bi bi-exclamation-circle");
    }
  });

  /* ---------------------------------------------------------------- *
   * 13. Email Filtering & Format Validation (Strict: letters, numbers, @, .)
   * ---------------------------------------------------------------- */
  const EMAIL_STRICT_REGEX = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  d.querySelectorAll('input[type="email"]').forEach(function (input) {
    input.setAttribute("pattern", "[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*\\.[a-zA-Z]{2,}");
    input.setAttribute("title", "Only letters, numbers, @, and . are allowed (e.g. name@example.com)");

    input.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;
      if (!/^[a-zA-Z0-9@.]$/.test(e.key)) e.preventDefault();
    });

    input.addEventListener("input", function () {
      input.value = input.value.replace(/[^a-zA-Z0-9@.]/g, "");
      const val = input.value.trim();
      if (val && !EMAIL_STRICT_REGEX.test(val)) {
        input.setCustomValidity("Please enter a valid email format (only letters, numbers, @, and . allowed).");
      } else {
        input.setCustomValidity("");
      }
    });

    input.addEventListener("paste", function () {
      setTimeout(function () {
        input.value = input.value.replace(/[^a-zA-Z0-9@.]/g, "");
      }, 0);
    });
  });
});

