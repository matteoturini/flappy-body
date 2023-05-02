import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
import { NormalizedLandmark, Pose, POSE_CONNECTIONS, POSE_LANDMARKS, Results } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import './index.css'

console.log("%cAppuyez sur Espace pour activer le mode debug.", "background: #222; color: #bada55; font-size: 20px;");

declare global {
  interface Window {
    playerFlaps: number;
    playerFlapSpeed: number;
  }
}

window.playerFlapSpeed = 0;
window.playerFlaps = 0;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
  <video class="input_video" style="display: none;"></video>
  <canvas style="display: none;" class="output_canvas" width="1280px" height="720px"></canvas>
`

const videoElement: HTMLVideoElement = document.querySelector('video')!;
const canvasElement: HTMLCanvasElement = document.querySelector('canvas.output_canvas')!;
const canvasCtx = canvasElement.getContext('2d')!;

let wentDown = 0;
let wentUp = 0;

let opened_distance = .55;
let closed_distance = .45;

let lastDistLeft = 0;
let lastDistRight = 0;

let nframes = 0;
let fps = 0;

function distance3d(p1: NormalizedLandmark, p2: NormalizedLandmark) {
  // Distance between two 3d points
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

function onResults(results: Results) {
  if (!results.poseLandmarks) {
    return;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = 'source-in';
  canvasCtx.fillStyle = '#00FF00';
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.false
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: '#00FF00', lineWidth: 4 });
  drawLandmarks(canvasCtx, results.poseLandmarks,
    { color: '#FF0000', lineWidth: 2 });
  canvasCtx.restore();

  const rl = results.poseWorldLandmarks;
  const cl = results.poseLandmarks;
  const l = POSE_LANDMARKS;

  let dist_left = distance3d(rl[l.LEFT_ELBOW], rl[l.LEFT_HIP]);
  let dist_right = distance3d(rl[l.RIGHT_ELBOW], rl[l.RIGHT_HIP]);



  // Draw
  canvasCtx.font = "30px Arial";
  canvasCtx.fillStyle = "red";
  canvasCtx.fillText("Left: " + dist_left.toFixed(2), 10, 50);
  canvasCtx.fillText("Right: " + dist_right.toFixed(2), 10, 100);
  canvasCtx.fillText("Flap: " + window.playerFlaps, 10, 150);
  canvasCtx.fillText("Flap Speed: " + window.playerFlapSpeed.toFixed(2), 10, 200);
  canvasCtx.fillText("FPS: " + fps.toFixed(2), 10, 250);

  if (dist_left > opened_distance && dist_right > opened_distance) {
    wentUp = Date.now();
  } else if (dist_left < closed_distance && dist_right < closed_distance && wentUp != 0) {
    wentDown = Date.now();
  }

  if (wentUp && wentDown) {
    window.playerFlaps++;
    wentUp = 0;
    wentDown = 0;
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
  // console.log({
  //   dist_left,
  //   dist_right,
  //   lastDistLeft,
  //   lastDistRight,
  //   windowPlayerFlapSpeed: window.playerFlapSpeed,
  //   diffLeft: Math.abs(dist_left - lastDistLeft),
  //   diffRight: Math.abs(dist_right - lastDistRight),
  //   diff: Math.abs(dist_left - lastDistLeft) + Math.abs(dist_right - lastDistRight),
  // })
  // console.log("Flap speed: " + window.playerFlapSpeed.toFixed(2));

  lastDistLeft = dist_left;
  lastDistRight = dist_right;

  nframes++;
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;	
  },
  
});
pose.setOptions({
  modelComplexity: 0,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

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

window.addEventListener('keydown', (e) => {
  if (e.key == ' ') {
    canvasElement.style.display = '';
  }
});

setInterval(() => {
  fps = nframes * 2;
  nframes = 0;
}, 500);