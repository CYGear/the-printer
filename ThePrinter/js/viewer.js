let scene, camera, renderer, mesh;

function loadSTL(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;
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
  if (renderer) {
    scene = null;
    camera = null;
    renderer.dispose();
    document.getElementById("viewer").innerHTML = "";
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    document.getElementById("viewer").clientWidth / 300,
    0.1,
    1000
  );
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(document.getElementById("viewer").clientWidth, 300);
  renderer.setClearColor(0x000000, 0);
  document.getElementById("viewer").appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
}

function animate() {
  requestAnimationFrame(animate);
  if (mesh) mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
