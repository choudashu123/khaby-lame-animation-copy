gsap.registerPlugin(ScrollTrigger);
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js";

window.addEventListener("DOMContentLoaded", () => {

  let scene, camera, renderer, planeMesh, videoElement;
  let textGroup;
  let fontLoaded = false;

  // Convert element size → 3D world scale
  const getScreenToWorldScale = (element, camera, depth = 0) => {
    const rect = element.getBoundingClientRect();
    const vFOV = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * depth;
    const width = height * camera.aspect;
    const scaleY = (rect.height / window.innerHeight) * height;
    const scaleX = (rect.width / window.innerWidth) * width;
    return { scaleX, scaleY };
  };

  const initThree = () => {
    const canvas = document.getElementById("threeCanvas");

    // Scene + Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    // const light = new THREE.AmbientLight(0xffffff, 1);
    // scene.add(light);

    // Create group for text
    textGroup = new THREE.Group();
    scene.add(textGroup);

    // Load font and create text meshes
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const sentence = "Social Media Superstar";
        const words = sentence.split(" ");
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        let offsetX = 0;

        words.forEach((word) => {
          const geometry = new TextGeometry(word, {
            font,
            size: 0.3,
            height: 0.02,
            curveSegments: 10,
          });

          geometry.computeBoundingBox();
          const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
          const mesh = new THREE.Mesh(geometry, material);

          mesh.position.x = offsetX;
          mesh.position.y = -1;
          mesh.position.z = 1;
          offsetX += width + 0.2;
          textGroup.add(mesh);
        });

        // Center text group
        const totalWidth = offsetX;
        textGroup.position.x = -totalWidth / 2;
        fontLoaded = true; // ✅ mark as loaded
      }
    );

    onWindowResize();
    animate();
  };

  const onWindowResize = () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  const animate = () => {
    requestAnimationFrame(animate);
    // --- 3D Text Animation ---
    if (fontLoaded && textGroup) {
      const textSection = document.querySelector(".text-section");
      const rect2 = textSection.getBoundingClientRect();
      const c2 = window.innerHeight;
      const scrollFactor =
        ((rect2.top + rect2.height) / (c2 + rect2.height) - 0.5) * 2;

      textGroup.children.forEach((mesh, i) => {
        const delay = i * 0.15;
        const localFactor = scrollFactor + delay;

        mesh.rotation.y = Math.sin(localFactor * Math.PI) * 0.6;
        mesh.position.z = -Math.min(localFactor * 5, 3);
        mesh.position.y = -1 + i * 0.2 * localFactor;
      });
    }

    renderer.render(scene, camera);
  };

  // --- Loader animation logic ---
  // const loader = document.querySelector(".loader-visual");
  // const fill = document.querySelector(".loader-visual__fill");
  // const startBtnWrapper = document.querySelector(".loader-visual__start");
  // const startBtn = document.querySelector(".loader-visual__button");

  // let progress = 0;
  // const fakeLoad = setInterval(() => {
  //   progress += Math.random() * 10;
  //   if (progress >= 100) {
  //     progress = 100;
  //     clearInterval(fakeLoad);
  //     startBtnWrapper.classList.remove("hidden");
  //   }
  //   fill.style.width = `${progress}%`;
  // }, 150);


  initThree();
  window.addEventListener("resize", onWindowResize);
});
