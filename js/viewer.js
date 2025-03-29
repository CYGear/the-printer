let scene, camera, renderer, mesh, topMesh, bottomMesh;
let cutPlane = 50;

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

    autoOrientMesh(mesh);

    initViewer();
    addSplitMeshes(geometry);
    animate();
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

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  document.getElementById("slider").addEventListener("input", updateCutPosition);
  document.getElementById("topColor").addEventListener("change", updateColors);
  document.getElementById("bottomColor").addEventListener("change", updateColors);
}

function addSplitMeshes(geometry) {
  // Simple visual split using bounding box halves
  const bbox = geometry.boundingBox;
  const height = bbox.max.z - bbox.min.z;
  const cutZ = bbox.min.z + (cutPlane / 100) * height;

  const topMaterial = new THREE.MeshPhongMaterial({ color: getColorHex("topColor"), flatShading: true });
  const bottomMaterial = new THREE.MeshPhongMaterial({ color: getColorHex("bottomColor"), flatShading: true });

  const topGeometry = geometry.clone();
  const bottomGeometry = geometry.clone();

  topMesh = new THREE.Mesh(topGeometry, topMaterial);
  bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);

  topMesh.position.z = 0.5;
  bottomMesh.position.z = -0.5;

  scene.add(topMesh);
  scene.add(bottomMesh);
}

function updateCutPosition(e) {
  cutPlane = parseInt(e.target.value);
  updateColors();
}

function updateColors() {
  if (!topMesh || !bottomMesh) return;
  topMesh.material.color.set(getColorHex("topColor"));
  bottomMesh.material.color.set(getColorHex("bottomColor"));
}

function getColorHex(selectId) {
  const color = document.getElementById(selectId).value.toLowerCase();
  const colors = {
    blue: 0x2196f3,
    green: 0x4caf50,
    rainbow: 0xffc107,
    white: 0xffffff,
    black: 0x000000,
    red: 0xf44336,
  };
  return colors[color] || 0x999999;
}

function animate() {
  requestAnimationFrame(animate);
  if (topMesh) topMesh.rotation.y += 0.01;
  if (bottomMesh) bottomMesh.rotation.y += 0.01;
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

function autoOrientMesh(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.x > size.y && size.x > size.z) {
    mesh.rotation.z = Math.PI / 2;
  } else if (size.y > size.x && size.y > size.z) {
    mesh.rotation.x = Math.PI / 2;
  }

  mesh.geometry.computeBoundingBox();
  const bbox = mesh.geometry.boundingBox;
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  mesh.position.sub(center);
}
