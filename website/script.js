document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Select elements to animate
  const animatedElements = document.querySelectorAll(
    ".fade-in-up, .fade-in-left, .fade-in-right"
  );
  animatedElements.forEach((el) => observer.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId === "#") {
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Mobile menu toggle (simple version)
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  // Add mobile styles dynamically if clicked
  /* 
       Note: A full mobile menu overlay would require more CSS. 
       For this concise version, we'll just toggle display 
       or alert "Coming soon" if CSS doesn't support it fully yet.
       But let's do a simple class toggle that CSS can verify.
    */

  /* CSS didn't explicitly safeguard a 'mobile-open' class for .nav-links. 
       Let's leave it as a placeholder or add a simple inline style toggle for now.
    */
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      // Simple toggle for demonstration
      const isFlex = navLinks.style.display === "flex";
      if (isFlex) {
        navLinks.style.display = ""; // revert to CSS
      } else {
        navLinks.style.display = "flex";
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.top = "100%";
        navLinks.style.left = "0";
        navLinks.style.width = "100%";
        navLinks.style.background = "var(--glass-bg)";
        navLinks.style.padding = "1rem";
        navLinks.style.backdropFilter = "blur(16px)";
        navLinks.style.borderRadius = "1rem";
        navLinks.style.marginTop = "1rem";
      }
    });
  }
});
