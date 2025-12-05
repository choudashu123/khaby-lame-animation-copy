// drop-in JS (module). Place after your HTML, or in a module file.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
  gsap.utils.toArray(".js-text-block").forEach(text => {
    gsap.to(text, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: text,
        start: "top 80%", // text enters screen
        toggleActions: "play none none reverse",
      }
    });
  });

  const introTextSec = document.querySelector(".intro-text")
  const overlay = document.querySelector(".gradient-overlay");
  const lastText = document.querySelector(".js-text-block:last-child");


  ScrollTrigger.create({
    trigger: lastText,
    start: "top top",   // When top of last block reaches 50vh
    onEnter: () => overlay.classList.add("hide"),
    onLeaveBack: () => overlay.classList.remove("hide"),
  });
  let target = 0;
  let current = 0;
  const ease = 0.075;

  const slider = document.querySelector('.cust-slider');
  const sliderWrapper = document.querySelector('.cust-slider-wrapper');
  const slides = document.querySelectorAll('.cust-slide');
  let maxScroll = sliderWrapper.scrollWidth - window.innerWidth;

  // Linear interpolation for smooth movement
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Update scaling/offset for each slide based on distance from viewport centre
  function updateScaleAndPosition() {
    const viewportCentre = window.innerWidth / 2;
    slides.forEach(slide => {
      const rect12 = slide.getBoundingClientRect();
      const centre = (rect12.left + rect12.right) / 2;
      const distance = centre - viewportCentre;
      let scale, offsetX;
      if (distance > 0) {
        scale = Math.min(1.75, 1 + distance / window.innerWidth);
        offsetX = (scale - 1) * 300;
      } else {
        scale = Math.max(0.5, 1 - Math.abs(distance) / window.innerWidth);
        offsetX = 0;
      }
      gsap.set(slide, { scale: scale, x: offsetX });
    });
  }

  // Render loop for smooth horizontal motion
  function animate() {
    current = lerp(current, target, ease);
    gsap.set(sliderWrapper, { x: -current });
    updateScaleAndPosition();
    requestAnimationFrame(animate);
  }
  animate();

  // Wheel handler: only runs when slider is pinned and still visible
  function handleWheel(e) {
    const rect = slider.getBoundingClientRect();
    const pinned = rect.top <= 0 && rect.bottom > 0;  // element at top AND still visible:contentReference[oaicite:3]{index=3}
    if (!pinned) return;

    if (e.deltaY < 0 && target <= 0) return;
    if (e.deltaY > 0 && target >= maxScroll) return;

    target += e.deltaY;
    target = Math.max(0, Math.min(target, maxScroll));
    e.preventDefault();
  }

  // Observe when the slider enters/leaves the viewport
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        window.addEventListener('wheel', handleWheel, { passive: false });
      } else {
        window.removeEventListener('wheel', handleWheel, { passive: false });
      }
    });
  }, { threshold: 0 });
  observer.observe(slider);

  // Lock the page at the slider’s top while horizontal scrolling is active
  document.addEventListener('scroll', () => {
    const rect = slider.getBoundingClientRect();
    const atTop = Math.abs(rect.top) <= 5;
    if (atTop && target > 0 && target < maxScroll) {
      const offset = slider.offsetTop;
      if (window.scrollY !== offset) {
        window.scrollTo(0, offset);
      }
    }

    if (introTextSec.getBoundingClientRect().top < window.innerHeight) {
      overlay.style.opacity = 1
    } else {

      overlay.style.opacity = 0
    }
  });

  // Recalculate maxScroll on resize
  window.addEventListener('resize', () => {
    maxScroll = sliderWrapper.scrollWidth - window.innerWidth;
    target = Math.min(target, maxScroll);
  });


  const container = document.querySelector(".interview__inner"); // this holds perspective
  const titles = Array.from(container.querySelectorAll("h2"));
  const videoEl = document.querySelector(".heros-video")
  const videoWrapper = document.querySelector(".video-placeholder")

  const introContainer = document.querySelector(".intro-section")
  const introTitles = Array.from(introContainer.querySelectorAll("h2"))
  console.log("introTitles", introTitles)

  const vw = videoEl.videoWidth
  const vh = videoEl.videoHeight
  console.log(vw, vh)
  // videoWrapper.style.height = 80 %

  // ensure parent has perspective (important for 3D)
  // gsap.set(container, { perspective: 900 });

  gsap.set(introTitles, {
    transformOrigin: "center center",
    rotationY: -90,         // start closed (rotate away)
    rotationZ: 15,
    opacity: 0,
    transformStyle: "preserve-3d",
    WebkitMaskSize: "0% 100%",
    maskSize: "0% 100%",
    backfaceVisibility: "hidden",
  })

  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: introContainer,
      start: "top 80%",
      end: "+=100%",
      scrub: true,
      // markers: true
    }
  })
  tl1.to(introTitles, {
    rotationY: 0,
    rotationZ: 0,
    opacity: 1,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    stagger: {
      each: 0.2,
      onComplete: function () {
        // Create a mini timeline for each element
        // let mtl1 = gsap.timeline();
        const el = this._targets[0];
        console.log("el", el)

        gsap.to(el, {
          rotationY: 320,
          rotationX: 20,
          // ease: "none",
          scrollTrigger: {
            trigger: el,
            start: `top 40%`, // shifted per element
            end: "+=400%",
            scrub: true,
            // markers: true
          }
        });
      }
    },
    ease: "power2.out",
  })

  // initial state: hinge at left, rotated away, hidden
  gsap.set(titles, {
    transformOrigin: "center center",
    rotationY: -90,         // start closed (rotate away)
    rotationZ: 15,
    opacity: 0,
    transformStyle: "preserve-3d",
    WebkitMaskSize: "0% 100%",
    maskSize: "0% 100%",
    backfaceVisibility: "hidden",
  });
  gsap.set(".video-placeholder", {
    transformOrigin: "right center",
    y: 250,
    rotationY: 95,
    rotationZ: -5,
    opacity: 1,
    transformStyle: "preserve-3d",
  });

  // animate lines in with stagger while the section is pinned
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".interview",
      start: "top 80%",   // animation starts when trigger reaches center of screen
      end: "+=100%",       // how long the scroll controls the animation
      scrub: true,
      // markers: true
    }
  });

  // Step 1: Reveal text with flip-in animation
  tl.to(titles, {
    rotationY: 0,
    rotationZ: 0,
    opacity: 1,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    stagger: 0.4,
    ease: "power2.out",
  })
    .to(videoWrapper, {
      rotationY: 20,
      rotationZ: 0,
      y: 40,
      // duration: 2
      // ease: "expoScale(0.5,7,none)"
    }, "<80%")
    .to(container, {
      rotationY: 10,
      ease: "power2.inOut",
      // duration: 1
    })
    .to(videoWrapper, {
      rotationY: 25,
      // ease: "expoScale(0.5,7,none)",
      y: -300
    }, "<95%")
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
      // if (this.type === "BLOCKER") this._createTextBlock();
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