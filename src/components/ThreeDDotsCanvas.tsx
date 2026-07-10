/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = `
  #define PI 3.141592653589793
  #define PI2 6.283185307179586
  #define PHI 1.618033988749

  attribute float aIndex;
  attribute float aSize;
  attribute float aPhase;

  uniform float uCount;
  uniform float uFormA;
  uniform float uFormB;
  uniform float uMix;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uMouseRadius;
  uniform float uPointSize;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uScrollVel;

  varying vec3 vColor;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n + 0.1) * 43758.5453); }

  vec3 formSphere(float i, float n) {
      float p = acos(1.0 - 2.0 * (i + 0.5) / n);
      float t = PI2 * PHI * i;
      float r = 2.8 + hash(i * 6.7) * 0.4;
      return r * vec3(sin(p)*cos(t), sin(p)*sin(t), cos(p));
  }
  vec3 formHelix(float i, float n) {
      float t = i / n * PI2 * 4.0;
      float s = floor(mod(i, 3.0));
      float r = 1.2 + hash(i * 3.1) * 0.3;
      return vec3(r * cos(t + s * PI2 / 3.0), (i/n - 0.5) * 7.0, r * sin(t + s * PI2 / 3.0));
  }
  vec3 formGrid(float i, float n) {
      float side = ceil(sqrt(n));
      float x = (mod(i, side) / side - 0.5) * 7.0;
      float z = (floor(i / side) / side - 0.5) * 7.0;
      return vec3(x, sin(x * 1.2 + z * 0.8) * cos(z) * 0.6, z);
  }
  vec3 formTorus(float i, float n) {
      float t = i / n * PI2;
      float R = 2.2, r = 0.8 + hash(i * 2.9) * 0.2;
      return vec3((R + r * cos(3.0*t)) * cos(2.0*t), (R + r * cos(3.0*t)) * sin(2.0*t), r * sin(3.0*t));
  }
  vec3 formGalaxy(float i, float n) {
      float arm = floor(mod(i, 4.0));
      float t = i / n;
      float r = pow(t, 0.5) * 3.5;
      float a = t * 12.0 + arm * PI2 / 4.0;
      float sc = hash(i * 5.1) * 0.4;
      return vec3(r*cos(a)+(hash(i*2.3)-0.5)*sc, (hash(i*8.7)-0.5)*0.3, r*sin(a)+(hash(i*4.1)-0.5)*sc);
  }
  vec3 formVortex(float i, float n) {
      float t = i / n;
      float a = t * PI2 * 8.0;
      float r = (1.0 - t) * 3.5;
      return vec3(r * cos(a), (t - 0.5) * 5.0, r * sin(a));
  }
  vec3 getForm(float id, float i, float n) {
      if (id < 0.5) return formSphere(i, n);
      if (id < 1.5) return formHelix(i, n);
      if (id < 2.5) return formGrid(i, n);
      if (id < 3.5) return formTorus(i, n);
      if (id < 4.5) return formGalaxy(i, n);
      return formVortex(i, n);
  }

  void main() {
      vec3 posA = getForm(uFormA, aIndex, uCount);
      vec3 posB = getForm(uFormB, aIndex, uCount);
      float t = uMix * uMix * (3.0 - 2.0 * uMix);
      vec3 pos = mix(posA, posB, t);

      pos += vec3(sin(uTime*0.5+aPhase*PI2)*0.1, cos(uTime*0.4+aPhase*4.17)*0.1, sin(uTime*0.3+aPhase*5.03)*0.1);

      float vel = min(uScrollVel, 3.0);
      pos += vec3(sin(aPhase*20.0+uTime*2.0), cos(aPhase*15.0+uTime*1.5), sin(aPhase*25.0+uTime*1.8)) * vel * 0.06;

      vec3 diff = pos - uMouse;
      float dist = length(diff);
      if (dist < uMouseRadius && dist > 0.001) {
          float f = 1.0 - dist / uMouseRadius;
          pos += normalize(diff) * f * f * f * 1.0;
      }

      vColor = mix(uColorA, uColorB, t) * (0.7 + hash(aIndex * 7.3) * 0.3);
      if (dist < uMouseRadius) vColor += (1.0 - dist/uMouseRadius) * 0.2;
      vAlpha = 0.45 + aSize * 0.22 + min(vel, 2.0) * 0.06;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = clamp(aSize * uPointSize * (80.0 / -mv.z), 0.8, 22.0);
      gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float a = (1.0 - smoothstep(0.3, 0.5, d)) * vAlpha;
      gl_FragColor = vec4(vColor, a);
  }
`;

const kf = [
  { s: 0.00, f: 0, z: 7,   r: 0.78, g: 1.0,  b: 0.0  },
  { s: 0.32, f: 0, z: 7,   r: 0.78, g: 1.0,  b: 0.0  }, // Kept as Sphere through the entire advantages section
  { s: 0.45, f: 1, z: 9,   r: 0.0,  g: 1.0,  b: 0.64 }, // 2nd animation (Helix) triggered below capabilities cards
  { s: 0.52, f: 1, z: 9,   r: 0.0,  g: 1.0,  b: 0.64 },
  { s: 0.64, f: 2, z: 8,   r: 0.94, g: 0.94, b: 0.96 }, // 3rd animation (Grid) triggered lower down (pricing/reviews)
  { s: 0.70, f: 2, z: 8,   r: 0.94, g: 0.94, b: 0.96 },
  { s: 0.80, f: 3, z: 7.5, r: 1.0,  g: 0.0,  b: 0.25 }, // 4th animation (Torus) triggered around authentication gate
  { s: 0.86, f: 3, z: 7.5, r: 1.0,  g: 0.0,  b: 0.25 },
  { s: 0.93, f: 4, z: 10,  r: 1.0,  g: 0.75, b: 0.0  }, // 5th animation (Galaxy)
  { s: 0.97, f: 4, z: 10,  r: 1.0,  g: 0.75, b: 0.0  },
  { s: 0.99, f: 5, z: 6,   r: 0.78, g: 1.0,  b: 0.0  }, // 6th animation (Vortex) at the absolute bottom
  { s: 1.00, f: 5, z: 6,   r: 0.78, g: 1.0,  b: 0.0  },
];

function getState(s: number) {
  let i = 0;
  while (i < kf.length - 1 && kf[i + 1].s <= s) i++;
  const a = kf[i];
  const b = kf[Math.min(i + 1, kf.length - 1)];
  const range = b.s - a.s;
  const t = range > 0 ? Math.max(0, Math.min(1, (s - a.s) / range)) : 0;
  return {
    fA: a.f, fB: b.f, mix: a.f === b.f ? 0 : t,
    z: a.z + (b.z - a.z) * t,
    rA: a.r, gA: a.g, bA: a.b,
    rB: b.r, gB: b.g, bB: b.b,
  };
}

export function ThreeDDotsCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ren: THREE.WebGLRenderer | null = null;
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.ShaderMaterial | null = null;
    let animationFrameId: number | null = null;

    let scroll = 0;
    let scrollVel = 0;
    let lastScrollY = window.scrollY;

    const mouseNDC = { x: -100, y: -100 };
    const mouse3D = new THREE.Vector3(100, 100, 100);
    const _v = new THREE.Vector3();
    const _d = new THREE.Vector3();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scroll = totalScrollHeight > 0 ? currentScrollY / totalScrollHeight : 0;
      scrollVel = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouseNDC.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchEnd = () => {
      mouseNDC.x = -100;
      mouseNDC.y = -100;
    };

    let cam: THREE.PerspectiveCamera | null = null;
    const resize = () => {
      if (!cam || !ren) return;
      const w = window.innerWidth, h = window.innerHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };

    try {
      const N = window.innerWidth < 769 ? 3000 : 6000;

      // Renderer
      ren = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
      ren.setSize(window.innerWidth, window.innerHeight);
      ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      ren.setClearColor(0x000000, 0.0);

      // Camera
      cam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      cam.position.set(0, 0, 7);
      let targetZ = 7;

      // Scene
      const scene = new THREE.Scene();

      // Particles
      geo = new THREE.BufferGeometry();
      const idx = new Float32Array(N);
      const sizes = new Float32Array(N);
      const phases = new Float32Array(N);
      for (let i = 0; i < N; i++) {
          idx[i] = i;
          sizes[i] = 0.4 + Math.random() * 1.0;
          phases[i] = Math.random();
      }
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      geo.setAttribute('aIndex', new THREE.BufferAttribute(idx, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

      mat = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms: {
              uCount: { value: N },
              uFormA: { value: 0 },
              uFormB: { value: 0 },
              uMix: { value: 0 },
              uTime: { value: 0 },
              uMouse: { value: new THREE.Vector3(100, 100, 100) },
              uMouseRadius: { value: 5.0 },
              uPointSize: { value: 1.2 },
              uColorA: { value: new THREE.Color(0.78, 1.0, 0.0) },
              uColorB: { value: new THREE.Color(0.78, 1.0, 0.0) },
              uScrollVel: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      scene.add(points);

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("resize", resize);

      // Animation Loop
      const renderLoop = () => {
        animationFrameId = requestAnimationFrame(renderLoop);
        if (!ren || !cam || !mat || !geo) return;
        const t = performance.now() * 0.001;
        const st = getState(scroll);
        const u = mat.uniforms;

        u.uFormA.value = st.fA;
        u.uFormB.value = st.fB;
        u.uMix.value = st.mix;
        u.uTime.value = t;
        u.uScrollVel.value += (Math.abs(scrollVel) - u.uScrollVel.value) * 0.1;
        u.uColorA.value.setRGB(st.rA, st.gA, st.bA);
        u.uColorB.value.setRGB(st.rB, st.gB, st.bB);

        // Reset scrollVel back to 0 slowly
        scrollVel *= 0.9;

        /* Unproject mouse to z=0 plane */
        _v.set(mouseNDC.x, mouseNDC.y, 0.5).unproject(cam);
        _d.copy(_v).sub(cam.position).normalize();
        const distance = -cam.position.z / _d.z;
        mouse3D.copy(cam.position).addScaledVector(_d, distance);
        u.uMouse.value.lerp(mouse3D, 0.05);

        /* Camera parallax + zoom */
        targetZ += (st.z - targetZ) * 0.04;
        const mx = Math.max(-1, Math.min(1, mouseNDC.x));
        const my = Math.max(-1, Math.min(1, mouseNDC.y));
        cam.position.x += (mx * 0.4 - cam.position.x) * 0.02;
        cam.position.y += (my * 0.25 - cam.position.y) * 0.02;
        cam.position.z += (targetZ - cam.position.z) * 0.04;
        cam.lookAt(0, 0, 0);

        ren.render(scene, cam);
      };

      renderLoop();
    } catch (e) {
      console.warn("ThreeDDotsCanvas failed to initialize WebGL context:", e);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", resize);
      if (ren) ren.dispose();
      if (geo) geo.dispose();
      if (mat) mat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,6,6,0.45)_100%)]" />
    </div>
  );
}
