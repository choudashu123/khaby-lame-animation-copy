import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js";

window.addEventListener("DOMContentLoaded", () => {

  let scene, camera, renderer;
  console.log(document.querySelector("#threeCanvas").getBoundingClientRect())

  class Section3D {
    constructor(domEl, type) {
      this.domEl = domEl;
      this.type = type;
      this.group = new THREE.Group();
      scene.add(this.group);

      if (this.type === "BLOCKER") {
        this.createTextMeshes();
      }

      if (this.type === "FULL_SIZE") {
        this.createVideoMesh();
      }
    }

    createVideoMesh() {
      const video = this.domEl.querySelector("video");
      console.log(video)
      video.play();

      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;

      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      this.mesh = new THREE.Mesh(geo, mat);

      this.group.add(this.mesh);
    }

    createTextMeshes() {
      const loader = new FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
        (font) => {
          const words = this.domEl.querySelector(".text-3d").textContent.split(" ");
          console.log(words)
          let yOffset = 0;

          words.forEach((w, i) => {
            const geo = new TextGeometry(w, {
              font,
              size: 0.8,
              height: 0.1,
            });

            geo.computeBoundingBox();
            const box = geo.boundingBox;
            const height = box.max.y - box.min.y;

            geo.center();
            const mat = new THREE.MeshStandardMaterial({
              color: 0xffffff,
            });

            const mesh = new THREE.Mesh(geo, mat);
            const lineSpacing = height * 1.4;
            mesh.position.y = -(lineSpacing * i);
            mesh.position.z = -6;

            this.group.add(mesh);
          });
          const totalSpacing = (this.group.children.length - 1) * lineSpacing;
          this.group.position.y = totalSpacing * 0.5;
        }
      );
    }

    updateScroll() {
      const rect = this.domEl.getBoundingClientRect();
      const winH = window.innerHeight;
      const sectionCenter = rect.top + rect.height / 2;
      const p = (sectionCenter - winH / 2) / winH;

      this.group.children.forEach((mesh, i) => {
        const offset = i * 0.12;
        const pr = p - offset; // stagger each word

        mesh.position.y = -i * 1 + pr * -3;
        // mesh.position.z = Math.abs(pr) * -4;
        mesh.rotation.y = pr * -1.5;
        mesh.material.opacity = 1 - Math.min(Math.abs(pr) * 1.8, 1);
      });
    }
  }
  const videoElement = document.querySelector(".hero-video");

  function init() {
    const canvas = document.getElementById("threeCanvas");

    // Ensure video starts
    videoElement.play().catch(() => {
      console.warn("Autoplay failed. Video texture may not be updated.");
    });

    // Scene + Camera
    scene = new THREE.Scene();
    const fov = 55;
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const sections = [...document.querySelectorAll("section")]
      .map(el => new Section3D(el, el.dataset.type));

    function render() {
      requestAnimationFrame(render);
      sections.forEach(s => s.updateScroll());
      renderer.render(scene, camera);
    }

    render();
  }

  init();
});
