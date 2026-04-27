/**
 * Sets up the portfolio modal menu button.
 * Exposes `window.openPortfolioModal` for use as an onclick handler.
 * @returns {void}
 */
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

  closeButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
};
