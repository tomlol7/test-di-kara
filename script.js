const preview = document.getElementById('preview');
const resultsBody = document.querySelector('#results tbody');

// References (average face images)
const references = [
  { label: "Castizo", file: "castizo.jpg" },
  { label: "Mestizo", file: "mestizo.jpg" }
];
let referenceDescriptors = [];

// Load face-api.js models
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models')
]).then(loadReferences);

async function loadReferences() {
  for (let ref of references) {
    const img = await faceapi.fetchImage('./reference/' + ref.file);
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (detection) {
      referenceDescriptors.push({
        label: ref.label,
        descriptor: detection.descriptor
      });
    }
  }
  console.log("Reference faces loaded");
}

// Handle upload
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  preview.src = URL.createObjectURL(file);
  preview.onload = async () => {
    const detection = await faceapi.detectSingleFace(preview).withFaceLandmarks().withFaceDescriptor();
    if (!detection) {
      alert("No face detected!");
      return;
    }

    // Closest reference match
    let bestMatch = null;
    let bestDist = 1.0;
    for (let ref of referenceDescriptors) {
      const dist = faceapi.euclideanDistance(detection.descriptor, ref.descriptor);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = ref.label;
      }
    }

    // Trait detection (simple approximations)
    const hairColor = detectHairColor(preview);
    const eyeColor = detectEyeColor(detection);
    const lipFullness = detectLipFullness(detection);

    // Display table
    resultsBody.innerHTML = `
      <tr><td>Closest Match</td><td>${bestMatch} (${(1-bestDist).toFixed(2)})</td></tr>
      <tr><td>Hair Color</td><td>${hairColor}</td></tr>
      <tr><td>Eye Color</td><td>${eyeColor}</td></tr>
      <tr><td>Lip Fullness</td><td>${lipFullness}</td></tr>
    `;
  };
});

// -----------------------
// Simple Trait Detection
// -----------------------
function detectHairColor(img) {
  // Placeholder: sample top part of image
  // Real implementation: crop forehead/hair region and average RGB
  return Math.random() > 0.5 ? "Blond" : "Brown"; 
}

function detectEyeColor(detection) {
  // Placeholder: check eye region
  return Math.random() > 0.5 ? "Blue" : "Brown"; 
}

function detectLipFullness(detection) {
  // Placeholder: use landmarks to measure lip height / width
  return Math.random() > 0.5 ? "Full" : "Medium";
}
