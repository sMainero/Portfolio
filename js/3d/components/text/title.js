import { Text } from './Text.js';

export const createTitleText = () => {
  const text = new Text({
    text: `Sebastian's Portfolio`,
    size: 0.15,
    color: 0xffffff,
    position: { x: 0, y: 1.4, z: 0.1 },
    // mediaQuery: '(min-width: 600px)',
  });
  return text;
};
