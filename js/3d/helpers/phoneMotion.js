export const createPhoneMotion = ({ domElement }) => {
  const motion = { x: 0, y: 0, z: 0 };
  let isEnabled = false;

  const phoneMotionHandler = (event) => {
    const acceleration = event.accelerationIncludingGravity;
    motion.x = acceleration?.x ?? 0;
    motion.y = acceleration?.y ?? 0;
    motion.z = acceleration?.z ?? 0;
  };

  const enablePhoneMotion = async () => {
    if (isEnabled) return;

    // iOS Safari 13+ requires explicit permission from a user gesture.
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') return;
    }

    window.addEventListener('devicemotion', phoneMotionHandler);
    isEnabled = true;
  };

  const disablePhoneMotion = () => {
    if (isEnabled) {
      window.removeEventListener('devicemotion', phoneMotionHandler);
      isEnabled = false;
    }
    motion.x = 0;
    motion.y = 0;
    motion.z = 0;
  };

  return {
    motion,
    isMotionEnabled: () => isEnabled,
    enablePhoneMotion,
    disablePhoneMotion,
  };
};
