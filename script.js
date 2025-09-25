const preview = document.getElementById('preview');
const resultsBody = document.querySelector('#results tbody');
const debugBox = document.getElementById('debug');

function logDebug(msg) {
  console.log(msg);
  debugBox.innerHTML += msg + "<br>";
}

// References
const references = [
  { label: "Bantuid", file: "bantuidm.jpg" },
  { label: "Mediterranid", file: "mediterranidm.jpg" },
  { label: "Nordid", file: "nordidm.jpg" },
  { label: "South Mongolid", file: "southmongolidm.jpg" }
];
let referenceDescriptors = [];

// Load models
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models')
]).then(loadReferences).catch(err => logDebug("❌ Error loading models: " + err));

async function loadReferences() {
  for (let ref of references) {
    try {
      const img = await faceapi.fetchImage('./reference/' + ref.file);
      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        referenceDescriptors.push({ label: ref.label, descriptor: detection.descriptor });
        logDebug("✅ Loaded reference: " + ref.label);
      } else {
        logDebug("⚠️ No face detected in reference: " + ref.file);
      }
    } catch(e) {
      logDebug("❌ Error loading reference: " + ref.file + " | " + e);
    }
  }
  logDebug("✅ All reference faces loaded");
}

// Upload handling
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  preview.src = URL.createObjectURL(file);
  preview.onload = async () => {
    const detection = await faceapi.detectSingleFace(preview).withFaceLandmarks().withFaceDescriptor();
    if (!detection) {
      alert("No face detected!");
      logDebug("⚠️ No face detected in uploaded image");
      return;
    }

    // Find closest reference
    let bestMatch = null;
    let bestDist = 1.0;
    for (let ref of referenceDescriptors) {
      const dist = faceapi.euclideanDistance(detection.descriptor, ref.descriptor);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = ref.label;
      }
    }

    // Placeholder traits
    const hairColor = detectHairColor(preview);
    const eyeColor = detectEyeColor(detection);
    const lipFullness = detectLipFullness(detection);

    // Show results
    resultsBody.innerHTML = `
      <tr><td>Closest Match</td><td>${bestMatch} (${(1-bestDist).toFixed(2)})</td></tr>
      <tr><td>Hair Color</td><td>${hairColor}</td></tr>
      <tr><td>Eye Color</td><td>${eyeColor}</td></tr>
      <tr><td>Lip Fullness</td><td>${lipFullness}</td></tr>
    `;
    logDebug("✅ Uploaded face analyzed: Closest match = " + bestMatch);
  };
});

// Placeholder trait functions
function detectHairColor(img) { return Math.random() > 0.5 ? "Blond" : "Brown"; }
function detectEyeColor(detection) { return Math.random() > 0.5 ? "Blue" : "Brown"; }
function detectLipFullness(detection) { return Math.random() > 0.5 ? "Full" : "Medium"; }
