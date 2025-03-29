let scene, camera, renderer, controls, transformControls, mesh;
let cutLines = [];
let selectedSegment = null;
let segmentColors = {};

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

// The rest of your viewer.js (resetViewer, toggleFullscreen, etc.) remains unchanged...
// We'll build the color selector logic in the next step.

window.addEventListener('resize', resizeViewer);
