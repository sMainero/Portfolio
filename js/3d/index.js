import { World } from './components/GameWorld.js';
import { GameBoy } from './components/gameboy/GameBoy.js';
import { Button } from './components/Button.js';

import { CAMERA_BUTTON_STATE_GAME, cameraButtonState } from './helpers/cameraButtonState.js';
import { switchToGame } from './helpers/switchToGame.js';
import { switchToReset } from './helpers/switchToReset.js';
import { createInstructionsControls } from './components/text/instructionsControls.js';
import { createModelCredits } from './components/text/gameboyCredits.js';
import { ControlsTutorial } from './components/tutorial/ControlsTutorial.js';

export const start3DGame = ({ renderCanvas, game }) => {
  window.switchCameraMode = () => {
    if (cameraButtonState.cameraMode === CAMERA_BUTTON_STATE_GAME) switchToReset();
    else switchToGame();
  };
  renderScreen({ renderCanvas, game });
};

const renderScreen = ({ renderCanvas, game }) => {
  const world = new World();

  world.add(new GameBoy(world, game));
  // world.add(createInstructionsText());
  world.add(new ControlsTutorial());
  world.add(createInstructionsControls());
  world.add(createModelCredits());
  // cameraButtonState.button = new Button(world, game, {
  //   labelType: 'icon',
  //   iconPath: 'assets/icons/camera.svg',
  //   floatingText: 'Game Camera',
  //   position: { x: 0.4, y: 1.5, z: 0.1 },
  //   onClick: () => window.switchCameraMode?.(),
  // });
  // world.add(cameraButtonState.button);

  world.add(
    new Button(world, game, {
      labelType: 'icon',
      iconPath: 'assets/icons/trophy.png',
      floatingText: 'My Projects',
      position: { x: -0.4, y: 1.5, z: 0.1 },
      portalTransition: { mapKey: 'experiences', targetX: 2, targetY: 6 },
    }),
  );

  world.startLoop(renderCanvas);
  // window.enterGameMode3D = () => world.enterGameMode();
  // window.exitGameMode3D = () => world.exitGameMode();
};
