// ── Boot: run ALL checks after every const/let is initialised ───────────────
initAllSpeciesAC();
checkShinyRotomUnlock();
checkLivingDexComplete();
applyGoldTheme();
applyShinyRotom();
applyLightMode();
ensureLegality(); // preload in background

// Boot greeting — show onboarding first if new user, else greet by name
const isReturning = checkTrainerOnboarding();
if (isReturning) {
  setTimeout(() => {
    const hr = new Date().getHours();
    let timeKey;
    if      (hr >= 5  && hr < 9)  timeKey = 'boot_morning';
    else if (hr >= 9  && hr < 17) timeKey = 'boot_afternoon';
    else if (hr >= 17 && hr < 21) timeKey = 'boot_evening';
    else if (hr >= 21 || hr < 2)  timeKey = 'boot_night';
    else                           timeKey = 'boot_earlyMorning';
    rotomSay(timeKey);
  }, 800);
}

// Start idle chatter
rotomIdleTimer = setTimeout(rotomIdle, 120000 + Math.random() * 60000);

// ── Auto-hide bottom nav on scroll ──────────────────────────────────────────
(function() {
  const pageContent = document.getElementById('page-content');
  const bottomNav   = document.getElementById('bottom-nav');
  if (!pageContent || !bottomNav) return;

  let lastScrollY  = 0;
  let ticking      = false;

  pageContent.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const currentY = pageContent.scrollTop;
      const atTop    = currentY <= 10;
      const scrollingUp = currentY < lastScrollY;

      if (atTop || scrollingUp) {
        bottomNav.classList.remove('nav-hidden');
      } else {
        bottomNav.classList.add('nav-hidden');
      }

      lastScrollY = currentY;
      ticking = false;
    });
  }, { passive: true });
})();

