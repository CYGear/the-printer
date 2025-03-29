let scene, camera, renderer, mesh;

function loadSTL(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;

    if (!THREE || !THREE.STLLoader) {
      alert("Three.js or STLLoader not loaded correctly.");
      return;
    }

    const loader = new THREE.STLLoader();
    const geometry = loader.parse(contents);
    const material = new THREE.MeshNormalMaterial({ flatShading: true });
    mesh = new THREE.Mesh(geometry, material);

    autoOrientMesh(mesh);
    initViewer();
    scene.add(mesh);
    animate();
  };
  reader.readAsArrayBuffer(file);
}

function initViewer() {
  const container = document.getElementById("viewer");
  container.innerHTML = ""; // Clear old view

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
}

function animate() {
  requestAnimationFrame(animate);
  if (mesh) mesh.rotation.y += 0.01;
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
  // Auto-align to flat base for shortest print time
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);

  // Find the longest face and rotate so it's aligned to the ground (Z up)
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
