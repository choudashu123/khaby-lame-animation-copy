import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) {
    try {
      history.scrollRestoration = "manual";
    } catch (e) {
      /* some envs may throw */
    }
  }
  window.addEventListener("pageshow", function (e) {
    // e.persisted === true when loaded from bfcache (Safari, Firefox, Chrome sometimes)
    window.scrollTo(0, 0);
    // Also reset after a tiny delay to be extra safe on some mobile browsers:
    setTimeout(() => window.scrollTo(0, 0), 50);
  });

  // 4) beforeunload — try to ensure next load starts at top in some browsers
  window.addEventListener("beforeunload", function () {
    window.scrollTo(0, 0);
  });

  let scene, camera, renderer, planeMesh, videoElement, textGroup;

  // Convert HTML element dimensions to 3D world scale
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
    videoElement = document.querySelector(".hero-video");

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

    // Video Texture
    const videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // Plane Mesh
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

    // text mesh
    let textGroup = new THREE.Group(); // holds all word meshes
    scene.add(planeMesh, textGroup);

    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (loadedFont) => {
        const sentence = "Social Media Superstar";
        const words = sentence.split(" ");
        let offsetX = 0;

        words.forEach((word, index) => {
          const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0
          })
          const geometry = new TextGeometry(word, {
            font: loadedFont,
            size: 0.3,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.01,
            bevelSegments: 5
          });

          geometry.computeBoundingBox();
          const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = offsetX;
          mesh.position.y = -1; // place below hero
          mesh.position.z = -5;

          offsetX += width + 0.2;
          textGroup.add(mesh);
        });

        // center group
        const totalWidth = offsetX;
        textGroup.position.x = -totalWidth / 2;
      }
    );

    onWindowResize();
    animate();
  };

  const onWindowResize = () => {
    if (!camera || !renderer || !videoElement || !planeMesh) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Wait until video metadata is loaded to get dimensions
    const { videoWidth, videoHeight } = videoElement;
    if (!videoWidth || !videoHeight) return;

    const videoAspect = videoWidth / videoHeight;
    const screenAspect = window.innerWidth / window.innerHeight;

    // Determine visible world size at the camera's Z position
    const distance = camera.position.z;
    const vFOV = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;

    let scaleX, scaleY;

    if (screenAspect > videoAspect) {
      // Viewport wider than video — stretch width, crop sides
      scaleX = visibleWidth;
      scaleY = visibleWidth / videoAspect;
    } else {
      // Viewport taller — stretch height, crop top/bottom
      scaleY = visibleHeight;
      scaleX = visibleHeight * videoAspect;
    }

    planeMesh.scale.set(scaleX, scaleY, 1);
    planeMesh.position.set(0, 0, 0);
  }

  const animate = () => {
    requestAnimationFrame(animate);

    if (videoElement.readyState >= 2 && planeMesh?.material?.map) {
      planeMesh.material.map.needsUpdate = true;
    }

    // === ✨ Animate using "animateFullSize" logic from reference site ===
    const rect = videoElement.getBoundingClientRect(); // (b)
    const c = window.innerHeight; // viewport height
    const a = rect.y; // distance from top
    const L = ((rect.top + rect.height) / (c + rect.height) - 0.5) * 2; // same as L(b)
    // Apply transforms to the plane (hero section animation)
    planeMesh.position.x = -(0.001 * window.innerWidth) * L; // horizontal drift
    planeMesh.position.y = -0.5 * a * 0.01; // vertical motion (scaled down)
    planeMesh.position.z = -Math.min(a / 1000, 2); // depth (Z)
    planeMesh.rotation.x = 0; // no X tilt
    planeMesh.rotation.y = ((-0.1 * Math.PI) / c) * a; // Y-axis tilt



    if (textGroup && textGroup.children.length > 0) {
      const textSection = document.querySelector(".text-section");
      const rect2 = textSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress: 0 when section enters bottom, 1 when it exits top
      const scrollProgress = 1 - (rect2.top / viewportHeight);
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

      textGroup.children.forEach((mesh, i) => {
        const delay = i * 0.1;
        const adjustedProgress = Math.max(0, Math.min(1, clampedProgress - delay));

        // Entrance animation
        mesh.position.z = -5 + (adjustedProgress * 3); // Move from -5 to -2
        mesh.rotation.y = (1 - adjustedProgress) * Math.PI * 0.5; // Rotate in
        mesh.material.opacity = adjustedProgress; // Fade in

        // Floating effect when visible
        if (adjustedProgress > 0.5) {
          const floatOffset = Math.sin(Date.now() * 0.001 + i) * 0.1;
          mesh.position.y = -1 + floatOffset;
        } else {
          mesh.position.y = -1 - (1 - adjustedProgress) * 2; // Start from below
        }
      });
    }
    renderer.render(scene, camera);
  };
  const loader = document.querySelector(".loader-visual");
  const fill = document.querySelector(".loader-visual__fill");
  const startBtnWrapper = document.querySelector(".loader-visual__start");
  const startBtn = document.querySelector(".loader-visual__button");

  let progress = 0;
  const fakeLoad = setInterval(() => {
    progress += Math.random() * 10; // simulate asset loading
    if (progress >= 100) {
      progress = 100;
      clearInterval(fakeLoad);
      startBtnWrapper.classList.remove("hidden");
    }
    fill.style.width = `${progress}%`;
  }, 150);

  const heroDOM = document.querySelector(".hero");
  startBtn.addEventListener("click", () => {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.remove();
      // heroDOM.classList.add("is-init");
      // here you can start audio or animations
      const heroInner = document.querySelector(".hero__inner");
      gsap.fromTo(
        heroInner,
        { yPercent: 200, rotationX: 10 },
        {
          yPercent: 0,
          rotationX: 0,
          duration: 2,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(heroInner, { clearProps: "all" });
          },
        }
      );
      gsap.fromTo(
        heroHeadline,
        { yPercent: 200, rotationX: 10, opacity: 0 },
        {
          yPercent: 0,
          rotationX: 0,
          duration: 2,
          opacity: 1,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(heroInner, { clearProps: "all" });
          },
        }
      );
      initThree();
      console.log(heroDOM.getBoundingClientRect());
    }, 1000);
  });
  window.addEventListener("resize", onWindowResize);
  // window.onload = initThree;
});
