let scene, camera, renderer, controls, transformControls, mesh;
let cutLines = [];
let selectedSegment = null;
let segmentColors = {};
let colorPicker;

function loadSTL(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;

    const loader = new THREE.STLLoader();
    const geometry = loader.parse(contents);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();

    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const material = new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true });
    mesh = new THREE.Mesh(geometry, material);

    resetViewer();
    scene.add(mesh);
    autoOrientToFlattestFace(mesh);
    addTransformControls();
    centerCameraOnModel();
    addCutControls();
    setupColorPicker();
  };
  reader.readAsArrayBuffer(file);
}

function setupColorPicker() {
  colorPicker = document.createElement("select");
  colorPicker.id = "colorPicker";
  colorPicker.style = `
    position: absolute;
    top: 160px;
    right: 10px;
    z-index: 10;
    display: none;
  `;
  ["Blue", "Green", "Rainbow", "White", "Black", "Red"].forEach(color => {
    const option = document.createElement("option");
    option.value = color.toLowerCase();
    option.textContent = color;
    colorPicker.appendChild(option);
  });
  colorPicker.onchange = () => {
    if (selectedSegment !== null) {
      segmentColors[selectedSegment] = colorPicker.value;
      alert(`Color for Segment ${selectedSegment} set to ${colorPicker.value}`);
      colorPicker.style.display = "none";
    }
  };
  document.getElementById("viewer").appendChild(colorPicker);

  // Segment click detection
  renderer.domElement.addEventListener("click", detectSegmentClick);
}

function detectSegmentClick(event) {
  if (!mesh || cutLines.length === 0) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const percent = 1 - (y / rect.height); // top to bottom

  const bounds = [0, ...cutLines.map(line => (line.position.y)), 1].sort((a, b) => b - a);

  for (let i = 0; i < bounds.length - 1; i++) {
    const top = bounds[i];
    const bottom = bounds[i + 1];

    if (percent <= top && percent >= bottom) {
      selectedSegment = i;
      colorPicker.style.display = "block";
      colorPicker.style.top = `${event.clientY - rect.top}px`;
      colorPicker.style.left = `${event.clientX - rect.left}px`;
      break;
    }
  }
}

// All previous functions remain the same (resetViewer, animate, fullscreen, cut creation, etc)...
