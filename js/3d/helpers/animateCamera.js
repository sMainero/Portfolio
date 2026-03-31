export const animateCamera = ({
  duration,
  toPosition,
  toTarget,
  controls,
  cameraBasePosition,
  cameraTarget,
  beginCameraAnimation,
  finishCameraAnimation,
  getCameraAnimationState,
}) => {
  const animationId = beginCameraAnimation();
  const startPos = cameraBasePosition.clone();
  const startTarget = cameraTarget.clone();
  const startTime = performance.now();
  const easeInOut = (t) => t * t * (3 - 2 * t);

  const step = (now) => {
    if (animationId !== getCameraAnimationState().activeAnimationId) return;

    const tRaw = Math.min((now - startTime) / duration, 1);
    const t = easeInOut(tRaw);

    cameraBasePosition.lerpVectors(startPos, toPosition, t);
    cameraTarget.lerpVectors(startTarget, toTarget, t);
    controls.target.copy(cameraTarget);
    controls.update();

    if (tRaw >= 1) {
      cameraBasePosition.copy(toPosition);
      cameraTarget.copy(toTarget);
      finishCameraAnimation(animationId);
      return;
    }

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};
