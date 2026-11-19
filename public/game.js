const GAME_VERSION = 8;
console.log("game.js two cubes");
function setVersion() {
  var el = document.getElementById("version");
  if (el) el.textContent = "v" + (typeof GAME_VERSION !== "undefined" ? GAME_VERSION : "?");
}

function connectReload() {
  var proto = location.protocol === "https:" ? "wss:" : "ws:";
  var ws = new WebSocket(proto + "//" + location.host);
  ws.onmessage = function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === "reload") location.reload();
    } catch (err) {}
  };
  ws.onclose = function() { setTimeout(connectReload, 2000); };
}

function createCube(canvas, color, trailColor) {
  var size = 40;
  var speed = 3 + Math.random() * 2;
  var angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: size,
    color: color,
    trailColor: trailColor,
    trail: []
  };
}

function init() {
  setVersion();
  connectReload();

  var canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var green = createCube(canvas, "#00ff00", "0, 255, 100");
  var red = createCube(canvas, "#ff0000", "255, 50, 50");
  var cubes = [green, red];

  function draw() {
    ctx.fillStyle = "rgba(17, 17, 17, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var c = 0; c < cubes.length; c++) {
      var cube = cubes[c];

      // Trail
      for (var i = 0; i < cube.trail.length; i++) {
        var t = cube.trail[i];
        var alpha = i / cube.trail.length;
        ctx.fillStyle = "rgba(" + cube.trailColor + ", " + (alpha * 0.5) + ")";
        ctx.beginPath();
        ctx.arc(t.x, t.y, cube.size * 0.5 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      // Move + bounce
      cube.x += cube.vx;
      cube.y += cube.vy;
      if (cube.x < cube.size || cube.x > canvas.width - cube.size) cube.vx *= -1;
      if (cube.y < cube.size || cube.y > canvas.height - cube.size) cube.vy *= -1;
      cube.x = Math.max(cube.size, Math.min(canvas.width - cube.size, cube.x));
      cube.y = Math.max(cube.size, Math.min(canvas.height - cube.size, cube.y));

      cube.trail.push({ x: cube.x, y: cube.y });
      if (cube.trail.length > 30) cube.trail.shift();

      // Draw cube
      ctx.fillStyle = cube.color;
      ctx.fillRect(cube.x - cube.size/2, cube.y - cube.size/2, cube.size, cube.size);
    }

    requestAnimationFrame(draw);
  }

  draw();
}

init();
