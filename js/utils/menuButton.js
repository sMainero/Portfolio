/**
 * Sets up the portfolio modal menu button.
 * Exposes `window.openPortfolioModal` for use as an onclick handler.
 * @returns {void}
 */
import { Toast } from '../3d/components/tutorial/Toast.js';

export const setupMenuButton = () => {
  const toggleButton = document.getElementById('menuToggleButton');
  const modal = document.getElementById('portfolioModal');
  const closeButton = document.getElementById('portfolioModalClose');

  if (!toggleButton || !modal) return;

  const openModal = () => {
    modal.classList.add('is-open');
    toggleButton.classList.add('is-active');
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    toggleButton.classList.remove('is-active');
  };

  window.openPortfolioModal = openModal;

  window.showClipboardToast = () => {
    Toast.getInstance().show({
      text: 'Email copied to clipboard!',
      position: 'top',
      autoHideMs: 2000,
    });
  };

  window.copyEmailToClipboard = (email) => {
    const execFallback = () => {
      const ta = document.createElement('textarea');
      ta.value = email;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.setSelectionRange(0, email.length);
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showClipboardToast();
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(email)
        .then(() => window.showClipboardToast())
        .catch(() => execFallback());
    } else {
      execFallback();
    }
  };

  closeButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
};
