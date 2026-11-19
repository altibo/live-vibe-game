// Simple Three.js starter with gamepad
let scene, camera, renderer, cube;
let version = 1;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  const saved = localStorage.getItem("gameState");
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.cubeRotation) cube.rotation.set(state.cubeRotation.x, state.cubeRotation.y, state.cubeRotation.z);
      if (state.version) version = state.version;
    } catch (e) {}
  }

  var versionEl = document.getElementById("version");
  if (versionEl) versionEl.textContent = "v" + version;

  fetch("/last-change.json")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var diffEl = document.getElementById("diff");
      if (diffEl) {
        diffEl.textContent = "v" + data.version + ": " + data.description;
        diffEl.style.display = "block";
        setTimeout(function() { diffEl.style.display = "none"; }, 5000);
      }
    })
    .catch(function() {});

  animate();
}

function saveState() {
  var state = {
    version: version,
    cubeRotation: { x: cube.rotation.x, y: cube.rotation.y, z: cube.rotation.z }
  };
  localStorage.setItem("gameState", JSON.stringify(state));
}

function handleGamepad() {
  var gamepads = navigator.getGamepads();
  if (!gamepads) return;

  for (var i = 0; i < gamepads.length; i++) {
    var gamepad = gamepads[i];
    if (!gamepad) continue;

    var deadzone = 0.15;
    var sensitivity = 0.05;

    var x = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
    var y = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;

    cube.rotation.y += x * sensitivity;
    cube.rotation.x += y * sensitivity;
  }
}

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.005;
  cube.rotation.y += 0.005;

  handleGamepad();

  renderer.render(scene, camera);

  if (Math.random() < 0.01) saveState();
}

window.addEventListener("beforeunload", saveState);

setInterval(function() {
  fetch("/last-change.json")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.version > version) {
        saveState();
        location.reload();
      }
    })
    .catch(function() {});
}, 1000);

init();
