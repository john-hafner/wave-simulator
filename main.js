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
    width: 200,
    height: 100,
    widthSegments: 150,
    heightSegments: 100,
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
light.position.set(0, 1, 1);
scene.add(light);

// Add a back light to illuminate the under side.
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(0, 0, -1);
scene.add(backLight);

// Setup a GUI to control the properties of the plane
const gui = new dat.GUI();
gui.addFolder('world');
gui.add(world.plane, 'width', 1, 100).onChange(generatePlane);
gui.add(world.plane, 'height', 1, 100).onChange(generatePlane);
gui.add(world.plane, 'widthSegments', 1, 100).onChange(generatePlane);
gui.add(world.plane, 'heightSegments', 1, 100).onChange(generatePlane);

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

        array[i] = (x + Math.random() - 0.5) * 3;
        array[i + 1] = (y + Math.random() - 0.5) * 3;
        array[i + 2] = z + Math.random() - 0.5;
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
    // x
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.003;

    // y
    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i]) * 0.003;
  }

  planeMesh.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(planeMesh);

  if (intersects.length > 0) {
    // Setting the 'r' value of the color to 0.
    //intersects[0].object.geometry.attributes.color.setX(0, 0);
    const { color } = intersects[0].object.geometry.attributes;

    // Vertex 1
    color.setX(intersects[0].face.a, 0.1);
    color.setY(intersects[0].face.a, 0.5); // x=red, y=green, z=blue
    color.setZ(intersects[0].face.a, 1);
    // Vertex 2
    color.setX(intersects[0].face.b, 0.1);
    color.setY(intersects[0].face.b, 0.5);
    color.setZ(intersects[0].face.b, 1);

    // Vertex 3
    color.setX(intersects[0].face.c, 0.1);
    color.setY(intersects[0].face.c, 0.5);
    color.setZ(intersects[0].face.c, 1);

    const initialColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };

    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };

    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      duration: 1,
      onUpdate: () => {
        color.setX(intersects[0].face.a, hoverColor.r);
        color.setY(intersects[0].face.a, hoverColor.g); // x=red, y=green, z=blue
        color.setZ(intersects[0].face.a, hoverColor.b);
        // Vertex 2
        color.setX(intersects[0].face.b, hoverColor.r);
        color.setY(intersects[0].face.b, hoverColor.g);
        color.setZ(intersects[0].face.b, hoverColor.b);

        // Vertex 3
        color.setX(intersects[0].face.c, hoverColor.r);
        color.setY(intersects[0].face.c, hoverColor.g);
        color.setZ(intersects[0].face.c, hoverColor.b);
      },
    });

    intersects[0].object.geometry.attributes.color.needsUpdate = true;
  }

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
