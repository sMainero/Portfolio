export const createCursorMovement = ({ domElement }) => {
  const cursor = { x: 0, y: 0 };
  let isEnabled = false;

  const mouseMoveHandler = (event) => {
    const rect = domElement.getBoundingClientRect();
    cursor.x = (event.clientX - rect.left) / rect.width - 0.5;
    cursor.y = (event.clientY - rect.top) / rect.height - 0.5;
  };

  const enableMovement = () => {
    if (isEnabled) return;
    domElement.addEventListener('mousemove', mouseMoveHandler);
    isEnabled = true;
  };

  const disableMovement = () => {
    if (isEnabled) {
      domElement.removeEventListener('mousemove', mouseMoveHandler);
      isEnabled = false;
    }
    cursor.x = 0;
    cursor.y = 0;
  };

  enableMovement();

  return {
    cursor,
    enableMovement,
    disableMovement,
  };
};
