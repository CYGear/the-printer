let scene, camera, renderer, controls, transformControls, mesh;

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
    autoOrientToFlattestFace(mesh);
    scene.add(mesh);
    addTransformControls();
  };
  reader.readAsArrayBuffer(file);
}

function resetViewer() {
  const container = document.getElementById("viewer");
  container.innerHTML = "";

  const width = container.clientWidth;
  const height = container.clientHeight || 300;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

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
    viewer.requestFullscreen().catch(err => {
      alert(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

function autoOrientToFlattestFace(mesh) {
  const geometry = mesh.geometry;
  geometry.computeFaceNormals();

  let faceAreas = {};
  let faceNormals = {};

  geometry.faces.forEach(face => {
    const normalKey = `${face.normal.x.toFixed(1)},${face.normal.y.toFixed(1)},${face.normal.z.toFixed(1)}`;
    const vA = geometry.vertices[face.a];
    const vB = geometry.vertices[face.b];
    const vC = geometry.vertices[face.c];

    const area = new THREE.Triangle(vA, vB, vC).getArea();
    faceAreas[normalKey] = (faceAreas[normalKey] || 0) + area;
    faceNormals[normalKey] = face.normal.clone();
  });

  let flattest = Object.entries(faceAreas).sort((a, b) => b[1] - a[1])[0];
  if (!flattest) return;

  const normal = faceNormals[flattest[0]];
  const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, 0, 1));
  mesh.applyQuaternion(quaternion);

  geometry.computeBoundingBox();
  mesh.position.z = -geometry.boundingBox.min.z;
}

function addTransformControls() {
  transformControls = new THREE.TransformControls(camera, renderer.domElement);
  transformControls.attach(mesh);
  transformControls.setMode("rotate");
  transformControls.size = 1.5; // make it larger for visibility
  transformControls.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  scene.add(transformControls);
}
