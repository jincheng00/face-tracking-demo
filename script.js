const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const flipButton = document.getElementById('flipButton');

let currentStream;
let useFrontCamera = true;

// 请求访问摄像头
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: useFrontCamera ? "user" : "environment"
    }
  };

  currentStream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = currentStream;
}

// 点击翻转按钮切换摄像头
flipButton.addEventListener('click', () => {
  useFrontCamera = !useFrontCamera;
  startCamera();
});

// 加载人脸检测模型
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/face-tracking-demo/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/face-tracking-demo/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/face-tracking-demo/models'),
]).then(() => {
  startCamera();
  video.addEventListener('play', () => {
    setInterval(detectFaces, 100);
  });
});

function detectFaces() {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .then(detections => {
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      context.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制绿色方框
      resizedDetections.forEach(detection => {
        const box = detection.detection.box;
        context.beginPath();
        context.lineWidth = "3";
        context.strokeStyle = "green";
        context.rect(box.x, box.y, box.width, box.height);
        context.stroke();
      });

      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    });
}
