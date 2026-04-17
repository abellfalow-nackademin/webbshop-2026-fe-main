export default function loadFooter() {
  const footerContainer = document.getElementById("footer-container");
  if (!footerContainer) return;
  const footerHTML = `
     <footer class="site-footer">
      <div class="footer-content">
        <p>&copy; 2024 Plot Twist. All rights reserved.</p>
      </div>
    </footer>
  `;
  footerContainer.innerHTML = footerHTML;
}

loadFooter();
