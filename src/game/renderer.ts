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

// Starting settings
let birdStartx = appWidth * 0.25
let birdStarty = appHeight * 0.25
const flapMultiplier = 6

bird.x = birdStartx
bird.y = birdStarty

let elapsed = 0.0;
let momentum = 0.0;
let reset = false
let lastFlap = 0

const spacebar = keyboard(" ")
spacebar.press = () => {
  momentum = 1.25
}

let pillars: PIXI.Sprite[] = []

let lastPillarCreated = 0
let pillarCreationDelay = 3
// Tell our application's ticker to run a new callback every frame, passing
// in the amount of time that has passed since the last tick
app.ticker.add((delta) => {
  elapsed += delta;
  let elapsedSecs = elapsed / 50

  if (reset){
    bird.x, bird.y = birdStartx, appHeight * 0.25
    bird.rotation = 0
    elapsed = 0
    for (const pillar of pillars){
      pillar.destroy()
    }
    pillars = []
    lastPillarCreated = 0
    reset = false
  }
  else if (elapsedSecs > 2){  // Creates new pillars 
    if (elapsedSecs - lastPillarCreated > pillarCreationDelay) {
      createPillars()
      lastPillarCreated = elapsedSecs
    }
    
    // Moves pillars
    for (let i = 0; i < pillars.length; i++) {
      pillars[i].x -= 1.5 * delta
      if (pillars[i].x < -200) {
        pillars[i].destroy()
        pillars.splice(i, 1)
      }
    }

    // Applies flaps
    if (window.playerFlaps > lastFlap){
      momentum = (1 / window.playerFlapSpeed) * flapMultiplier
      lastFlap = window.playerFlaps
    }
    
    // Moves bird
    momentum -= 0.05 * delta;
    bird.y -= momentum;
    bird.rotation = -(momentum / 5)
  
    // Kills bird if outside borders
    if (bird.y < -30 && !reset) {
      reset = true
    }
    // Kills bird when touching pillars
    for (let i = 0; i < pillars.length; i++){
      if (colliding(bird, pillars[i])){
        reset = true
      }
    }
  }
  else{
    momentum = 0
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

  console.log("Pillars created")

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

  pillars.push(newPillarTop)
  pillars.push(newPillarBottom)
}
function colliding(a: PIXI.Sprite, b: PIXI.Sprite) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
}