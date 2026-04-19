/**
 * Immediately starts the iris-close animation and returns a Promise that
 * resolves when the transition finishes. The element is NOT removed here —
 * call the resolved value (a `remove` function) when the rest of startup is
 * also done, so the screen is only dismissed when both are ready.
 */
export const beginCloseStartScreen = (startScreenElement) => {
  return new Promise((resolve) => {
    if (!startScreenElement) {
      resolve(() => {});
      return;
    }

    const iris = startScreenElement.querySelector('.start-screen-iris');

    // Double rAF ensures the browser has painted before the transition fires,
    // preventing first-frame skips on Chrome, Safari, and Firefox mobile.
    startScreenElement.classList.add('start-screen-closing');

    const target = iris ?? startScreenElement;
    target.addEventListener(
      'transitionend',
      () => resolve(() => startScreenElement.remove()),
      { once: true },
    );
  });
};
