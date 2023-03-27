import * as PIXI from 'pixi.js';

const appWidth = 640
const appHeight = 360

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let app = new PIXI.Application({ width: appWidth, height: appHeight });
document.body.appendChild(app.view as HTMLCanvasElement);

let bird = PIXI.Sprite.from("sprites/bird.png");
bird.width = 17 * 3
bird.height = 12 * 3

app.stage.addChild(bird);
bird.x = appWidth * 0.25
bird.y = appHeight * 0.25

let elapsed = 0.0;
let momentum = 0.0;

const spacebar = keyboard(" ")
spacebar.press = () => {
  momentum = 1
}

let pillars: PIXI.Sprite[] = []

let reset = false

let lastPillarCreated = 0
let pillarCreationDelay = 3
// Tell our application's ticker to run a new callback every frame, passing
// in the amount of time that has passed since the last tick
app.ticker.add((delta) => {
  elapsed += delta;
  let elapsedSecs = elapsed / 50

  //Creates new pillars 
  if (elapsedSecs - lastPillarCreated > pillarCreationDelay) {
    createPillars()
    lastPillarCreated = elapsedSecs
  }

  for (let i = 0; i < pillars.length; i++) {
    if (pillars[i] != null) {
      pillars[i].x -= 1.5 * delta

      if (pillars[i].x < -200) {
        pillars[i].destroy()
        pillars.splice(i, 1)
      }
    }
  }
  momentum -= 0.05 * delta;
  bird.y -= momentum;
  bird.rotation = -(momentum / 5)

  //Checks borders
  if (bird.y < -30 && !reset || bird.y > appHeight && !reset) {
    window.location.reload();
    reset = true
  }

});

interface Key {
  value: string;
  isDown: boolean;
  isUp: boolean;
  press?: () => void;
  release?: () => void;
  downHandler: (event: KeyboardEvent) => void;
  upHandler: (event: KeyboardEvent) => void;
  unsubscribe: () => void;
}

function keyboard(value: string): Key {
  const key: Key = {
    value,
    isDown: false,
    isUp: true,
    press: undefined,
    release: undefined,
    downHandler: (event) => {
      if (event.key === key.value) {
        if (key.isUp && key.press) {
          key.press();
        }
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    },
    upHandler: (event) => {
      if (event.key === key.value) {
        if (key.isDown && key.release) {
          key.release();
        }
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    },
    unsubscribe: () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    }
  };
  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);

  return key;
}

function createPillars() {
  let size = 3
  let passageSize = 125
  let middleY = 100 + (Math.random() * (appHeight - 200))

  //Top pillar creation
  let newPillarTop = PIXI.Sprite.from("sprites/pillar.png")
  newPillarTop.width = 32 * size
  newPillarTop.height = 78 * size
  newPillarTop.x = appWidth + 200;
  newPillarTop.y = middleY - (78 * size) - passageSize / 2;

  //Bottom pillar creation
  let newPillarBottom = PIXI.Sprite.from("sprites/pillar.png")
  newPillarBottom.width = 32 * size
  newPillarBottom.height = 78 * size
  newPillarBottom.x = appWidth + 200;
  newPillarBottom.y = middleY + passageSize / 2;

  //Adding all sprites
  app.stage.addChild(newPillarTop)
  app.stage.addChild(newPillarBottom);

  for (let i = 0; i < pillars.length; i++) {
    if (pillars[i] == null) {
      pillars[i] = newPillarTop
      break;
    }
  }
  for (let i = 0; i < pillars.length; i++) {
    if (pillars[i] == null) {
      pillars[i] = newPillarBottom
      break;
    }
  }
}
function colliding(a: PIXI.Sprite, b: PIXI.Sprite) {
  //Creates the collision box for a
  let a1x = a.x
  let a1y = a.y
  let a2x = a.x + a.width
  let a2y = a.y + a.height

  //Creates the collision box for b
  let b1x = b.x
  let b1y = b.y
  let b2x = b.x + b.width
  let b2y = b.y + b.height

}