import * as PIXI from 'pixi.js';

// App settings
const appWidth = 1240
const appHeight = 360

// Starting settings
const birdStartx = appWidth * 0.25
const birdStarty = appHeight * 0.25
const flapMultiplier = 15

// Pillar settings
const size = 3
const passageSize = 200
const pillarCreationDelay = 6

// Comment this to disable spacebar
const spacebar = keyboard(" ")
spacebar.press = () => {
  momentum = 2
}

// END OF SETTINGS
// Initialization of PIXI
let app = new PIXI.Application({ width: appWidth, height: appHeight });
document.body.appendChild(app.view as HTMLCanvasElement);

// Disable antialiasing for our pixel art
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// Bird creation
let bird = PIXI.Sprite.from("sprites/bird.png");
bird.width = 17 * 3
bird.height = 12 * 3
// Add bird to the stage (scene)
app.stage.addChild(bird);
bird.x = birdStartx
bird.y = birdStarty
bird.zIndex = Number.MAX_SAFE_INTEGER - 1 // Makes the bird appear on top of everything, but not the score

// Score text creation
let scoreText = new PIXI.Text("0")
// White text
scoreText.style = new PIXI.TextStyle({ fill: 0xFFFFFF })
// Add score text to the stage
app.stage.addChild(scoreText)
scoreText.x = appWidth - 50
scoreText.y = 0
scoreText.zIndex = Number.MAX_SAFE_INTEGER // Makes the score appear on top of everything
let score = 0

// Bird logic
// Last index of the flap performed
// Important because flaps are counted incrementally
let lastFlap = 0
// Bird speed/momentum
let momentum = 0.0;
// First flap is boosted to make for easier gameplay
let boost = false

// Elapsed time since the start of the game
// In milliseconds
let elapsed = 0.0;
// Whether the game is reset or not
let reset = true
// Strategy to count the pillars based on zIndex value
let curZIndex = 0

// List of pillars
let pillars: PIXI.Sprite[] = []
// List of pillars that have been passed
let passedPillars: number[] = []
// Background
let background: PIXI.Sprite[] = []
// When the last pillar was created
let lastPillarCreated = 0

// MAIN LOOP
app.ticker.add((delta) => {
  // Δt in 2ms (#!%$ &!@ *@!#?!?!?!?!?)
  elapsed += delta;
  let elapsedSecs = elapsed / 50

  // Reset game state
  if (reset) {
    // Reset variables
    bird.x, bird.y = birdStartx, birdStarty
    bird.rotation = 0
    elapsed = 0
    window.playerFlaps = 0
    boost = true
    lastPillarCreated = 0
    reset = false

    // Deletes pillars
    for (const pillar of pillars) {
      pillar.destroy()
    }
    pillars = []
  }
  // Checks if the player has flapped to start the game
  else if (window.playerFlaps > 0) {

    // Creates new pillars 
    if (elapsedSecs - lastPillarCreated > pillarCreationDelay) {
      createPillars()
      lastPillarCreated = elapsedSecs
    }
    // Moves pillars and destroys them if too far
    for (let i = 0; i < pillars.length; i++) {
      pillars[i].x -= 1.5 * delta
      if (pillars[i].x < -200) {
        pillars[i].destroy()
        pillars.splice(i, 1)
      }
    }

    // Applies flaps
    if (window.playerFlaps > lastFlap) {
      momentum = (window.playerFlapSpeed) * flapMultiplier
      lastFlap = window.playerFlaps
    }
    // Moves bird and rotates it
    momentum -= 0.05 * delta;
    bird.y -= momentum;
    bird.rotation = -(momentum / 5)
    // Kills bird if goes too far down
    if (bird.y > appHeight && !reset) {
      reset = true
    }

    // Limit height, and stop momentum when hitting the ceiling
    if (bird.y < -1) {
      bird.y = -1
      momentum = 0
    }

    // Check collision
    for (const pillar of pillars) {
      if ((bird.x + bird.width > pillar.x && bird.x < pillar.x + pillar.width) && !reset && bird.y < -30) {
        reset = true
      }
    }

    // Kills bird when touching pillars
    for (const pillar of pillars) {
      if (colliding(bird, pillar)) {
        reset = true
      }
    }

    // Deletes background tiles
    for (let i = 0; i < background.length; i++) {
      background[i].x -= 0.5 * delta
      if (background[i].x < -400) {
        background[i].destroy()
        background.splice(i, 1)
      }
    }
    // Creates first background tile
    if (background.length == 0) {
      let tile = PIXI.Sprite.from("Background/Background1.png")
      tile.width = tile.width * 1.41
      tile.height = tile.height * 1.41
      tile.x = - tile.width
      app.stage.addChild(tile)
      background.push(tile)
    }
    // Deletes background out of range
    if (background[background.length - 1].x < appWidth + 100) {
      let tile = PIXI.Sprite.from("Background/Background1.png")
      tile.width = tile.width * 1.41
      tile.height = tile.height * 1.41
      tile.x = background[background.length - 1].x + tile.width
      app.stage.addChild(tile)
      background.push(tile)
    }
    // Applies score
    for (let i = 0; i < pillars.length; i++) {
      if (bird.x > (pillars[i].x + pillars[i].width) && !(passedPillars.includes(pillars[i].zIndex))) {
        passedPillars.push(pillars[i].zIndex)
        score += 5 // Beautiful way of knowing if the pillar is passed BTW
      }
    }
    // End of loop
    scoreText.text = score
    app.stage.sortChildren()
  }
  else {
    momentum = 0 // Pauses the game
  }
  // Boosts first flap
  if (boost && window.playerFlaps > 0) {
    boost = false
    momentum = flapMultiplier / 3
    window.playerFlaps = 1
    lastFlap = 1
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
// Technically a class, but I got lazy
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
  // Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);

  return key;
}

function createPillars() {
  const middleY = 100 + (Math.random() * (appHeight - 200))

  // Top pillar creation
  let newPillarTop = PIXI.Sprite.from("sprites/pillar.png")
  newPillarTop.width = 32 * size
  newPillarTop.height = 78 * size
  newPillarTop.x = appWidth + 200;
  newPillarTop.y = middleY - (78 * size) - passageSize / 2;
  newPillarTop.zIndex = curZIndex // This is for the pillar passing logic

  // Bottom pillar creation
  let newPillarBottom = PIXI.Sprite.from("sprites/pillar.png")
  newPillarBottom.width = 32 * size
  newPillarBottom.height = 78 * size
  newPillarBottom.x = appWidth + 200;
  newPillarBottom.y = middleY + passageSize / 2;
  newPillarBottom.zIndex = curZIndex + 1

  //Adding all sprites
  app.stage.addChild(newPillarTop)
  app.stage.addChild(newPillarBottom);
  pillars.push(newPillarTop)
  pillars.push(newPillarBottom)

  curZIndex += 2
}
function colliding(a: PIXI.Sprite, b: PIXI.Sprite) {
  // Standard AABB algorithm
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
}