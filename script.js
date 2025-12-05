// drop-in JS (module). Place after your HTML, or in a module file.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js";

window.addEventListener("DOMContentLoaded", () => {

  console.log(document.querySelector(".hero").offsetHeight)


  // ---------- Stage (scene, camera, renderer) ----------
  class Stage {
    constructor(canvasEl) {
      this.canvasEl = canvasEl;
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      this.camera.position.z = 5;

      this.renderer = new THREE.WebGLRenderer({
        canvas: canvasEl || undefined,
        alpha: true,
        antialias: true,
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.onResize();

      window.addEventListener("resize", () => this.onResize());

      // simple lighting for text
      const hemi = new THREE.HemisphereLight(0xffffff, 0x111111, 1.2);
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(2, 2, 5);
      this.scene.add(hemi, dir);

      this.sections = [];
    }

    addSection(s) {
      this.sections.push(s);
    }

    onResize() {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
      this.renderer.render(this.scene, this.camera);
    }
  }


  function computeGeometryUVs(geometry) {
    // Ensure position attribute exists
    const pos = geometry.attributes.position;
    if (!pos) return;

    // compute bounding box (min/max in local space)
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const sizeX = bbox.max.x - bbox.min.x || 1;
    const sizeY = bbox.max.y - bbox.min.y || 1;

    // prepare uv attribute (2 floats per vertex)
    const uvCount = pos.count * 2;
    const uvArray = new Float32Array(uvCount);
    // temporary vector for reading vertex position
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // map x -> [0,1] across bbox.x and y -> [0,1] across bbox.y
      const u = (v.x - bbox.min.x) / sizeX;
      const vval = (v.y - bbox.min.y) / sizeY;
      uvArray[i * 2 + 0] = u;
      uvArray[i * 2 + 1] = vval;
    }

    // attach or update the uv attribute
    if (geometry.attributes.uv) {
      geometry.attributes.uv.array.set(uvArray);
      geometry.attributes.uv.needsUpdate = true;
    } else {
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2));
    }
  }

  function createRevealMaterial(color = 0xffffff) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uReveal: { value: 0.0 },    // 0 = hidden, 1 = fully revealed
        uEdge: { value: 0.03 },   // softness of the edge
        uColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec2 vUv;
uniform float uReveal;
uniform float uEdge;
uniform vec3 uColor;

void main() {
    float cutoff = 1.0 - uReveal;
    float mask;

    if (uReveal < 1.0 - 1e-5) {
        // With soft edge during reveal
        mask = smoothstep(cutoff - uEdge, cutoff + uEdge, vUv.x);
    } else {
        // Once fully revealed, make edge crisp
        mask = step(cutoff, vUv.x);
    }

    gl_FragColor = vec4(uColor, mask);

    if (gl_FragColor.a < 0.01) discard;
}
    `
    });
  }

  // ---------- Section base ----------
  class Section3D {
    constructor(domEl, type, stage) {
      this.domEl = domEl;
      this.type = type;
      this.stage = stage;
      this.group = new THREE.Group();
      this.stage.scene.add(this.group);

      this.meshes = [];    // three.js meshes
      this.domLines = [];  // matching DOM <h2> elements (for BLOCKER)
      this._lineSpacing = 1;
      this._loaded = false;

      if (this.type === "FULL_SIZE") this._createVideoPlane();
      if (this.type === "BLOCKER") this._createTextBlock();
    }


    rect() {
      return this.domEl.getBoundingClientRect();
    }

    // ---------- Fullscreen Video Plane ----------
    _createVideoPlane() {
      const video = this.domEl.querySelector("video");
      if (!video) {
        console.warn("Video element not found in FULL_SIZE section");
        this._loaded = true;
        return;
      }

      video.play().catch(() => { /* autoplay may be blocked */ });

      const tex = new THREE.VideoTexture(video);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      try { tex.colorSpace = THREE.SRGBColorSpace; } catch (e) { }

      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      this.meshes.push(mesh);
      this.video = video;
      this.videoTexture = tex;
      this._loaded = true;

      this._updateVideoScale();
      window.addEventListener("resize", () => this._updateVideoScale());
      video.addEventListener("loadedmetadata", () => this._updateVideoScale());
    }

    _updateVideoScale() {
      if (!this.meshes[0] || !this.video) return;
      const mesh = this.meshes[0];
      const cam = this.stage.camera;
      const distance = cam.position.z;
      const vFOV = (cam.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
      const visibleWidth = visibleHeight * cam.aspect;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const vidW = this.video.videoWidth || (this.video.clientWidth || vw);
      const vidH = this.video.videoHeight || (this.video.clientHeight || vh);
      if (!vidW || !vidH) return;

      const vidAspect = vidW / vidH;
      const screenAspect = vw / vh;

      let scaleX, scaleY;
      if (screenAspect > vidAspect) {
        scaleX = visibleWidth;
        scaleY = visibleWidth / vidAspect;
      } else {
        scaleY = visibleHeight;
        scaleX = visibleHeight * vidAspect;
      }
      mesh.scale.set(scaleX, scaleY, 1);
      mesh.position.set(0, 0, 0);
    }

    // ---------- BLOCKER text block (one mesh per <h2>) ----------
    _createTextBlock() {
      const headings = Array.from(this.domEl.querySelectorAll("h2"));
      if (!headings.length) {
        console.warn("No h2 elements found for BLOCKER section");
        this._loaded = true;
        return;
      }

      const loader = new FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
        (font) => {
          const meshes = [];
          this.domLines = headings;

          // create meshes and measure heights for spacing
          this.domLines.forEach((lineEl, i) => {
            const text = (lineEl.textContent || "").trim();
            const geo = new TextGeometry(text, {
              font,
              size: 1.42,
              height: 0.08,
              curveSegments: 12,
              bevelEnabled: false,
            });

            geo.computeBoundingBox();
            const box = geo.boundingBox || { min: { y: 0 }, max: { y: 0 } };
            const height = (box.max.y - box.min.y) || 0.8;
            const width = (box.max.x - box.min.x) || 1;
            // console.log(height, width)

            geo.center();

            computeGeometryUVs(geo);

            // 3) create reveal material (one per mesh or share material with separate uniform copies)
            const material = createRevealMaterial(0xffffff);

            // const mat = new THREE.MeshStandardMaterial({
            //   color: 0xffffff,
            //   transparent: true,
            //   opacity: 1,
            //   metalness: 0,
            //   roughness: 0.6,
            // });

            const mesh = new THREE.Mesh(geo, material);
            mesh.userData._lineHeight = height;
            mesh.userData._lineWidth = width;
            meshes.push(mesh);
            this.group.add(mesh);
          });

          // compute spacing
          const spacingFactor = 1.25;
          const heights = meshes.map(m => m.userData._lineHeight || 0.9);
          const lineSpacing = heights.length ? Math.max(...heights) * spacingFactor : 1;
          // console.log(lineSpacing, heights)

          // position meshes and store baseY so floats don't accumulate
          meshes.forEach((mesh, i) => {
            const baseY = -(lineSpacing * i);
            mesh.userData.baseY = baseY;
            mesh.position.y = baseY;
            mesh.position.z = -6;
            // console.log("mesh.position", i, mesh.position)
          });

          // center the block vertically
          const totalHeight = (meshes.length - 1) * lineSpacing;
          // console.log("totalHeight", totalHeight)
          this.group.position.y = totalHeight * 0.5;

          this.meshes = meshes;
          this._lineSpacing = lineSpacing;
          this._loaded = true;
        },
        undefined,
        (err) => {
          console.error("Font load error:", err);
          this._loaded = true;
        }
      );
    }

    // ---------- Scroll-driven update ----------
    updateScroll() {
      if (!this._loaded) return;

      const winH = window.innerHeight;

      if (this.type === "FULL_SIZE") {
        const rect = this.rect();
        const a = rect.top;
        const L = ((rect.top + rect.height) / (winH + rect.height) - 0.5) * 2;
        const plane = this.meshes[0];
        if (plane) {
          plane.position.x = -(0.001 * window.innerWidth) * L;
          plane.position.y = -0.5 * a * 0.01;
          plane.position.z = -Math.min(a / 1000, 2);
          plane.rotation.y = ((-0.1 * Math.PI) / winH) * a;
        }
        return;
      }
      const introRect = this.rect()
      const pSection = (introRect.top + introRect.height * 0.5 - winH * 0.5) / winH;
      this.group.position.y = pSection * -12 + 4;


      // BLOCKER: per-line DOM-driven progress (so order matches DOM visibility)

      this.meshes.forEach((mesh, i) => {
        const lineEl = this.domLines[i];
        if (!lineEl) return;

        const lineRect = lineEl.getBoundingClientRect();
        const lineCenter = lineRect.top + lineRect.height * 0.5;
        const px = (lineCenter - winH * 0.5) / winH;
        // console.log("px", px, i)

        // small optional stagger for nicer wheel feeling (very small)
        const stagger = 0.06; // set to 0 to strictly follow DOM; increase slightly (0.06) if you want a little lag
        const pr = px - (i * stagger);
        const distance = Math.abs(pr);
        const baseY = mesh.userData.baseY || (-(this._lineSpacing || 1) * i);
        // console.log("baseY", baseY)

        let progress = 1.0 - Math.min(1.0, Math.abs(px) * 3.0); // tune 3.0 to adjust reveal window
        progress = Math.max(0, Math.min(1, progress)); // clamp 0..1

        // But the reference wants: reveal grows as it *approaches center*, and _stays_ revealed
        // after crossing center. That means we should take max(current, previous).
        mesh.userData.revealProgress = Math.max(mesh.userData.revealProgress || 0, progress);

        // set uniform (material per-mesh)
        if (mesh.material && mesh.material.uniforms) {
          mesh.material.uniforms.uReveal.value = mesh.userData.revealProgress;
        }

        // position, depth, rotation, opacity
        // mesh.position.y = mesh.userData.baseY + px * -7;
        // mesh.position.z = -11 - distance * 3;
        mesh.rotation.y = px * 1.5;
        mesh.material.opacity = 1

        const canvasel = document.querySelector("#threeCanvas")
        // console.log("window.innerHeight, window.innerWidth", window.innerHeight, window.innerWidth, canvasel.offsetHeight, canvasel.offsetWidth)

      });
    }

    // ---------- Continuous micro-animations ----------
    animate(deltaTime) {
      if (!this._loaded) return;

      if (this.type === "BLOCKER") {
        const t = performance.now() * 0.001;

        this.meshes.forEach((mesh, i) => {
          const lineEl = this.domLines[i];
          if (!lineEl) return;

          const lineRect = lineEl.getBoundingClientRect();
          const winH = window.innerHeight;
          const p = (lineRect.top + lineRect.height * 0.5 - winH * 0.5) / winH;
          const visibility = Math.max(0, 1 - Math.abs(p) * 1.5);


          const floatY = Math.sin(t * 0.6 + i * 0.6) * 0.02 * visibility;
          // apply float relative to baseY (do not accumulate)
          const baseY = mesh.userData.baseY || mesh.position.y;
          // mesh.position.y = baseY + (mesh.userData.prOffset || 0) + floatY * 0.5 * (deltaTime || 1);
        });
      } else if (this.type === "FULL_SIZE") {
        const plane = this.meshes[0];
        if (plane) {
          const t = performance.now() * 0.0005;
          plane.rotation.x = Math.sin(t) * 0.001;
          plane.rotation.z = Math.sin(t * 0.7) * 0.0015;
        }
      }
    }
  }

  // ---------- Initialization ----------
  const canvas = document.getElementById("threeCanvas");
  const stage = new Stage(canvas || undefined);

  const sectionEls = Array.from(document.querySelectorAll("section[data-type]"));
  const sections = sectionEls.map((el) => {
    const type = el.dataset.type;
    const s = new Section3D(el, type, stage);
    stage.addSection(s);
    return s;
  });

  const heroVideoEl = document.querySelector(".hero-video");
  if (heroVideoEl) heroVideoEl.play().catch(() => { });

  // ---------- Main loop ----------
  let lastTime = performance.now();
  function loop(now = performance.now()) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    sections.forEach(s => s.updateScroll());
    sections.forEach(s => s.animate(dt));
    stage.render();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

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

  // const heroDOM = document.querySelector(".hero");

  // startBtn.addEventListener("click", () => {
  //   loader.style.opacity = "0";

  //   setTimeout(() => {
  //     loader.remove();
  // heroDOM.classList.add("is-init");
  //     // here you can start audio or animations
  //     stage.onResize();

  //     // 2. You can also force a scroll update to immediately position the sections
  //     sections.forEach(s => s.updateScroll());
  //     stage.render(); // Force an immediate render after sizing

  // ... (existing GSAP animations below)
  const heroInner = document.querySelector(".hero__inner")
  setTimeout(() => {
    heroInner.classList.add("is-init")
  }, 100)


  gsap.fromTo(
    heroInner,
    { yPercent: 200 }, // <-- FROM
    {
      yPercent: 0,
      duration: 2,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(heroInner, { clearProps: "all" });
      }
    }
  );
  const heroHeadline = document.querySelector(".heroHeadline")
  gsap.fromTo(
    heroHeadline,
    { yPercent: 200 }, // <-- FROM
    {
      yPercent: 0,
      duration: 2,
      opacity: 1,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(heroHeadline, { clearProps: "all" });
      }
    }
  );

  //   gsap.fromTo(
  //     heroHeadline,
  //     { yPercent: 200, rotationX: 10, opacity: 0 },
  //     {
  //       yPercent: 0,
  //       rotationX: 0,
  //       duration: 2,
  //       opacity: 1,
  //       ease: "power2.out",
  //       onComplete: () => {
  //         gsap.set(heroInner, { clearProps: "all" });
  //       },
  //     }
  //   );
  // }, 1000);

})