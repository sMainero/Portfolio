export const closeStartScreen = (startScreenElement) => {
  if (!startScreenElement) return;

  const iris = startScreenElement.querySelector('.start-screen-iris');

  // Double rAF ensures the browser has painted before the transition fires,
  // preventing first-frame skips on Chrome, Safari, and Firefox mobile.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      startScreenElement.classList.add('start-screen-closing');

      const target = iris ?? startScreenElement;
      target.addEventListener(
        'transitionend',
        () => startScreenElement.remove(),
        { once: true },
      );
    });
  });
};
