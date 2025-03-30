let scene, camera, renderer, controls, transformControls, mesh;
let cutLines = [];
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
    addBuildPlate();
  };
  reader.readAsArrayBuffer(file);
}

function resetViewer() {
  const container = document.getElementById("viewer");
  container.innerHTML = "";
  container.style.height = '500px';

  const width = container.clientWidth;
  const height = container.clientHeight || 300;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.innerHTML = "⛶";
  fullscreenBtn.style = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid #555;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
    z-index: 10;
  `;
  fullscreenBtn.onclick = toggleFullscreen;
  container.appendChild(fullscreenBtn);

  const resetCamBtn = document.createElement("button");
  resetCamBtn.innerHTML = "Reset View";
  resetCamBtn.style = `
    position: absolute;
    top: 60px;
    right: 10px;
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid #555;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
    z-index: 10;
  `;
  resetCamBtn.onclick = () => centerCameraOnModel();
  container.appendChild(resetCamBtn);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 2);
  scene.add(light);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls?.update();
  renderer.render(scene, camera);
}

function toggleFullscreen() {
  const viewer = document.getElementById("viewer");
  if (!document.fullscreenElement) {
    viewer.requestFullscreen().then(() => {
      viewer.style.height = '100vh';
      resizeViewer();
      centerCameraOnModel();
    }).catch(err => alert(`Fullscreen error: ${err.message}`));
  } else {
    document.exitFullscreen().then(() => {
      viewer.style.height = '500px';
      resizeViewer();
      centerCameraOnModel();
    });
  }
}

function resizeViewer() {
  const container = document.getElementById("viewer");
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function centerCameraOnModel() {
  if (!mesh) return;
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Side view
  camera.position.copy(center.clone().add(new THREE.Vector3(size.length() * 1.5, 0, size.y)));
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}

function autoOrientToFlattestFace(mesh) {
  const geometry = mesh.geometry;
  const pos = geometry.attributes.position;
  const index = geometry.index;

  if (!pos || !index) return;

  const vertices = [];
  for (let i = 0; i < pos.count; i++) {
    vertices.push(new THREE.Vector3().fromBufferAttribute(pos, i));
  }

  let maxArea = 0;
  let bestNormal = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);

    const triangle = new THREE.Triangle(vertices[a], vertices[b], vertices[c]);
    const area = triangle.getArea();
    const normal = triangle.getNormal(new THREE.Vector3());

    if (area > maxArea) {
      maxArea = area;
      bestNormal = normal;
    }
  }

  const up = new THREE.Vector3(0, 0, 1);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(bestNormal, up);
  mesh.applyQuaternion(quaternion);

  geometry.computeBoundingBox();
  const minZ = geometry.boundingBox.min.z;
  mesh.position.z = -minZ; // Sit flush on build plate
}

function addTransformControls() {
  transformControls = new THREE.TransformControls(camera, renderer.domElement);
  transformControls.attach(mesh);
  transformControls.setMode("rotate");
  transformControls.size = 2.5;

  transformControls.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  // Prevent mesh from going below build plate
  transformControls.addEventListener("objectChange", () => {
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.min.z < 0) {
      mesh.position.z -= box.min.z;
    }
  });

  scene.add(transformControls);
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
    const zUp = new THREE.Vector3(0, 0, 1);
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    if (Math.abs(camDir.angleTo(zUp)) > 0.3) {
      camera.up.set(0, 0, 1);
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
      alert("View reset to top-down for Z-aligned cuts.");
      return;
    }

    createCutLine();
  };
  container.appendChild(cutBtn);
}

function createCutLine() {
  const geometry = new THREE.PlaneGeometry(220, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
  const line = new THREE.Mesh(geometry, material);
  line.position.set(0, 0, 10 + cutLines.length * 5);
  line.rotation.x = Math.PI / 2;
  scene.add(line);
  cutLines.push(line);

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

function addBuildPlate() {
  const plateGeo = new THREE.PlaneGeometry(220, 220);
  const plateMat = new THREE.MeshBasicMaterial({
    color: 0x222222,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0;
  plate.position.z = 0;
  scene.add(plate);

  const grid = new THREE.GridHelper(220, 20, 0xffffff, 0xaaaaaa);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = 0.01;
  scene.add(grid);

  const heightBox = new THREE.BoxHelper(
    new THREE.Mesh(new THREE.BoxGeometry(220, 220, 250)),
    0x444444
  );
  scene.add(heightBox);
}

window.addEventListener('resize', resizeViewer);
