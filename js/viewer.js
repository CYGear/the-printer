let scene, camera, renderer, controls, transformControls, mesh;
let cutLines = [];
let selectedSegment = null;
let segmentColors = {};
let colorPicker;
let buildPlateSize = { x: 220, y: 220, z: 270 };

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
    addBuildPlate();
  };
  reader.readAsArrayBuffer(file);
}

function addBuildPlate() {
  const plateGeometry = new THREE.BoxGeometry(buildPlateSize.x, buildPlateSize.y, 1);
  const plateMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.4 });
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.position.set(0, 0, 0);
  scene.add(plate);
}

function isCameraZAligned() {
  const up = new THREE.Vector3(0, 0, 1);
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const angle = camDir.angleTo(up);
  return angle < 0.3 || angle > Math.PI - 0.3; // about 17 degrees
}

function alignCameraToZTop() {
  const target = controls.target;
  const offset = 300;
  camera.position.set(target.x, target.y, target.z + offset);
  camera.lookAt(target);
  controls.update();
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
  cutBtn.onclick = () => {
    if (!isCameraZAligned()) {
      alert("Please use a top-down view to add Z-axis cuts. We'll fix it for you now.");
      alignCameraToZTop();
      return;
    }
    createCutLine();
  };
  container.appendChild(cutBtn);
}

function createCutLine() {
  const geometry = new THREE.PlaneGeometry(buildPlateSize.x * 1.2, buildPlateSize.y * 1.2);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
  const line = new THREE.Mesh(geometry, material);
  line.rotation.x = Math.PI / 2;
  line.position.z = 0;
  line.name = `cutLine_${cutLines.length}`;
  cutLines.push(line);
  scene.add(line);

  const dragControl = new THREE.TransformControls(camera, renderer.domElement);
  dragControl.attach(line);
  dragControl.setMode("translate");
  dragControl.showX = false;
  dragControl.showY = false;
  dragControl.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });
  scene.add(dragControl);
}

// The rest of viewer.js (setupColorPicker, detectSegmentClick, resetViewer, etc.) stays unchanged
