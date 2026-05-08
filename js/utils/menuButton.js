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

  // Tab switching
  const tabs = modal.querySelectorAll('.portfolio-modal-tab');
  const panels = modal.querySelectorAll('.portfolio-tab-panel');

  const switchTab = (tabName) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((panel) => {
      const isActive = panel.id === `pm-panel-${tabName}`;
      panel.classList.toggle('is-hidden', !isActive);
      if (isActive) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Focus trap
  const _getFocusable = () =>
    [
      ...modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => !el.closest('[hidden]') && !el.hasAttribute('disabled'));

  const _trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = _getFocusable();
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const _handleEscape = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  const openModal = () => {
    switchTab('info');
    modal.classList.add('is-open');
    toggleButton.classList.add('is-active');
    toggleButton.setAttribute('aria-expanded', 'true');
    modal.addEventListener('keydown', _trapFocus);
    window.addEventListener('keydown', _handleEscape);
    _getFocusable()[0]?.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    toggleButton.classList.remove('is-active');
    toggleButton.setAttribute('aria-expanded', 'false');
    modal.removeEventListener('keydown', _trapFocus);
    window.removeEventListener('keydown', _handleEscape);
    toggleButton.focus();
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
