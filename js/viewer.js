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

function addCutControls() {
  const container = document.getElementById("viewer");
  const cutBtn = document.createElement("button");
  cutBtn.innerText = "Add Cut";
  cutBtn.style = `
    position: absolute;
    top: 110px;
    right: 10px;
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid #555;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
    z-index: 10;
  `;
  cutBtn.onclick = () => createCutLine();
  container.appendChild(cutBtn);
}

function createCutLine() {
  const geometry = new THREE.PlaneGeometry(100, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
  const line = new THREE.Mesh(geometry, material);
  line.position.y = 0;
  line.name = `cutLine_${cutLines.length}`;
  cutLines.push(line);
  scene.add(line);

  const dragControl = new THREE.TransformControls(camera, renderer.domElement);
  dragControl.attach(line);
  dragControl.setMode("translate");
  dragControl.showX = false;
  dragControl.showZ = false;
  dragControl.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });
  scene.add(dragControl);
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

  renderer.domElement.addEventListener("click", detectSegmentClick);
}

function detectSegmentClick(event) {
  if (!mesh || cutLines.length === 0) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const percent = 1 - (y / rect.height);

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
