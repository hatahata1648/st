const cameraStream = document.getElementById('camera-stream');
const captureBtn = document.getElementById('capture-btn');
const resultContainer = document.getElementById('result-container');
const resultImg = document.getElementById('result-img');
const downloadLink = document.getElementById('download-link');

let mediaStream;

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    mediaStream = stream;
    cameraStream.srcObject = stream;
  })
  .catch(error => {
    console.error('カメラにアクセスできません', error);
  });

captureBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = cameraStream.width;
  canvas.height = cameraStream.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraStream, 0, 0);
  const imageData = canvas.toDataURL('image/png');
  convertToIllustration(imageData);
});

function setDownloadLink(imageData) {
  resultImg.src = imageData;
  downloadLink.href = imageData;
  resultContainer.style.display = 'block';
}

const apiHost = 'https://api.stability.ai';
const engineId = 'stable-diffusion-v1-6';
const apiKey = 'sk-cv6c536ROWDwzztOWSR3uByhh0r18whaSQSfaPIR9hY7AUT3';

function convertToIllustration(imageData) {
  const formData = new FormData();
  formData.append('init_image', dataURItoBlob(imageData), 'image.png');
  formData.append('init_image_mode', 'IMAGE_STRENGTH');
  formData.append('image_strength', 0.35);
  formData.append('text_prompts[0][text]', 'Galactic dog wearing a cape');
  formData.append('cfg_scale', 7);
  formData.append('samples', 1);
  formData.append('steps', 30);

  fetch(`${apiHost}/v1/generation/${engineId}/image-to-image`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(`${error.name}: ${error.message} (${error.id})`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.artifacts && data.artifacts.length > 0) {
        const imageData = `data:image/png;base64,${data.artifacts[0].base64}`;
        setDownloadLink(imageData);
      } else {
        throw new Error('レスポンスデータに画像が含まれていません');
      }
    })
    .catch(error => {
      console.error('イラスト変換に失敗しました', error);
    });
}

function dataURItoBlob(dataURI) {
  const binary = atob(dataURI.split(',')[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: 'image/png' });
}
