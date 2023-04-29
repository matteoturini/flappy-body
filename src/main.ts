import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
import { NormalizedLandmark, Pose, POSE_CONNECTIONS, POSE_LANDMARKS, Results } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'

declare global {
  interface Window { playerFlaps: number; }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
  <video class="input_video"></video>
  <canvas class="output_canvas" width="1280px" height="720px"></canvas>
  <div class="landmark-grid-container"></div>
`

const videoElement: HTMLVideoElement = document.querySelector('video')!;
const canvasElement: HTMLCanvasElement = document.querySelector('canvas.output_canvas')!;
const canvasCtx = canvasElement.getContext('2d')!;

let wentDown = false;
let wentUp = false;

let opened_distance = .6;
let closed_distance = .4;


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
  const l = POSE_LANDMARKS;

  let dist_left = distance3d(rl[l.LEFT_ELBOW], rl[l.LEFT_HIP]);
  let dist_right = distance3d(rl[l.RIGHT_ELBOW], rl[l.RIGHT_HIP]);

  // Draw
  canvasCtx.font = "30px Arial";
  canvasCtx.fillStyle = "red";
  canvasCtx.fillText("Left: " + dist_left.toFixed(2), 10, 50);
  canvasCtx.fillText("Right: " + dist_right.toFixed(2), 10, 100);
  canvasCtx.fillText("Flap: " + window.playerFlaps, 10, 150);

  if (dist_left > opened_distance && dist_right > opened_distance) {
    wentUp = true;
  } else if (dist_left < closed_distance && dist_right < closed_distance && wentUp) {
    wentDown = true;
  }

  if (wentUp && wentDown) {
    window.playerFlaps++;
    wentUp = false;
    wentDown = false;
  }
}

const pose = new Pose({
  locateFile: (file) => {
    return `/mediapipe/${file}`;
  }
});
pose.setOptions({
  modelComplexity: 1,
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