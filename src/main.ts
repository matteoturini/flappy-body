import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'


document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
  <video class="input_video"></video>
  <canvas class="output_canvas" width="1280px" height="720px"></canvas>
  <div class="landmark-grid-container"></div>
`

const videoElement: HTMLVideoElement = document.querySelector('video')!;
const canvasElement: HTMLCanvasElement = document.querySelector('canvas.output_canvas')!;
const canvasCtx = canvasElement.getContext('2d')!;

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

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: '#00FF00', lineWidth: 4 });
  drawLandmarks(canvasCtx, results.poseLandmarks,
    { color: '#FF0000', lineWidth: 2 });
  canvasCtx.restore();

}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
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
    width: 960,
    height: 540
  });
  camera.start();
}, 300);