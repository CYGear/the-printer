let scene, camera, renderer, controls, mesh;

function loadSTL(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;

    const loader = new THREE.STLLoader();
    const geometry = loader.parse(contents);
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const material = new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true });
    mesh = new THREE.Mesh(geometry, material);

    autoOrientToFlattestFace(mesh);

    initViewer();
    scene.add(mesh);
  };
  reader.readAsArrayBuffer(file);
}

function initViewer() {
  const container = document.getElementById("viewer");
  container.innerHTML = "";

  const width = container.clientWidth;
  const height = container.clientHeight || 300;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Add persistent fullscreen button
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.id = "fullscreen-btn";
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

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

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
    viewer.requestFullscreen().catch(err => {
      alert(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

function autoOrientToFlattestFace(mesh) {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  const zMin = geometry.boundingBox.min.z;

  // Shift to lay the lowest point on the ground
  mesh.position.y = -zMin;

  // Try all 3 axes and pick the one that results in lowest height
  const rotations = [
    { x: 0, y: 0, z: 0 },
    { x: Math.PI / 2, y: 0, z: 0 },
    { x: 0, y: Math.PI / 2, z: 0 },
  ];

  let bestRotation = rotations[0];
  let lowestHeight = Infinity;

  for (const rot of rotations) {
    mesh.rotation.set(rot.x, rot.y, rot.z);
    geometry.computeBoundingBox();
    const height = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    if (height < lowestHeight) {
      lowestHeight = height;
      bestRotation = { ...rot };
    }
  }

  mesh.rotation.set(bestRotation.x, bestRotation.y, bestRotation.z);
}
