let scene, camera, renderer, mesh;

function loadSTL(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;

    // Make sure THREE and STLLoader are loaded
    if (!THREE || !THREE.STLLoader) {
      alert("Three.js or STLLoader not loaded correctly.");
      return;
    }

    const loader = new THREE.STLLoader();
    const geometry = loader.parse(contents);
    const material = new THREE.MeshNormalMaterial({ flatShading: true });
    mesh = new THREE.Mesh(geometry, material);

    initViewer();
    scene.add(mesh);
    animate();
  };
  reader.readAsArrayBuffer(file);
}

function initViewer() {
  const container = document.getElementById("viewer");
  container.innerHTML = ""; // Clear previous

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(300, 300);
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

