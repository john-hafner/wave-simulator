import './style.css';
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import gsap from 'gsap';

// document.querySelector('#app').innerHTML = `
//   <h1>Hello!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// Set the scene, lights...
const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
// Camera! ...
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  1,
  1000
);
// Let's move the camera back a bit
camera.position.z = 50;

// ACTION! ...
const renderer = new THREE.WebGLRenderer();

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Adding orbital controls, apparently this ref just floats away & the mouse now does it's thang.
new OrbitControls(camera, renderer.domElement);

const world = {
  plane: {
    width: 100,
    height: 100,
    widthSegments: 1000,
    heightSegments: 1000,
  },
};

// Setup the plane
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
// Adding a material
const planeMat = new THREE.MeshPhongMaterial({
  side: THREE.DoubleSide, // TODO: Remove this, as we don't want to see the back side.
  flatShading: THREE.FlatShading,
  vertexColors: true,
});
// Building a mesh out of the geometry & material
const planeMesh = new THREE.Mesh(planeGeometry, planeMat);
scene.add(planeMesh);

generatePlane();

// Make it jagged
const { array } = planeMesh.geometry.attributes.position;
const randomValues = [];

// Setup the colors, need one for each geometry vertex in the mesh
// const colors = [];
// for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
//   colors.push(0, 0.19, 0.4);
// }
// // Set the colors, indicating every 3 are associated with a given vertex for (rgb)
// planeMesh.geometry.setAttribute(
//   'color',
//   new THREE.BufferAttribute(new Float32Array(colors), 3)
// );

// Let there be light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 1);
scene.add(light);

// Add a back light to illuminate the under side.
// const backLight = new THREE.DirectionalLight(0xffffff, 1);
// backLight.position.set(0, 0, -1);
// scene.add(backLight);

// Properties for the wave
const wave = {
  amplitude: 1.0,
  k: 1.0,
  w: 1.0,
};

// Setup a GUI to control the properties of the plane
const gui = new dat.GUI();
const waveFolder = gui.addFolder('Wave Properties');
waveFolder.add(wave, 'amplitude', 0.1, 10);
waveFolder.add(wave, 'k', 0.1, 100);
waveFolder.add(wave, 'w', 0.1, 100);
waveFolder.open();
const worldFolder = gui.addFolder('world');
worldFolder.add(world.plane, 'width', 1, 200).onChange(generatePlane);
worldFolder.add(world.plane, 'height', 1, 200).onChange(generatePlane);
worldFolder.add(world.plane, 'widthSegments', 1, 1000).onChange(generatePlane);
worldFolder.add(world.plane, 'heightSegments', 1, 1000).onChange(generatePlane);

/** Setup the plane initially, or when needing to update it. */
function generatePlane() {
  if (planeMesh) {
    planeMesh.geometry = new THREE.PlaneGeometry(
      world.plane.width,
      world.plane.height,
      world.plane.widthSegments,
      world.plane.heightSegments
    );

    // Make it jagged
    const { array } = planeMesh.geometry.attributes.position;
    const randomValues = [];

    for (let i = 3; i < array.length; i++) {
      if (i % 3 === 0) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];

        // array[i] = (x + Math.random() - 0.5) * 3;
        // array[i + 1] = (y + Math.random() - 0.5) * 3;
        // array[i + 2] = z + Math.random() - 0.5;
      }

      randomValues.push(Math.random() * Math.PI * 2);
    }

    planeMesh.geometry.attributes.position.originalPosition =
      planeMesh.geometry.attributes.position.array;

    planeMesh.geometry.attributes.position.randomValues = randomValues;

    const colors = [];
    for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
      colors.push(0, 0.19, 0.4);
    }
    // Set the colors, indicating every 3 are associated with a given vertex for (rgb)
    planeMesh.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );
  }
}

//colors.itemSize = 3;

/** Holding the mouse coordinates on the screen client (x, y) */
const mouse = {
  x: undefined,
  y: undefined,
};

let time = 0;
const increment = 0.01;
let frame = 0;
function animate() {
  frame += increment;
  const { array, originalPosition, randomValues } =
    planeMesh.geometry.attributes.position;

  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const y = array[i + 1];
    const distance = Math.sqrt(x ** 2 + y ** 2);
    const k = 1;
    const w = 1;
    const a = 1.0;
    // z
    array[i + 2] =
      wave.amplitude * Math.sin(wave.k * distance - wave.w * frame);
  }
  // for (let i = 0; i < array.length; i += 3) {
  //   // x
  //   array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.003;

  //   // y
  //   array[i + 1] =
  //     originalPosition[i + 1] + Math.sin(frame + randomValues[i]) * 0.003;
  // }

  planeMesh.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  //raycaster.setFromCamera(mouse, camera);
  //const intersects = raycaster.intersectObject(planeMesh);

  //plane.rotation.x += 0.01;
  //time += increment;
  requestAnimationFrame(animate);
}

// ACTION!
renderer.render(scene, camera);

animate();

/** Event Listeners */
addEventListener('mousemove', (e) => {
  // Convert from screen coords to camera coords for the raycaster
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * -2 + 1;
});
