// docs/js/smooth-scroll.js
document.addEventListener("DOMContentLoaded", function () {
  // Select all anchor links that start with #
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetID = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetID);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        // Optionally update the URL hash without jumping
        history.pushState(null, null, "#" + targetID);
      }
    });
  });
});
