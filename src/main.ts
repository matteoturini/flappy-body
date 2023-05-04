import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
import { NormalizedLandmark, Pose, POSE_CONNECTIONS, POSE_LANDMARKS, Results } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import './index.css'

console.log("%cAppuyez sur Espace pour activer le mode debug.", "background: #222; color: #bada55; font-size: 20px;");

// Add typings to window
declare global {
  interface Window {
    playerFlaps: number;
    playerFlapSpeed: number;
  }
}

// Initialize global variables
window.playerFlapSpeed = 0;
window.playerFlaps = 0;

// Initialize camera
document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
  <video class="input_video" style="display: none;"></video>
  <canvas style="display: none;" class="output_canvas" width="1280px" height="720px"></canvas>
`

// Create elements
const videoElement: HTMLVideoElement = document.querySelector('video')!;
const canvasElement: HTMLCanvasElement = document.querySelector('canvas.output_canvas')!;
const canvasCtx = canvasElement.getContext('2d')!;

// Time that player's arm wentDown and wentUp, in milliseconds since UNIX epoch
let wentDown = false;
let wentUp = false;

// Distances of the player's arms from their hips to determine if they are open or closed
let opened_distance = .55;
let closed_distance = .45;

// Player's last arm state
let lastDistLeft = 0;
let lastDistRight = 0;

// Number of frames since last interval, for FPS calculation
let nframes = 0;
// FPS
let fps = 0;

// Distance between two 3d points
function distance3d(p1: NormalizedLandmark, p2: NormalizedLandmark) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

// Callback for mediapipe's model results
function onResults(results: Results) {
  // If player isn't detected, don't do anything
  if (!results.poseLandmarks) {
    return;
  }

  // Push current canvas to the stack
  canvasCtx.save();
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = 'source-in';
  canvasCtx.fillStyle = '#00FF00';
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.false
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Draw connections and landmarks on debug canvas
  canvasCtx.globalCompositeOperation = 'source-over';
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: '#00FF00', lineWidth: 4 });
  drawLandmarks(canvasCtx, results.poseLandmarks,
    { color: '#FF0000', lineWidth: 2 });
  canvasCtx.restore();

  // Abbreviations
  const rl = results.poseWorldLandmarks;
  const cl = results.poseLandmarks;
  const l = POSE_LANDMARKS;

  // Distance between player's elbows and hips
  let dist_left = distance3d(rl[l.LEFT_ELBOW], rl[l.LEFT_HIP]);
  let dist_right = distance3d(rl[l.RIGHT_ELBOW], rl[l.RIGHT_HIP]);

  // Debug information
  canvasCtx.font = "30px Arial";
  canvasCtx.fillStyle = "red";
  canvasCtx.fillText("Left: " + dist_left.toFixed(2), 10, 50);
  canvasCtx.fillText("Right: " + dist_right.toFixed(2), 10, 100);
  canvasCtx.fillText("Flap: " + window.playerFlaps, 10, 150);
  canvasCtx.fillText("Flap Speed: " + window.playerFlapSpeed.toFixed(2), 10, 200);
  canvasCtx.fillText("FPS: " + fps.toFixed(2), 10, 250);

  // Determine if player's arms are open or closed
  if (dist_left > opened_distance && dist_right > opened_distance) {
    wentUp = true
  } else if (dist_left < closed_distance && dist_right < closed_distance && wentUp) {
    wentDown = true;
  }

  // When player's arms go down and then up, increment playerFlaps
  if (wentUp && wentDown) {
    window.playerFlaps++;
    wentUp = false;
    wentDown = false;
  }

  // Draw positions on rl[l.LEFT_ELBOW] and rl[l.RIGHT_ELBOW]
  canvasCtx.fillStyle = "#8888FF";
  canvasCtx.font = "40px Arial";
  canvasCtx.fillText(rl[l.LEFT_ELBOW].x.toFixed(2) + ", " + rl[l.LEFT_ELBOW].y.toFixed(2), cl[l.LEFT_ELBOW].x * canvasElement.width, cl[l.LEFT_ELBOW].y * canvasElement.height);

  canvasCtx.fillStyle = "#8888FF";
  canvasCtx.font = "40px Arial";
  canvasCtx.fillText(rl[l.RIGHT_ELBOW].x.toFixed(2) + ", " + rl[l.RIGHT_ELBOW].y.toFixed(2), cl[l.RIGHT_ELBOW].x * canvasElement.width, cl[l.RIGHT_ELBOW].y * canvasElement.height);

  // Set player flap speed to the difference between the distances current and last frame
  window.playerFlapSpeed = Math.abs(dist_left - lastDistLeft) + Math.abs(dist_right - lastDistRight);

  lastDistLeft = dist_left;
  lastDistRight = dist_right;

  // FPS calculation:
  // Increase calculated frames' count
  nframes++;
}

// Initialize mediapipe's pose model
const pose = new Pose({
  locateFile: (file) => {
    // Can't self host, one of the files goes above Cloudflare's 25MB limit
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;	
  },
});

// Set mediapipe's pose model options
pose.setOptions({
  // Light model complexity
  modelComplexity: 0,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  // Minimum confidence for a person to be detected
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

// Start mediapipe's pose model after 300ms
setTimeout(() => {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 480,
    height: 270
  });
  camera.start();
}, 300);

// Show debug canvas when space is pressed
window.addEventListener('keydown', (e) => {
  if (e.key == ' ') {
    // Unhide canvas
    canvasElement.style.display = '';
  }
});

// FPS calculation
setInterval(() => {
  fps = nframes * 2;
  nframes = 0;
}, 500);