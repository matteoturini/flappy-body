appWidth = 640
appHeight = 360

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let app = new PIXI.Application({ width: appWidth, height: appHeight });
document.body.appendChild(app.view);

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

let pillars = [null, null, null, null, null, null, null, null, null, null]

reset = false

lastPillarCreated = 0
pillarCreationDelay = 3
// Tell our application's ticker to run a new callback every frame, passing
// in the amount of time that has passed since the last tick
app.ticker.add((delta) => {
    elapsed += delta;
    elapsedSecs = elapsed / 50

    //Creates new pillars 
    if (elapsedSecs - lastPillarCreated > pillarCreationDelay){
        createPillars()
        lastPillarCreated = elapsedSecs
    }

    for (i = 0; i < pillars.length; i++){
        if (pillars[i] != null){  
            pillars[i].x -= 1.5 * delta

            if(pillars[i].x < -200){
                pillars[i] = null
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

function keyboard(value) {
    const key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = (event) => {
      if (event.key === key.value) {
        if (key.isUp && key.press) {
          key.press();
        }
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = (event) => {
      if (event.key === key.value) {
        if (key.isDown && key.release) {
          key.release();
        }
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);
    
    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
  }

function createPillars(){
    size = 3
    passageSize = 125  
    middleY = 100 + (Math.random() * (appHeight - 200))
    
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
    
    for (i = 0; i < pillars.length; i++){
        if (pillars[i] == null){
            pillars[i] = newPillarTop
            break;
        }
    }
    for (i = 0; i < pillars.length; i++){
        if (pillars[i] == null){
            pillars[i] = newPillarBottom
            break;
        }
    }   
}
function colliding(a, b){
    //Creates the collision box for a
    a1x = a.x
    a1y = a.y
    a2x = a.x + a.width
    a2y = a.y + a.height

    //Creates the collision box for b
    b1x = b.x
    b1y = b.y
    b2x = b.x + b.width
    b2y = b.y + b.height

    //if (a1x > a2x && a1x < b2x || b1x > )
}