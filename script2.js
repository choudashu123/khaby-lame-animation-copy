gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
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
      markers: true
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


});
