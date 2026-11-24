// Procedural Three.js 3D Scene - House No. 121 & Animated Couple
// Preserves custom architectural modeling and stylized couple characters faithfully
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    // =========================================================================
    // 1. PROCEDURAL HTML5 CANVAS TEXTURE GENERATORS
    // =========================================================================

    /**
     * Generates a rich, high-resolution Victorian terracotta/red brick texture
     * with staggered stretcher bond, light mortar joints, weathered dark accent
     * bricks, and matching bump and roughness maps.
     */
    function createBrickTextures(repeatX = 1.0, repeatY = 1.0) {
      const w = 1024;
      const h = 1024;
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = w;
      colorCanvas.height = h;
      const ctx = colorCanvas.getContext('2d');

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = w;
      bumpCanvas.height = h;
      const bctx = bumpCanvas.getContext('2d');

      const roughCanvas = document.createElement('canvas');
      roughCanvas.width = w;
      roughCanvas.height = h;
      const rctx = roughCanvas.getContext('2d');

      // Base warm light mortar
      ctx.fillStyle = '#c8bca9';
      ctx.fillRect(0, 0, w, h);
      bctx.fillStyle = '#363636';
      bctx.fillRect(0, 0, w, h);
      rctx.fillStyle = '#ececec';
      rctx.fillRect(0, 0, w, h);

      // Subtle mortar sand grain
      for (let i = 0; i < 4000; i++) {
        const mx = Math.random() * w;
        const my = Math.random() * h;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90,80,68,0.16)' : 'rgba(240,234,222,0.16)';
        ctx.fillRect(mx, my, 2, 2);
      }

      const rows = 28;
      const cols = 10;
      const rowH = h / rows;
      const colW = w / cols;
      const mortarX = 5;
      const mortarY = 4.5;

      // Deterministic PRNG for consistent brickwork
      let seed = 12142;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const palette = [
        [184, 84, 52],   // classic warm terracotta
        [170, 74, 46],   // deeper red-orange brick
        [196, 98, 62],   // sunlit clay brick
        [152, 72, 48],   // aged brownish red
        [182, 95, 58],   // warm sienna brick
        [136, 68, 48],   // darker weathered brick
        [68, 56, 48],    // occasional dark charcoal/soot accent brick
      ];

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (colW * 0.5);
        for (let c = -1; c <= cols; c++) {
          const x = c * colW + offset + mortarX * 0.5;
          const y = r * rowH + mortarY * 0.5;
          const bw = colW - mortarX;
          const bh = rowH - mortarY;

          const pRoll = rand();
          const base = pRoll > 0.91 ? palette[6] : palette[Math.floor(rand() * 6)];
          const dr = (rand() - 0.5) * 18;
          const dg = (rand() - 0.5) * 14;
          const db = (rand() - 0.5) * 12;

          const rr = Math.min(255, Math.max(25, Math.round(base[0] + dr)));
          const gg = Math.min(255, Math.max(20, Math.round(base[1] + dg)));
          const bb = Math.min(255, Math.max(18, Math.round(base[2] + db)));

          const grad = ctx.createLinearGradient(x, y, x, y + bh);
          grad.addColorStop(0, `rgb(${Math.min(255, rr + 12)},${Math.min(255, gg + 10)},${Math.min(255, bb + 8)})`);
          grad.addColorStop(0.55, `rgb(${rr},${gg},${bb})`);
          grad.addColorStop(1, `rgb(${Math.max(0, rr - 18)},${Math.max(0, gg - 14)},${Math.max(0, bb - 12)})`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, bw, bh, 3);
          ctx.fill();

          for (let s = 0; s < 14; s++) {
            const sx = x + rand() * bw;
            const sy = y + rand() * bh;
            const sw = 3 + rand() * 9;
            const sh = 2 + rand() * 5;
            ctx.fillStyle = rand() > 0.5 ? 'rgba(255,220,190,0.08)' : 'rgba(40,20,10,0.12)';
            ctx.fillRect(sx, sy, sw, sh);
          }

          const bVal = Math.round(185 + rand() * 55);
          bctx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
          bctx.beginPath();
          bctx.roundRect(x + 1, y + 1, bw - 2, bh - 2, 3);
          bctx.fill();

          const rVal = Math.round(165 + rand() * 40);
          rctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
          rctx.fillRect(x, y, bw, bh);
        }
      }

      const setupTex = (canvas, isColor) => {
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.anisotropy = 8;
        if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };

      return {
        map: setupTex(colorCanvas, true),
        bumpMap: setupTex(bumpCanvas, false),
        roughnessMap: setupTex(roughCanvas, false),
      };
    }

    /**
     * Generates dark grey overlapping slate roof tile color & bump textures.
     */
    function createSlateRoofTextures(repeatX = 2.4, repeatY = 1.5) {
      const w = 1024;
      const h = 1024;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      const bc = document.createElement('canvas');
      bc.width = w;
      bc.height = h;
      const bctx = bc.getContext('2d');

      ctx.fillStyle = '#2c3037';
      ctx.fillRect(0, 0, w, h);
      bctx.fillStyle = '#222';
      bctx.fillRect(0, 0, w, h);

      const rows = 14;
      const cols = 10;
      const rh = h / rows;
      const cw = w / cols;

      let seed = 8841;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (cw * 0.5);
        for (let col = -1; col <= cols; col++) {
          const x = col * cw + off;
          const y = r * rh;
          const v = 56 + Math.floor(rand() * 24);
          const blueTint = Math.floor(rand() * 12);

          const grad = ctx.createLinearGradient(x, y, x, y + rh);
          grad.addColorStop(0, `rgb(${v + 8},${v + 10},${v + 16 + blueTint})`);
          grad.addColorStop(0.85, `rgb(${v},${v + 2},${v + 7 + blueTint})`);
          grad.addColorStop(1, `rgb(${v - 18},${v - 17},${v - 14})`);

          ctx.fillStyle = grad;
          ctx.fillRect(x + 2, y + 1, cw - 4, rh - 2);

          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(x + 2, y + 2, cw - 4, 3);
          ctx.fillStyle = 'rgba(10,12,16,0.45)';
          ctx.fillRect(x + 2, y + rh - 4, cw - 4, 4);

          const bg = bctx.createLinearGradient(x, y, x, y + rh);
          bg.addColorStop(0, '#999');
          bg.addColorStop(0.85, '#eee');
          bg.addColorStop(1, '#202020');
          bctx.fillStyle = bg;
          bctx.fillRect(x + 2, y + 1, cw - 4, rh - 2);
        }
      }

      const map = new THREE.CanvasTexture(c);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repeatX, repeatY);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;

      const bumpMap = new THREE.CanvasTexture(bc);
      bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
      bumpMap.repeat.set(repeatX, repeatY);
      bumpMap.anisotropy = 8;

      return { map, bumpMap };
    }

    /**
     * Generates warm tan/beige pebble-dash stucco texture for the right neighbor's upper story.
     */
    function createPebbleDashTextures(repeatX = 2.2, repeatY = 1.2) {
      const w = 512;
      const h = 512;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      const bc = document.createElement('canvas');
      bc.width = w;
      bc.height = h;
      const bctx = bc.getContext('2d');

      ctx.fillStyle = '#c8b69b';
      ctx.fillRect(0, 0, w, h);
      bctx.fillStyle = '#707070';
      bctx.fillRect(0, 0, w, h);

      let seed = 9931;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < 16000; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 1.2 + rand() * 2.6;
        const tone = rand();
        if (tone < 0.33) ctx.fillStyle = '#dfd1ba';
        else if (tone < 0.66) ctx.fillStyle = '#b4a083';
        else if (tone < 0.88) ctx.fillStyle = '#978368';
        else ctx.fillStyle = '#7b6a54';

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        const bv = Math.floor(100 + rand() * 155);
        bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
        bctx.beginPath();
        bctx.arc(px, py, pr, 0, Math.PI * 2);
        bctx.fill();
      }

      const map = new THREE.CanvasTexture(c);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repeatX, repeatY);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;

      const bumpMap = new THREE.CanvasTexture(bc);
      bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
      bumpMap.repeat.set(repeatX, repeatY);
      return { map, bumpMap };
    }

    /**
     * Generates smooth weathered grey stucco for the dormer & speckled stone for lintels.
     */
    function createStoneStuccoTexture(baseHex = '#9e978e', speckleStrength = 1.0) {
      const w = 256;
      const h = 256;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);

      let seed = 4231;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < 4500; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = 1 + rand() * 2.5;
        const a = (0.04 + rand() * 0.1) * speckleStrength;
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,250,240,${a})` : `rgba(45,40,35,${a})`;
        ctx.fillRect(x, y, s, s);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    /**
     * Generates paved concrete sidewalk slab texture with seams & subtle weathering.
     */
    function createSidewalkTextures() {
      const w = 1024;
      const h = 512;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      const bc = document.createElement('canvas');
      bc.width = w;
      bc.height = h;
      const bctx = bc.getContext('2d');

      ctx.fillStyle = '#c4bab0';
      ctx.fillRect(0, 0, w, h);
      bctx.fillStyle = '#d0d0d0';
      bctx.fillRect(0, 0, w, h);

      const cols = 6;
      const rows = 2;
      const cw = w / cols;
      const rh = h / rows;

      let seed = 5502;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const shift = Math.floor((rand() - 0.5) * 18);
          ctx.fillStyle = `rgb(${194 + shift},${185 + shift},${174 + shift})`;
          ctx.fillRect(col * cw + 3, r * rh + 3, cw - 6, rh - 6);
        }
      }

      for (let i = 0; i < 12000; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(60,55,48,0.09)';
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.strokeStyle = '#7c746b';
      ctx.lineWidth = 4;
      bctx.strokeStyle = '#202020';
      bctx.lineWidth = 6;

      for (let col = 0; col <= cols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * cw, 0);
        ctx.lineTo(col * cw, h);
        ctx.stroke();
        bctx.beginPath();
        bctx.moveTo(col * cw, 0);
        bctx.lineTo(col * cw, h);
        bctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rh);
        ctx.lineTo(w, r * rh);
        ctx.stroke();
        bctx.beginPath();
        bctx.moveTo(0, r * rh);
        bctx.lineTo(w, r * rh);
        bctx.stroke();
      }

      const map = new THREE.CanvasTexture(c);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(3, 1);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;

      const bumpMap = new THREE.CanvasTexture(bc);
      bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
      bumpMap.repeat.set(3, 1);
      return { map, bumpMap };
    }

    /**
     * Generates a red diamond plaque texture (for "121", "120", or plain decorative diamond).
     */
    function createDiamondPlaqueTexture(numberText = '') {
      const s = 256;
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      const ctx = c.getContext('2d');

      ctx.clearRect(0, 0, s, s);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s / 2, 10);
      ctx.lineTo(s - 10, s / 2);
      ctx.lineTo(s / 2, s - 10);
      ctx.lineTo(10, s / 2);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, s, s);
      grad.addColorStop(0, '#c74c39');
      grad.addColorStop(1, '#983223');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 7;
      ctx.strokeStyle = '#e8dfd2';
      ctx.stroke();
      ctx.restore();

      if (numberText) {
        ctx.fillStyle = '#fff9ee';
        ctx.font = 'bold 74px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 4;
        ctx.fillText(numberText, s / 2, s / 2 + 4);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    /**
     * Generates crisp "SACRE COEUR" house name plaque texture.
     */
    function createHouseNamePlaqueTexture() {
      const w = 512;
      const h = 160;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      ctx.fillStyle = '#181a1f';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#e5dcc8';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SACRE COEUR', w / 2, h / 2 + 3);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    /**
     * Generates red security alarm box faceplate texture (with subtle emblem & blue strobe detail).
     */
    function createAlarmBoxTexture() {
      const w = 256;
      const h = 340;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#dc3d2d');
      grad.addColorStop(1, '#b6281c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stylized dark emblem silhouette
      ctx.fillStyle = '#5c120b';
      ctx.beginPath();
      ctx.moveTo(128, 88);
      ctx.quadraticCurveTo(155, 65, 168, 72);
      ctx.quadraticCurveTo(148, 102, 134, 118);
      ctx.quadraticCurveTo(118, 122, 92, 95);
      ctx.quadraticCurveTo(114, 96, 128, 88);
      ctx.fill();

      ctx.fillStyle = '#2d0c09';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('E.A.S.S.', 128, 168);

      ctx.fillStyle = '#234a8c';
      ctx.beginPath();
      ctx.roundRect(46, 206, 164, 56, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 4;
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    /**
     * Generates front decal textures for the Green, Red ("GLASS ONLY"), and Blue wheelie bins.
     */
    function createBinDecalTexture(type) {
      const w = 256;
      const h = 256;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';

      if (type === 'glass') {
        ctx.font = '700 44px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GLASS', w / 2, h / 2 - 22);
        ctx.fillText('ONLY', w / 2, h / 2 + 28);
      } else {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(w / 2 - 48, h / 2 - 8, 22, 0.4, Math.PI * 1.65);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w / 2 - 34, h / 2 - 28);
        ctx.lineTo(w / 2 - 22, h / 2 - 20);
        ctx.lineTo(w / 2 - 38, h / 2 - 12);
        ctx.closePath();
        ctx.fill();

        ctx.font = '700 22px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(type === 'green' ? 'RECYCLE' : 'WASTE', w / 2 - 14, h / 2 - 12);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(w / 2 - 14, h / 2 + 6, 86, 4);
        ctx.fillRect(w / 2 - 14, h / 2 + 16, 62, 3);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    /**
     * Generates a soft radial glow sprite texture for the porch lantern at dusk.
     */
    function createGlowSpriteTexture() {
      const s = 128;
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255, 225, 145, 1.0)');
      g.addColorStop(0.35, 'rgba(255, 180, 75, 0.55)');
      g.addColorStop(1, 'rgba(255, 140, 40, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    /**
     * Generates a delicate woven fabric texture with subtle vertical fold shading
     * for 3D pleated sheer net curtains and softly parted side drapes.
     */
    function createCurtainFabricTexture(isSheer = false) {
      const w = 256;
      const h = 256;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');

      ctx.fillStyle = isSheer ? '#faf8f2' : '#f2ece1';
      ctx.fillRect(0, 0, w, h);

      // Subtle vertical pleat tonal bands to enhance 3D fold depth
      const bands = isSheer ? 14 : 8;
      for (let x = 0; x < w; x++) {
        const wave = Math.sin((x / w) * bands * Math.PI * 2);
        const shade = wave * 0.5 + 0.5;
        const alpha = isSheer ? 0.065 * (1 - shade) : 0.11 * (1 - shade);
        ctx.fillStyle = `rgba(115, 104, 92, ${alpha})`;
        ctx.fillRect(x, 0, 1, h);
      }

      // Fine linen/net cross-weave grain
      ctx.fillStyle = isSheer ? 'rgba(255,255,255,0.22)' : 'rgba(255,252,245,0.14)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.fillStyle = isSheer ? 'rgba(130,122,110,0.06)' : 'rgba(110,98,85,0.07)';
      for (let x = 0; x < w; x += 4) {
        ctx.fillRect(x, 0, 1, h);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    }

    /**
     * Generates a subtle diagonal sky-and-sun reflection sheen overlay for window glass
     * so panes read immediately as crisp glossy glass even from straight-on front views.
     */
    function createGlassSheenTexture() {
      const w = 512;
      const h = 512;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      // Soft sky gradient wash at upper half
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0.0, 'rgba(205, 234, 255, 0.24)');
      skyGrad.addColorStop(0.45, 'rgba(220, 240, 255, 0.08)');
      skyGrad.addColorStop(1.0, 'rgba(180, 210, 235, 0.02)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Crisp soft diagonal specular reflection streaks
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(-Math.PI * 0.24);

      const streak1 = ctx.createLinearGradient(-w, 0, w, 0);
      streak1.addColorStop(0.28, 'rgba(255, 255, 255, 0.0)');
      streak1.addColorStop(0.36, 'rgba(255, 255, 255, 0.34)');
      streak1.addColorStop(0.43, 'rgba(255, 255, 255, 0.08)');
      streak1.addColorStop(0.49, 'rgba(255, 255, 255, 0.22)');
      streak1.addColorStop(0.55, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = streak1;
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    /**
     * Generates a procedural sky-and-clouds environment map via THREE.PMREMGenerator
     * so all MeshPhysicalMaterial glass panes reflect bright sky, clouds, and horizon.
     */
    function createSkyEnvironmentMap(renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();

      const envScene = new THREE.Scene();

      // Sky dome with vibrant blue zenith, soft sunlit horizon, and muted street ground below
      const envSkyGeo = new THREE.SphereGeometry(40, 32, 24);
      const envSkyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vDir;
          void main() {
            float y = vDir.y;
            vec3 ground = vec3(0.42, 0.38, 0.35);
            vec3 horizon = vec3(0.95, 0.89, 0.80);
            vec3 midSky = vec3(0.45, 0.72, 0.96);
            vec3 zenith = vec3(0.18, 0.48, 0.84);
            vec3 col = y < 0.0
              ? mix(horizon, ground, smoothstep(0.0, -0.35, y))
              : mix(horizon, midSky, smoothstep(0.0, 0.28, y));
            if (y > 0.0) {
              col = mix(col, zenith, smoothstep(0.24, 0.85, y));
            }
            // Bright warm afternoon sun disc in front-left sky for crisp glass highlights
            vec3 sunDir = normalize(vec3(-0.52, 0.46, 0.72));
            float sunDot = max(dot(vDir, sunDir), 0.0);
            col += vec3(1.0, 0.95, 0.82) * pow(sunDot, 28.0) * 1.4;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      envScene.add(new THREE.Mesh(envSkyGeo, envSkyMat));

      // Bright fluffy cloud clusters positioned in front of the house so front windows reflect them!
      const envCloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cloudSpots = [
        [-10, 9, 22, 4.2],
        [4, 12, 24, 5.0],
        [15, 7, 19, 3.8],
        [-18, 6, 14, 3.5],
        [-2, 16, 16, 4.6],
        [11, 14, 15, 4.0],
        [-12, 14, -14, 4.5],
        [12, 10, -18, 4.2],
      ];
      const puffGeo = new THREE.SphereGeometry(1, 12, 10);
      for (const [cx, cy, cz, cs] of cloudSpots) {
        const g = new THREE.Group();
        g.position.set(cx, cy, cz);
        const offsets = [[0, 0, 0, 1.0], [-0.9, -0.15, 0.1, 0.78], [0.95, -0.1, -0.05, 0.82], [0.2, 0.4, 0, 0.72]];
        for (const [ox, oy, oz, os] of offsets) {
          const p = new THREE.Mesh(puffGeo, envCloudMat);
          p.position.set(ox * cs, oy * cs, oz * cs);
          p.scale.set(os * cs * 1.2, os * cs * 0.72, os * cs * 0.85);
          g.add(p);
        }
        envScene.add(g);
      }

      const rt = pmrem.fromScene(envScene, 0.015);
      pmrem.dispose();
      envSkyGeo.dispose();
      envSkyMat.dispose();
      puffGeo.dispose();
      envCloudMat.dispose();
      return rt.texture;
    }


// =========================================================================
// 2. SCENE INSTANTIATION & LIFECYCLE CONTROLLER
// =========================================================================
export function createHouseNo121Scene(container, options = {}) {
  if (!container) {
    throw new Error('HouseNo121Scene: container element is required');
  }

  const initialWidth = container.clientWidth || 800;
  const initialHeight = container.clientHeight || 450;

  // Renderer Setup
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(initialWidth, initialHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  // Scene & Fog
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x9ec5e6, 0.011);
  scene.environment = createSkyEnvironmentMap(renderer);

  // Camera
  const camera = new THREE.PerspectiveCamera(38, initialWidth / initialHeight, 0.1, 160);
  camera.position.set(0.05, 3.15, 11.4);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.05, 2.55, 0.0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI * 0.492;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.minDistance = 2.0;
  controls.maxDistance = 21.0;
  controls.maxAzimuthAngle = Math.PI * 0.47;
  controls.minAzimuthAngle = -Math.PI * 0.47;

  // Selective gesture control:
  // Desktop: Only rotate/zoom when Ctrl/Cmd is held (prevents hijacking mouse wheel page scroll)
  // Mobile: Only two-finger gestures (pinch/pan/orbit) change the 3D model; 1-finger scrolls page smoothly
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.touches = {
    ONE: null, // No single-finger rotate or pan on touch devices; permits natural page scrolling!
    TWO: THREE.TOUCH.DOLLY_PAN, // Two fingers pinch to zoom & drag to pan/orbit
  };
  renderer.domElement.style.touchAction = 'pan-y';
  controls.update();

      // 3. SKY DOME, STARS & LIGHTING RIG
      // =======================================================================
      const skyUniforms = {
        topColor: { value: new THREE.Color('#3b82c4') },
        midColor: { value: new THREE.Color('#7db4e2') },
        bottomColor: { value: new THREE.Color('#f6dfc4') },
      };

      const skyGeo = new THREE.SphereGeometry(75, 32, 24);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPos;
          void main() {
            float h = normalize(vWorldPos).y;
            vec3 col = mix(bottomColor, midColor, smoothstep(-0.05, 0.28, h));
            col = mix(col, topColor, smoothstep(0.24, 0.82, h));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      const skyDome = new THREE.Mesh(skyGeo, skyMat);
      scene.add(skyDome);

      // Subtle Twinkling Stars (visible in Cozy Dusk mode)
      const starCount = 260;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.42;
        const r = 64;
        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.cos(phi) + 4;
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xfff6dc,
        size: 0.42,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
      const starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);

      // Lights
      const hemiLight = new THREE.HemisphereLight(0xcde4ff, 0x8f6b54, 0.92);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xffe7c2, 2.35);
      sunLight.position.set(-9.5, 11.5, 9.2);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 36;
      sunLight.shadow.camera.left = -10.5;
      sunLight.shadow.camera.right = 10.5;
      sunLight.shadow.camera.top = 10;
      sunLight.shadow.camera.bottom = -3;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
      scene.add(sunLight);

      // Soft warm bounce light from sidewalk/front-right
      const bounceLight = new THREE.DirectionalLight(0xffddb8, 0.42);
      bounceLight.position.set(7, 3.5, 8);
      scene.add(bounceLight);

      const duskGlowMaterials = [];
      const duskCurtainMaterials = [];
      const glassSheenMaterials = [];
      const lanternPointLight = new THREE.PointLight(0xffb552, 0.0, 7.5, 1.8);
      let lanternGlowSprite = null;
      let alarmLedMat = null;

      // =======================================================================
      // 4. SHARED MATERIALS & ARCHITECTURAL HELPERS
      // =======================================================================
      // Brick material with repeat (1,1) because createBrickBlock assigns world-scale UVs
      const brickTex = createBrickTextures(1.0, 1.0);
      const brickMat = new THREE.MeshStandardMaterial({
        map: brickTex.map,
        bumpMap: brickTex.bumpMap,
        bumpScale: 0.045,
        roughnessMap: brickTex.roughnessMap,
        roughness: 0.88,
        metalness: 0.02,
      });

      const slateTex = createSlateRoofTextures(2.3, 1.45);
      const slateMat = new THREE.MeshStandardMaterial({
        map: slateTex.map,
        bumpMap: slateTex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.72,
        metalness: 0.08,
      });

      const slate120Tex = createSlateRoofTextures(1.9, 1.45);
      const slate120Mat = new THREE.MeshStandardMaterial({
        map: slate120Tex.map,
        bumpMap: slate120Tex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.72,
        metalness: 0.08,
      });

      const pebbleTex = createPebbleDashTextures(2.2, 1.15);
      const pebbleMat = new THREE.MeshStandardMaterial({
        map: pebbleTex.map,
        bumpMap: pebbleTex.bumpMap,
        bumpScale: 0.06,
        roughness: 0.92,
      });

      const dormerStuccoMat = new THREE.MeshStandardMaterial({
        map: createStoneStuccoTexture('#989088', 0.85),
        roughness: 0.88,
      });

      const stoneLintelMat = new THREE.MeshStandardMaterial({
        map: createStoneStuccoTexture('#cfc5b5', 1.35),
        roughness: 0.86,
      });

      const whitePvcMat = new THREE.MeshStandardMaterial({
        color: 0xf6f6f4,
        roughness: 0.34,
        metalness: 0.04,
      });

      const offWhiteTrimMat = new THREE.MeshStandardMaterial({
        color: 0xebeae4,
        roughness: 0.45,
      });

      const blackMetalMat = new THREE.MeshStandardMaterial({
        color: 0x24262b,
        roughness: 0.45,
        metalness: 0.32,
      });

      const darkTrimMat = new THREE.MeshStandardMaterial({
        color: 0x3b3532,
        roughness: 0.65,
      });

      const brownPipeMat = new THREE.MeshStandardMaterial({
        color: 0x62534a,
        roughness: 0.52,
        metalness: 0.15,
      });

      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd6b05e,
        roughness: 0.28,
        metalness: 0.78,
      });

      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xd8dce0,
        roughness: 0.28,
        metalness: 0.7,
      });

      // Realistic Glossy Reflective Window Glass (reflects procedural sky & clouds via scene.environment)
      const windowGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xcce4f5,
        transparent: true,
        opacity: 0.30,
        roughness: 0.05,
        metalness: 0.08,
        reflectivity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.8,
        depthWrite: false,
      });

      // Subtle diagonal specular sky-reflection sheen overlay for crisp front-on glass readability
      const glassSheenTex = createGlassSheenTexture();

      // Distinct Frosted/Etched Translucent Door Glass (House 121 & 120 front doors)
      const frostedGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2ecf2,
        roughness: 0.45,
        metalness: 0.02,
        clearcoat: 0.6,
        clearcoatRoughness: 0.22,
        transparent: true,
        opacity: 0.78,
        envMapIntensity: 1.1,
        depthWrite: false,
      });

      const sheerFabricTex = createCurtainFabricTexture(true);
      const drapeFabricTex = createCurtainFabricTexture(false);

      const innerCasingMat = new THREE.MeshStandardMaterial({
        color: 0xe6e3dc,
        roughness: 0.68,
      });

      const curtainRailMat = new THREE.MeshStandardMaterial({
        color: 0xb9b4aa,
        roughness: 0.35,
        metalness: 0.65,
      });

      const terracottaMat = new THREE.MeshStandardMaterial({
        color: 0xb95f3c,
        roughness: 0.78,
      });

      /**
       * Creates a BoxGeometry with consistent world-space UV coordinates so brick or
       * pebble-dash courses align seamlessly around real hollow window & door openings.
       */
      function createWorldUVBlock(w, h, d, x, y, z, mat, scaleU = 0.42, scaleV = 0.45) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const nx = Math.abs(norm.getX(i));
          const ny = Math.abs(norm.getY(i));
          const px = pos.getX(i) + x;
          const py = pos.getY(i) + y;
          const pz = pos.getZ(i) + z;
          if (nx > 0.5) {
            uv.setXY(i, pz * scaleU, py * scaleV);
          } else if (ny > 0.5) {
            uv.setXY(i, px * scaleU, pz * scaleV);
          } else {
            uv.setXY(i, px * scaleU, py * scaleV);
          }
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      }

      function createBrickBlock(w, h, d, x, y, z, mat = brickMat) {
        return createWorldUVBlock(w, h, d, x, y, z, mat, 0.42, 0.45);
      }

      function createPebbleBlock(w, h, d, x, y, z, mat = pebbleMat) {
        return createWorldUVBlock(w, h, d, x, y, z, mat, 0.52, 0.52);
      }

      /**
       * Builds a genuinely hollow dormer shell with a real rectangular cut-out opening
       * on its front face so zero stucco geometry ever passes behind the dormer window!
       */
      function createHollowDormerShell({ width, height, depth, winW, winH, winOffsetX = 0, winOffsetY = 0, mat = dormerStuccoMat }) {
        const shell = new THREE.Group();
        const wallT = 0.16;
        const frontFaceZ = depth / 2;
        const frontMidZ = frontFaceZ - wallT / 2;

        // Cut-out opening bounds in local dormer X, Y
        const openLeft = winOffsetX - winW / 2;
        const openRight = winOffsetX + winW / 2;
        const openBottom = winOffsetY - winH / 2;
        const openTop = winOffsetY + winH / 2;

        // 1. Front wall surround (4 modular pieces framing the real hollow window opening)
        const leftW = openLeft - (-width / 2);
        if (leftW > 0.01) {
          const leftFront = new THREE.Mesh(new THREE.BoxGeometry(leftW, height, wallT), mat);
          leftFront.position.set(-width / 2 + leftW / 2, 0, frontMidZ);
          leftFront.castShadow = true;
          leftFront.receiveShadow = true;
          shell.add(leftFront);
        }

        const rightW = width / 2 - openRight;
        if (rightW > 0.01) {
          const rightFront = new THREE.Mesh(new THREE.BoxGeometry(rightW, height, wallT), mat);
          rightFront.position.set(openRight + rightW / 2, 0, frontMidZ);
          rightFront.castShadow = true;
          rightFront.receiveShadow = true;
          shell.add(rightFront);
        }

        const topH = height / 2 - openTop;
        if (topH > 0.01) {
          const topFront = new THREE.Mesh(new THREE.BoxGeometry(winW, topH, wallT), mat);
          topFront.position.set(winOffsetX, openTop + topH / 2, frontMidZ);
          topFront.castShadow = true;
          topFront.receiveShadow = true;
          shell.add(topFront);
        }

        const botH = openBottom - (-height / 2);
        if (botH > 0.01) {
          const botFront = new THREE.Mesh(new THREE.BoxGeometry(winW, botH, wallT), mat);
          botFront.position.set(winOffsetX, -height / 2 + botH / 2, frontMidZ);
          botFront.castShadow = true;
          botFront.receiveShadow = true;
          shell.add(botFront);
        }

        // 2. Left cheek wall, right cheek wall, back wall, ceiling & floor sealing the hollow shell
        const innerDepth = depth - wallT;
        const innerCenterZ = -wallT / 2;

        const leftSide = new THREE.Mesh(new THREE.BoxGeometry(wallT, height, innerDepth), mat);
        leftSide.position.set(-width / 2 + wallT / 2, 0, innerCenterZ);
        leftSide.castShadow = true;
        leftSide.receiveShadow = true;

        const rightSide = new THREE.Mesh(new THREE.BoxGeometry(wallT, height, innerDepth), mat);
        rightSide.position.set(width / 2 - wallT / 2, 0, innerCenterZ);
        rightSide.castShadow = true;
        rightSide.receiveShadow = true;

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallT), mat);
        backWall.position.set(0, 0, -depth / 2 + wallT / 2);
        backWall.castShadow = true;

        const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(width, wallT, innerDepth), mat);
        roofSlab.position.set(0, height / 2 - wallT / 2, innerCenterZ);
        roofSlab.castShadow = true;

        const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(width, wallT, innerDepth), mat);
        floorSlab.position.set(0, -height / 2 + wallT / 2, innerCenterZ);

        shell.add(leftSide, rightSide, backWall, roofSlab, floorSlab);
        return shell;
      }

      /**
       * Generates a genuine 3D pleated fabric curtain mesh using smooth sinusoidal
       * vertical folds so light and shadows visibly sculpt the drapery behind the glass.
       */
      function createPleatedCurtainMesh({
        width,
        height,
        pleats = 7,
        foldDepth = 0.032,
        phase = 0,
        sideSign = 0, // -1 left parted panel, +1 right parted panel, 0 full sheer net
        material,
      }) {
        const segX = Math.max(24, Math.round(pleats * 7));
        const segY = 10;
        const geo = new THREE.PlaneGeometry(width, height, segX, segY);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i);
          const y = pos.getY(i);
          const u = x / width + 0.5;          // 0 (left) -> 1 (right)
          const v = 0.5 - y / height;         // 0 (top)  -> 1 (bottom)

          // Smooth sinusoidal vertical folds
          const foldAmp = foldDepth * (0.78 + 0.34 * v);
          const z = Math.sin(u * pleats * Math.PI * 2 + phase) * foldAmp;

          // Subtle natural parted drape curve for left/right side curtains
          if (sideSign !== 0) {
            const innerEdgeWeight = sideSign < 0 ? u : (1 - u);
            // Gently pulled slightly toward outer wall in the middle, soft flare at bottom
            const curveShift = -sideSign * Math.sin(v * Math.PI) * 0.065 * innerEdgeWeight * width;
            x += curveShift;
          }

          pos.setXYZ(i, x, y, z);
        }

        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        return mesh;
      }

      /**
       * Builds a true deep recessed interior room box (side walls, ceiling, floor, back wall),
       * curtain rail, full-width 3D pleated sheer/net curtain, and softly parted 3D side drapes
       * strictly positioned cleanly behind the glass plane (zero overlap, zero Z-fighting).
       */
      function createRecessedRoomAndCurtains(width, height, roomDepth = 0.44) {
        const grp = new THREE.Group();

        // 1. Enclosed Interior Room Box (z from -0.20 to -(0.20 + roomDepth))
        // Darker warm-muted interior during daytime so glass reads with realistic depth,
        // lighting up with warm golden amber room glow in Cozy Dusk mode.
        const roomWallMat = new THREE.MeshStandardMaterial({
          color: 0x3b3530,
          emissive: 0xffa63d,
          emissiveIntensity: 0.0,
          roughness: 0.94,
        });
        const roomBackMat = new THREE.MeshStandardMaterial({
          color: 0x2c2723,
          emissive: 0xffb347,
          emissiveIntensity: 0.0,
          roughness: 0.92,
        });
        duskGlowMaterials.push(roomWallMat, roomBackMat);

        const roomFrontZ = -0.20;
        const roomBackZ = roomFrontZ - roomDepth;
        const roomMidZ = (roomFrontZ + roomBackZ) * 0.5;
        const rw = width + 0.08;
        const rh = height + 0.08;

        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), roomBackMat);
        backWall.position.set(0, 0, roomBackZ);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, rh), roomWallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-rw / 2, 0, roomMidZ);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, rh), roomWallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(rw / 2, 0, roomMidZ);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(rw, roomDepth), roomWallMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, rh / 2, roomMidZ);

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw, roomDepth), roomWallMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -rh / 2, roomMidZ);

        grp.add(backWall, leftWall, rightWall, ceiling, floor);

        // 2. Subtle Horizontal Curtain Rail tucked near top inside the recess (z = -0.17)
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, width * 0.98, 10),
          curtainRailMat
        );
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, height / 2 - 0.035, -0.17);
        grp.add(rail);

        // 3. Delicate 3D Pleated Sheer / Net Curtain spanning across all panes (z = -0.155)
        // Frontmost pleat crest is at -0.155 + 0.025 = -0.130 (well behind glass at z = -0.02!)
        const sheerMat = new THREE.MeshStandardMaterial({
          map: sheerFabricTex,
          color: 0xfbf9f3,
          emissive: 0xffc470,
          emissiveIntensity: 0.0,
          roughness: 0.90,
          metalness: 0.0,
          transparent: true,
          opacity: 0.74,
          side: THREE.DoubleSide,
        });
        duskCurtainMaterials.push(sheerMat);

        const sheerCurtain = createPleatedCurtainMesh({
          width: width * 0.98,
          height: height * 0.96,
          pleats: Math.max(8, Math.round(width * 6.5)),
          foldDepth: 0.022,
          phase: 0.4,
          sideSign: 0,
          material: sheerMat,
        });
        sheerCurtain.position.set(0, -0.01, -0.155);
        grp.add(sheerCurtain);

        // 4. Gently Parted 3D Pleated Side Curtain Panels framing Left & Right (z = -0.112)
        // Frontmost pleat crest is at -0.112 + 0.032 = -0.080 (6cm cleanly behind glass at z = -0.02!)
        const drapeMat = new THREE.MeshStandardMaterial({
          map: drapeFabricTex,
          color: 0xf4eee2,
          emissive: 0xffb75e,
          emissiveIntensity: 0.0,
          roughness: 0.88,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
        duskCurtainMaterials.push(drapeMat);

        const sidePanelW = width * 0.25;
        for (const side of [-1, 1]) {
          const sideDrape = createPleatedCurtainMesh({
            width: sidePanelW,
            height: height * 0.97,
            pleats: 4.5,
            foldDepth: 0.028,
            phase: side < 0 ? 0.2 : 1.7,
            sideSign: side,
            material: drapeMat,
          });
          sideDrape.position.set(side * (width / 2 - sidePanelW / 2 - 0.005), -0.01, -0.112);
          grp.add(sideDrape);
        }

        return grp;
      }

      /**
       * Builds a curved/beveled stone lintel with optional centered red diamond plaque.
       */
      function createStoneLintel(width, height, depth, plaqueNumber = '', includeDiamond = true) {
        const grp = new THREE.Group();

        const shape = new THREE.Shape();
        const hw = width / 2;
        shape.moveTo(-hw, 0);
        shape.lineTo(hw, 0);
        shape.lineTo(hw, height * 0.68);
        shape.quadraticCurveTo(0, height * 1.18, -hw, height * 0.68);
        shape.closePath();

        const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
          depth: depth,
          bevelEnabled: true,
          bevelThickness: 0.015,
          bevelSize: 0.014,
          bevelSegments: 2,
        });
        const lintelMesh = new THREE.Mesh(extrudeGeo, stoneLintelMat);
        lintelMesh.castShadow = true;
        lintelMesh.receiveShadow = true;
        grp.add(lintelMesh);

        if (includeDiamond) {
          const plaqueSize = height * 0.84;
          const plaqueTex = createDiamondPlaqueTexture(plaqueNumber);
          const plaqueMat = new THREE.MeshStandardMaterial({
            map: plaqueTex,
            transparent: true,
            roughness: 0.55,
          });
          const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(plaqueSize, plaqueSize), plaqueMat);
          plaqueMesh.position.set(0, height * 0.48, depth + 0.022);
          grp.add(plaqueMesh);
        }

        return grp;
      }

      /**
       * Builds a realistic recessed white uPVC window with:
       * - Inner reveal jamb casing framing the wall opening
       * - Deep enclosed interior room box & 3D pleated sheer + side curtains behind glass
       * - Glossy sky-reflecting MeshPhysicalMaterial glass pane + subtle diagonal sheen
       * - Crisp 3D white uPVC frame & muntin bars protruding cleanly in front of glass
       */
      function createDetailedWindow({
        width,
        height,
        cols = 3,
        rows = 3,
        hasTransom = true,
        transomRatio = 0.24,
        asymmetricDormer = false,
        revealDepth = 0.28,
      }) {
        const grp = new THREE.Group();
        const frameT = 0.065;
        const frameD = 0.11;

        // 1. Inner Reveal Jambs / Casing lining the recessed opening cleanly (z: +0.06 to -revealDepth)
        const revealMidZ = (0.06 - revealDepth) * 0.5;
        const totalRevealD = 0.06 + revealDepth;
        const jT = 0.026;

        const topJamb = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, jT, totalRevealD), innerCasingMat);
        topJamb.position.set(0, height / 2 - jT / 2 + 0.006, revealMidZ);
        const botJamb = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, jT, totalRevealD), innerCasingMat);
        botJamb.position.set(0, -height / 2 + jT / 2 - 0.006, revealMidZ);
        const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(jT, height + 0.02, totalRevealD), innerCasingMat);
        leftJamb.position.set(-width / 2 + jT / 2 - 0.006, 0, revealMidZ);
        const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(jT, height + 0.02, totalRevealD), innerCasingMat);
        rightJamb.position.set(width / 2 - jT / 2 + 0.006, 0, revealMidZ);
        grp.add(topJamb, botJamb, leftJamb, rightJamb);

        // 2. Crisp 3D White uPVC Outer Frame (z: -0.055 to +0.055)
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameT, frameD), whitePvcMat);
        topBar.position.set(0, height / 2 - frameT / 2, 0);
        topBar.castShadow = true;

        const botBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameT, frameD), whitePvcMat);
        botBar.position.set(0, -height / 2 + frameT / 2, 0);
        botBar.castShadow = true;

        const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameT, height, frameD), whitePvcMat);
        leftBar.position.set(-width / 2 + frameT / 2, 0, 0);
        leftBar.castShadow = true;

        const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameT, height, frameD), whitePvcMat);
        rightBar.position.set(width / 2 - frameT / 2, 0, 0);
        rightBar.castShadow = true;

        grp.add(topBar, botBar, leftBar, rightBar);

        const innerW = width - frameT * 2;
        const innerH = height - frameT * 2;

        // 3. Deep Enclosed Room & 3D Pleated Curtains cleanly behind the glass (z <= -0.08)
        const interior = createRecessedRoomAndCurtains(innerW, innerH, 0.44);
        grp.add(interior);

        // 4. Glossy Sky-Reflecting Glass Pane (z = -0.020)
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), windowGlassMat);
        glass.position.z = -0.020;
        glass.renderOrder = 2;
        grp.add(glass);

        // Subtle diagonal glossy sky-reflection sheen layer (z = -0.011, strictly behind muntins!)
        const sheenMat = new THREE.MeshBasicMaterial({
          map: glassSheenTex,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        });
        glassSheenMaterials.push(sheenMat);
        const sheenPlane = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), sheenMat);
        sheenPlane.position.z = -0.011;
        sheenPlane.renderOrder = 3;
        grp.add(sheenPlane);

        // 5. Crisp 3D White Muntin Bars protruding cleanly IN FRONT of glass (z = +0.016, depth 0.024 -> +0.004 to +0.028)
        const muntinT = 0.022;
        const muntinD = 0.024;
        const muntinZ = 0.016;

        if (asymmetricDormer) {
          // Dormer specific layout: left wide 4x3 muntin grid + right narrow two-pane hopper & 2x2 casement
          const splitX = -innerW / 2 + innerW * 0.67;

          const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.075, innerH, frameD * 0.88), whitePvcMat);
          mullion.position.set(splitX, 0, 0.010);
          mullion.castShadow = true;
          grp.add(mullion);

          const leftW = innerW * 0.67 - 0.0375;
          const leftStartX = -innerW / 2;
          // 4 columns x 3 rows grid on left
          for (let i = 1; i < 4; i++) {
            const vBar = new THREE.Mesh(new THREE.BoxGeometry(muntinT, innerH, muntinD), whitePvcMat);
            vBar.position.set(leftStartX + (leftW / 4) * i, 0, muntinZ);
            grp.add(vBar);
          }
          for (let j = 1; j < 3; j++) {
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(leftW, muntinT, muntinD), whitePvcMat);
            hBar.position.set(leftStartX + leftW / 2, -innerH / 2 + (innerH / 3) * j, muntinZ);
            grp.add(hBar);
          }

          // Right narrow casement (top small 2-pane hopper + lower 2x2 muntin cross)
          const rightStartX = splitX + 0.0375;
          const rightW = innerW / 2 - rightStartX;
          const rightCenterX = rightStartX + rightW / 2;
          const transomY = innerH / 2 - innerH * 0.30;

          const tBar = new THREE.Mesh(new THREE.BoxGeometry(rightW, 0.062, frameD * 0.85), whitePvcMat);
          tBar.position.set(rightCenterX, transomY, 0.012);
          grp.add(tBar);

          const lowerH = transomY - (-innerH / 2);
          const lowerCenterY = -innerH / 2 + lowerH / 2;

          const rv = new THREE.Mesh(new THREE.BoxGeometry(muntinT, lowerH, muntinD), whitePvcMat);
          rv.position.set(rightCenterX, lowerCenterY, muntinZ);
          const rh = new THREE.Mesh(new THREE.BoxGeometry(rightW, muntinT, muntinD), whitePvcMat);
          rh.position.set(rightCenterX, lowerCenterY, muntinZ);
          grp.add(rv, rh);

          // Small 2-pane hopper divider inside top right sash
          const topH = innerH * 0.30;
          const topCenterY = innerH / 2 - topH / 2;
          const tInnerFrame = new THREE.Mesh(new THREE.BoxGeometry(rightW - 0.04, 0.026, 0.038), whitePvcMat);
          tInnerFrame.position.set(rightCenterX, topCenterY + topH * 0.38, 0.022);
          const hopperDiv = new THREE.Mesh(new THREE.BoxGeometry(muntinT, topH, muntinD), whitePvcMat);
          hopperDiv.position.set(rightCenterX, topCenterY, muntinZ);
          grp.add(tInnerFrame, hopperDiv);
        } else {
          let mainTopY = innerH / 2;
          if (hasTransom) {
            const transomH = innerH * transomRatio;
            mainTopY = innerH / 2 - transomH;

            const tBar = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.056, frameD * 0.86), whitePvcMat);
            tBar.position.set(0, mainTopY, 0.014);
            tBar.castShadow = true;
            grp.add(tBar);

            const awnBar = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.04, 0.028, 0.042), whitePvcMat);
            awnBar.position.set(0, innerH / 2 - 0.022, 0.026);
            grp.add(awnBar);

            for (let i = 1; i < cols; i++) {
              const tv = new THREE.Mesh(new THREE.BoxGeometry(muntinT, transomH, muntinD), whitePvcMat);
              tv.position.set(-innerW / 2 + (innerW / cols) * i, mainTopY + transomH / 2, muntinZ + 0.004);
              grp.add(tv);
            }
          }

          const lowerH = mainTopY - (-innerH / 2);
          const lowerCenterY = -innerH / 2 + lowerH / 2;

          for (let i = 1; i < cols; i++) {
            const vBar = new THREE.Mesh(new THREE.BoxGeometry(muntinT, lowerH, muntinD), whitePvcMat);
            vBar.position.set(-innerW / 2 + (innerW / cols) * i, lowerCenterY, muntinZ);
            grp.add(vBar);
          }
          for (let j = 1; j < rows; j++) {
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(innerW, muntinT, muntinD), whitePvcMat);
            hBar.position.set(0, -innerH / 2 + (lowerH / rows) * j, muntinZ);
            grp.add(hBar);
          }
        }

        return grp;
      }

      /**
       * Builds a white uPVC front door with a real hollow upper glass aperture, distinct
       * frosted/etched translucent glass (zero Z-fighting), warm dusk hallway glow behind it,
       * recessed bottom panel, letterbox, and lever handle.
       */
      function createFrontDoor({ width = 1.14, height = 2.34, splitGlass = false, brassHardware = false }) {
        const grp = new THREE.Group();
        const frameT = 0.075;
        const frameD = 0.13;

        // Outer Door Frame
        const topF = new THREE.Mesh(new THREE.BoxGeometry(width, frameT, frameD), whitePvcMat);
        topF.position.set(0, height / 2 - frameT / 2, 0);
        const leftF = new THREE.Mesh(new THREE.BoxGeometry(frameT, height, frameD), whitePvcMat);
        leftF.position.set(-width / 2 + frameT / 2, 0, 0);
        const rightF = new THREE.Mesh(new THREE.BoxGeometry(frameT, height, frameD), whitePvcMat);
        rightF.position.set(width / 2 - frameT / 2, 0, 0);
        grp.add(topF, leftF, rightF);

        const leafW = width - frameT * 2;
        const leafH = height - frameT;
        const leafCenterY = -frameT / 2;
        const leafD = 0.06;
        const leafZ = -0.015;

        // Glass Aperture Geometry inside the door leaf (no solid slab passing behind the glass!)
        const glassW = leafW * 0.72;
        const glassH = leafH * 0.48;
        const glassY = leafCenterY + leafH * 0.19;

        const leafTop = leafCenterY + leafH / 2;
        const leafBot = leafCenterY - leafH / 2;
        const gTop = glassY + glassH / 2;
        const gBot = glassY - glassH / 2;
        const stileW = (leafW - glassW) / 2;

        // Build solid door leaf strictly AROUND the glass aperture (4 pieces)
        const topRailH = leafTop - gTop;
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(leafW, topRailH, leafD), whitePvcMat);
        topRail.position.set(0, gTop + topRailH / 2, leafZ);
        topRail.castShadow = true;
        topRail.receiveShadow = true;

        const botSlabH = gBot - leafBot;
        const botSlab = new THREE.Mesh(new THREE.BoxGeometry(leafW, botSlabH, leafD), whitePvcMat);
        botSlab.position.set(0, leafBot + botSlabH / 2, leafZ);
        botSlab.castShadow = true;
        botSlab.receiveShadow = true;

        const leftStile = new THREE.Mesh(new THREE.BoxGeometry(stileW, glassH, leafD), whitePvcMat);
        leftStile.position.set(-leafW / 2 + stileW / 2, glassY, leafZ);
        leftStile.castShadow = true;

        const rightStile = new THREE.Mesh(new THREE.BoxGeometry(stileW, glassH, leafD), whitePvcMat);
        rightStile.position.set(leafW / 2 - stileW / 2, glassY, leafZ);
        rightStile.castShadow = true;

        grp.add(topRail, botSlab, leftStile, rightStile);

        // Recessed Dark Hallway Backing behind the frosted glass (z = -0.22; glows amber at dusk!)
        const doorGlowMat = new THREE.MeshStandardMaterial({
          color: 0x3b444d,
          emissive: 0xffb347,
          emissiveIntensity: 0.0,
          roughness: 0.9,
        });
        duskGlowMaterials.push(doorGlowMat);

        const hallwayBack = new THREE.Mesh(new THREE.PlaneGeometry(glassW + 0.06, glassH + 0.06), doorGlowMat);
        hallwayBack.position.set(0, glassY, -0.22);
        grp.add(hallwayBack);

        // Distinct Frosted/Etched Translucent Door Glass centered cleanly in the aperture (z = -0.015)
        const frostedPane = new THREE.Mesh(new THREE.PlaneGeometry(glassW, glassH), frostedGlassMat);
        frostedPane.position.set(0, glassY, -0.015);
        frostedPane.renderOrder = 2;
        grp.add(frostedPane);

        // 4-Bar Moulded Glazing Bead framing the frosted glass (never covers the glass!)
        const beadT = 0.024;
        const beadD = 0.022;
        const beadZ = 0.016;
        const bTop = new THREE.Mesh(new THREE.BoxGeometry(glassW + beadT * 2, beadT, beadD), offWhiteTrimMat);
        bTop.position.set(0, gTop + beadT / 2 - 0.005, beadZ);
        const bBot = new THREE.Mesh(new THREE.BoxGeometry(glassW + beadT * 2, beadT, beadD), offWhiteTrimMat);
        bBot.position.set(0, gBot - beadT / 2 + 0.005, beadZ);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(beadT, glassH, beadD), offWhiteTrimMat);
        bLeft.position.set(-glassW / 2 - beadT / 2 + 0.005, glassY, beadZ);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(beadT, glassH, beadD), offWhiteTrimMat);
        bRight.position.set(glassW / 2 + beadT / 2 - 0.005, glassY, beadZ);
        grp.add(bTop, bBot, bLeft, bRight);

        if (splitGlass) {
          const midDiv = new THREE.Mesh(new THREE.BoxGeometry(0.055, glassH + 0.02, 0.048), whitePvcMat);
          midDiv.position.set(0, glassY, 0.006);
          grp.add(midDiv);
          const knocker = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 8, 16), brassMat);
          knocker.position.set(0, glassY + 0.14, 0.042);
          grp.add(knocker);
        }

        // Recessed Moulded Bottom Door Panel
        const panelY = -leafH * 0.28;
        const panelOuter = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.68, leafH * 0.28, 0.022), offWhiteTrimMat);
        panelOuter.position.set(0, panelY, 0.018);
        const panelInner = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.54, leafH * 0.2, 0.028), whitePvcMat);
        panelInner.position.set(0, panelY, 0.021);
        grp.add(panelOuter, panelInner);

        // Letterbox & Lever Handle
        const hwMat = brassHardware ? brassMat : silverMat;
        const letterbox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.062, 0.024), hwMat);
        letterbox.position.set(0, -0.14, 0.022);
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.022, 0.028), blackMetalMat);
        slot.position.set(0, -0.14, 0.024);
        grp.add(letterbox, slot);

        const handleX = -leafW * 0.4;
        const handleY = -0.06;
        const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.17, 0.018), hwMat);
        backplate.position.set(handleX, handleY, 0.022);
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.022, 0.022), hwMat);
        lever.position.set(handleX + 0.045, handleY + 0.02, 0.046);
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.03), hwMat);
        stem.position.set(handleX, handleY + 0.02, 0.034);
        grp.add(backplate, lever, stem);

        return grp;
      }

      /**
       * Helper to build a clean, watertight pitched slate roof bounded strictly to
       * [xMin, xMax] with its attic gable prism strictly concealed UNDER the roof slopes
       * (no protruding roof pieces or stray gable wedges anywhere!).
       */
      function createWatertightPitchedRoof({ xMin, xMax, eavesY, ridgeY, depth = 5.4, roofMat = slateMat }) {
        const grp = new THREE.Group();
        const width = xMax - xMin;
        const centerX = (xMin + xMax) * 0.5;
        const frontEavesZ = 0.12;   // Flush right behind the front gutter
        const ridgeZ = -depth * 0.5;
        const backEavesZ = -depth - 0.08;

        // Exact front slope math
        const dzFront = frontEavesZ - ridgeZ;
        const dy = ridgeY - eavesY;
        const frontLen = Math.hypot(dzFront, dy);
        const frontAngle = Math.atan2(dy, dzFront);

        const frontSlope = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, frontLen), roofMat);
        frontSlope.position.set(centerX, (eavesY + ridgeY) * 0.5, (frontEavesZ + ridgeZ) * 0.5);
        frontSlope.rotation.x = frontAngle;
        frontSlope.castShadow = true;
        frontSlope.receiveShadow = true;
        grp.add(frontSlope);

        // Exact back slope math
        const dzBack = ridgeZ - backEavesZ;
        const backLen = Math.hypot(dzBack, dy);
        const backAngle = Math.atan2(dy, dzBack);

        const backSlope = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, backLen), roofMat);
        backSlope.position.set(centerX, (eavesY + ridgeY) * 0.5, (ridgeZ + backEavesZ) * 0.5);
        backSlope.rotation.x = -backAngle;
        backSlope.castShadow = true;
        backSlope.receiveShadow = true;
        grp.add(backSlope);

        // Clean flush ridge cap strictly within [xMin, xMax]
        const ridgeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, width, 8), darkTrimMat);
        ridgeCap.rotation.z = Math.PI / 2;
        ridgeCap.position.set(centerX, ridgeY + 0.01, ridgeZ);
        grp.add(ridgeCap);

        // Concealed solid attic gable fill strictly INSIDE the roof cavity (z from -0.05 to -depth + 0.05)
        // NOTE: rotateY(+Math.PI / 2) maps shape +X -> world -Z and extrusion +Z -> world +X!
        const gableShape = new THREE.Shape();
        gableShape.moveTo(0.06, eavesY);
        gableShape.lineTo(-ridgeZ, ridgeY - 0.10);
        gableShape.lineTo(depth - 0.06, eavesY);
        gableShape.closePath();

        const fillWidth = width - 0.06;
        const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: fillWidth, bevelEnabled: false });
        gableGeo.rotateY(Math.PI / 2);
        const gableMesh = new THREE.Mesh(gableGeo, brickMat);
        gableMesh.position.set(xMin + 0.03, 0, 0);
        gableMesh.castShadow = true;
        gableMesh.receiveShadow = true;
        grp.add(gableMesh);

        return grp;
      }

      // =======================================================================
      // 5. HOUSE NO. 121 (CENTER VICTORIAN TERRACED HOUSE)
      // =======================================================================
      const neighborhood = new THREE.Group();
      scene.add(neighborhood);

      const house121 = new THREE.Group();
      neighborhood.add(house121);

      const h121Width = 5.60;    // x: -2.80 to +2.80
      const h121WallH = 3.48;    // y: 0 to 3.48
      const h121Depth = 5.40;    // z: 0 to -5.40
      const frontThick = 0.26;
      const frontZ = -frontThick / 2;
      const cavityBackZ = -0.92; // Leaves deep 0.66-unit hollow room space behind every window & door!

      // Ground-floor brick front wall with genuine hollow Window & Door openings
      // Window opening: x in [-1.29, 0.01] (center -0.64, w=1.30), y in [1.14, 2.54] (h=1.40)
      // Door opening:   x in [0.96, 2.12]  (center  1.54, w=1.16), y in [0.06, 2.42] (h=2.36)
      house121.add(createBrickBlock(1.51, h121WallH, frontThick, -2.045, h121WallH / 2, frontZ));
      house121.add(createBrickBlock(1.30, 1.14, frontThick, -0.64, 0.57, frontZ));
      house121.add(createBrickBlock(1.30, 0.94, frontThick, -0.64, 3.01, frontZ));
      house121.add(createBrickBlock(0.95, h121WallH, frontThick, 0.485, h121WallH / 2, frontZ));
      house121.add(createBrickBlock(1.16, 1.06, frontThick, 1.54, 2.95, frontZ));
      house121.add(createBrickBlock(0.68, h121WallH, frontThick, 2.46, h121WallH / 2, frontZ));

      // Sealed side cheek walls & solid main body set cleanly behind the recessed room cavity
      const cavityD = -cavityBackZ - frontThick;
      house121.add(createBrickBlock(0.18, h121WallH, cavityD, -2.71, h121WallH / 2, -frontThick - cavityD / 2));
      house121.add(createBrickBlock(0.18, h121WallH, cavityD, 2.71, h121WallH / 2, -frontThick - cavityD / 2));
      house121.add(createBrickBlock(h121Width, h121WallH, h121Depth + cavityBackZ, 0, h121WallH / 2, cavityBackZ - (h121Depth + cavityBackZ) / 2));

      // Recessed Ground-Floor Window (top transom + 3x3 muntins + glossy glass + 3D pleated curtains)
      const gfWindow = createDetailedWindow({
        width: 1.30,
        height: 1.40,
        cols: 3,
        rows: 3,
        hasTransom: true,
        transomRatio: 0.25,
      });
      gfWindow.position.set(-0.64, 1.84, -0.10);
      house121.add(gfWindow);

      // Arched Stone Lintel with decorative Red Diamond above Window
      const winLintel = createStoneLintel(1.66, 0.36, 0.06, '', true);
      winLintel.position.set(-0.64, 2.54, 0.0);
      house121.add(winLintel);

      // Stone Windowsill
      const winSill = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.09, 0.24), stoneLintelMat);
      winSill.position.set(-0.64, 1.10, 0.06);
      winSill.castShadow = true;
      winSill.receiveShadow = true;
      house121.add(winSill);

      // Wooden Flower Planter Box overflowing with 3D Flowers
      const planterGroup = new THREE.Group();
      planterGroup.position.set(-0.64, 1.15, 0.13);
      house121.add(planterGroup);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x9e633b, roughness: 0.85 });
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.96 });
      const planterBox = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.18, 0.20), woodMat);
      planterBox.position.y = 0.09;
      planterBox.castShadow = true;
      planterBox.receiveShadow = true;
      const planterRim = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.035, 0.23), woodMat);
      planterRim.position.y = 0.18;
      const soil = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.04, 0.16), soilMat);
      soil.position.y = 0.175;
      planterGroup.add(planterBox, planterRim, soil);

      const leafPalette = [0x3d7a32, 0x4e943f, 0x2f6327, 0x61a646];
      const flowerColors = [0xe83845, 0xffcc29, 0xffffff, 0xff6b9d, 0xff7f2a];

      let fSeed = 7721;
      const fRand = () => {
        fSeed = (fSeed * 16807) % 2147483647;
        return (fSeed - 1) / 2147483646;
      };

      const leafGeo = new THREE.DodecahedronGeometry(0.068, 1);
      for (let i = 0; i < 34; i++) {
        const lMat = new THREE.MeshStandardMaterial({
          color: leafPalette[Math.floor(fRand() * leafPalette.length)],
          roughness: 0.72,
        });
        const leaf = new THREE.Mesh(leafGeo, lMat);
        leaf.position.set((fRand() - 0.5) * 1.08, 0.21 + fRand() * 0.11, (fRand() - 0.5) * 0.20);
        leaf.scale.set(0.8 + fRand() * 0.6, 0.7 + fRand() * 0.5, 0.8 + fRand() * 0.5);
        leaf.castShadow = true;
        planterGroup.add(leaf);
      }

      const petalGeo = new THREE.SphereGeometry(0.026, 8, 8);
      const centerGeo = new THREE.SphereGeometry(0.015, 6, 6);
      const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.5 });

      for (let i = 0; i < 20; i++) {
        const fGrp = new THREE.Group();
        const col = flowerColors[i % flowerColors.length];
        const pMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 });
        for (let p = 0; p < 5; p++) {
          const ang = (p / 5) * Math.PI * 2;
          const pet = new THREE.Mesh(petalGeo, pMat);
          pet.position.set(Math.cos(ang) * 0.025, Math.sin(ang) * 0.025, 0);
          pet.scale.set(1, 1, 0.55);
          fGrp.add(pet);
        }
        const ctr = new THREE.Mesh(centerGeo, centerMat);
        ctr.position.z = 0.01;
        fGrp.add(ctr);

        fGrp.position.set(-0.48 + (i / 19) * 0.96 + (fRand() - 0.5) * 0.04, 0.26 + fRand() * 0.10, 0.03 + (fRand() - 0.5) * 0.12);
        fGrp.rotation.set(-0.25 + (fRand() - 0.5) * 0.4, (fRand() - 0.5) * 0.5, 0);
        planterGroup.add(fGrp);
      }

      // Front Door 121 + Concrete Doorstep + Curved Stone Lintel "121"
      const door121 = createFrontDoor({ width: 1.16, height: 2.36, splitGlass: false, brassHardware: false });
      door121.position.set(1.54, 1.24, -0.10);
      house121.add(door121);

      const doorstep121 = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.075, 0.46), stoneLintelMat);
      doorstep121.position.set(1.54, 0.0375, 0.14);
      doorstep121.castShadow = true;
      doorstep121.receiveShadow = true;
      house121.add(doorstep121);

      const doorLintel121 = createStoneLintel(1.56, 0.36, 0.06, '121', true);
      doorLintel121.position.set(1.54, 2.42, 0.0);
      house121.add(doorLintel121);

      // House Name Plaque: "SACRE COEUR"
      const namePlaqueTex = createHouseNamePlaqueTexture();
      const namePlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.17, 0.028),
        [
          blackMetalMat, blackMetalMat, blackMetalMat, blackMetalMat,
          new THREE.MeshStandardMaterial({ map: namePlaqueTex, roughness: 0.38 }),
          blackMetalMat,
        ]
      );
      namePlaque.position.set(0.52, 1.68, 0.015);
      namePlaque.castShadow = true;
      house121.add(namePlaque);

      // Red Security Alarm Box
      const alarmTex = createAlarmBoxTexture();
      const alarmRedMat = new THREE.MeshStandardMaterial({ color: 0xc93225, roughness: 0.4 });
      const alarmBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.42, 0.12),
        [
          alarmRedMat, alarmRedMat, alarmRedMat, alarmRedMat,
          new THREE.MeshStandardMaterial({ map: alarmTex, roughness: 0.4 }),
          alarmRedMat,
        ]
      );
      alarmBox.position.set(0.72, 2.94, 0.06);
      alarmBox.castShadow = true;
      house121.add(alarmBox);

      alarmLedMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xff3b30,
        emissiveIntensity: 1.5,
      });
      const alarmLed = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), alarmLedMat);
      alarmLed.position.set(0.72, 2.79, 0.125);
      house121.add(alarmLed);

      // Small Grey Utility Junction Box below alarm box
      const junctionBox = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.075), dormerStuccoMat);
      junctionBox.position.set(0.70, 2.28, 0.038);
      junctionBox.castShadow = true;
      house121.add(junctionBox);

      // Grey Parabolic Satellite Dish with LNB Arm
      const dishGroup = new THREE.Group();
      dishGroup.position.set(-1.68, 3.04, 0.24);
      house121.add(dishGroup);

      const dishPts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        dishPts.push(new THREE.Vector2(t * 0.34, t * t * 0.11));
      }
      const dishGeo = new THREE.LatheGeometry(dishPts, 28);
      const dishMat = new THREE.MeshStandardMaterial({
        color: 0x626b75,
        roughness: 0.48,
        metalness: 0.32,
        side: THREE.DoubleSide,
      });
      const dishHead = new THREE.Group();
      dishHead.rotation.set(Math.PI * 0.44, 0.32, -0.22);
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.castShadow = true;
      dishHead.add(dishMesh);

      const lnbArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.34, 8), blackMetalMat);
      lnbArm.position.set(0, 0.18, 0.14);
      lnbArm.rotation.x = Math.PI * 0.28;
      dishHead.add(lnbArm);

      const lnbCap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.025, 0.075, 10), blackMetalMat);
      lnbCap.position.set(0, 0.28, 0.03);
      lnbCap.rotation.x = Math.PI * 0.12;
      dishHead.add(lnbCap);
      dishGroup.add(dishHead);

      const dishBracket = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), blackMetalMat);
      dishBracket.rotation.x = Math.PI / 2;
      dishBracket.position.set(0.05, -0.04, -0.12);
      dishGroup.add(dishBracket);

      // Coax / Utility Cables routed neatly along brickwork
      function addWallCable(points, radius = 0.011) {
        const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, radius, 6, false), blackMetalMat);
        tube.castShadow = true;
        house121.add(tube);
      }

      addWallCable([
        [-2.14, 3.38, 0.02],
        [-2.14, 2.20, 0.02],
        [-2.14, 0.72, 0.02],
        [-2.14, 0.04, 0.02],
      ], 0.012);

      addWallCable([
        [-1.65, 2.95, 0.24],
        [-1.42, 2.86, 0.05],
        [-1.08, 2.98, 0.03],
        [-0.25, 2.95, 0.02],
        [0.45, 2.88, 0.02],
        [0.70, 2.55, 0.025],
        [0.70, 2.34, 0.03],
      ], 0.01);

      addWallCable([
        [-2.78, 3.34, 0.04],
        [-1.0, 3.32, 0.04],
        [1.1, 3.36, 0.04],
        [2.72, 3.34, 0.05],
      ], 0.015);

      // =======================================================================
      // 6. HOUSE 121 CLEAN WATERTIGHT ROOF, DORMER, CHIMNEY & GUTTERS
      // =======================================================================
      const roof121 = createWatertightPitchedRoof({
        xMin: -2.80,
        xMax: 2.80,
        eavesY: 3.44,
        ridgeY: 5.66,
        depth: h121Depth,
        roofMat: slateMat,
      });
      house121.add(roof121);

      // Black Eaves Gutter & Fascia strictly bounded to House 121
      const mainGutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, h121Width + 0.04, 12, 1, false, 0, Math.PI),
        blackMetalMat
      );
      mainGutter.rotation.z = Math.PI / 2;
      mainGutter.rotation.x = Math.PI;
      mainGutter.position.set(0, 3.44, 0.20);
      mainGutter.castShadow = true;
      house121.add(mainGutter);

      const eavesFascia = new THREE.Mesh(new THREE.BoxGeometry(h121Width, 0.12, 0.08), blackMetalMat);
      eavesFascia.position.set(0, 3.44, 0.09);
      house121.add(eavesFascia);

      // Vertical Black Downpipe along the boundary between House 121 and the Right Neighbor
      const rightPipePts = [
        new THREE.Vector3(2.74, 3.40, 0.20),
        new THREE.Vector3(2.74, 3.24, 0.13),
        new THREE.Vector3(2.77, 3.12, 0.07),
        new THREE.Vector3(2.77, 0.02, 0.07),
      ];
      const rightPipe = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPipePts), 24, 0.048, 10, false),
        blackMetalMat
      );
      rightPipe.castShadow = true;
      house121.add(rightPipe);

      for (const py of [2.5, 1.5, 0.5]) {
        const clip = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.014, 6, 12), blackMetalMat);
        clip.rotation.x = Math.PI / 2;
        clip.position.set(2.77, py, 0.07);
        house121.add(clip);
      }

      // Left-side gutter drop connecting cleanly to House 120 eaves
      const leftDropPts = [
        new THREE.Vector3(-2.74, 3.40, 0.20),
        new THREE.Vector3(-2.76, 3.26, 0.18),
        new THREE.Vector3(-2.86, 3.22, 0.18),
      ];
      const leftDrop = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftDropPts), 14, 0.042, 10, false),
        blackMetalMat
      );
      house121.add(leftDrop);

      // Brick Chimney Stack rising cleanly behind the left side of House 121's dormer
      const chimneyGroup = new THREE.Group();
      chimneyGroup.position.set(-2.04, 4.92, -2.02);
      house121.add(chimneyGroup);

      chimneyGroup.add(createBrickBlock(0.76, 1.72, 0.72, 0, 0.46, 0, brickMat));
      chimneyGroup.add(createBrickBlock(0.84, 0.12, 0.80, 0, 1.35, 0, brickMat));
      chimneyGroup.add(createBrickBlock(0.90, 0.11, 0.86, 0, 1.46, 0, brickMat));

      const flaunch = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.07, 0.78), stoneLintelMat);
      flaunch.position.y = 1.54;
      chimneyGroup.add(flaunch);

      // Two Terracotta Chimney Pots atop the brick chimney stack
      for (const px of [-0.18, 0.18]) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.36, 14), terracottaMat);
        pot.position.set(px, 1.74, 0);
        pot.castShadow = true;
        const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 16), terracottaMat);
        potRim.rotation.x = Math.PI / 2;
        potRim.position.set(px, 1.91, 0);
        chimneyGroup.add(pot, potRim);
      }

      // Flat-Roofed Grey Rendered Dormer Window with REAL hollow front cut-out
      const dormerGroup = new THREE.Group();
      dormerGroup.position.set(0.0, 4.60, -1.36);
      house121.add(dormerGroup);

      const dormerW = 3.46;
      const dormerH = 1.88;
      const dormerD = 2.08;

      const dormerShell = createHollowDormerShell({
        width: dormerW,
        height: dormerH,
        depth: dormerD,
        winW: 2.54,
        winH: 1.44,
        winOffsetX: 0.16,
        winOffsetY: -0.08,
        mat: dormerStuccoMat,
      });
      dormerGroup.add(dormerShell);

      // Flush flat roof cap on dormer (no protruding stray ledges)
      const dormerCap = new THREE.Mesh(new THREE.BoxGeometry(dormerW + 0.18, 0.09, dormerD + 0.18), darkTrimMat);
      dormerCap.position.set(0, dormerH / 2 + 0.06, 0.05);
      dormerCap.castShadow = true;
      dormerGroup.add(dormerCap);

      // Crisp white fascia & white gutter along top front edge
      const dormerFascia = new THREE.Mesh(new THREE.BoxGeometry(dormerW + 0.16, 0.18, 0.16), whitePvcMat);
      dormerFascia.position.set(0, dormerH / 2 - 0.04, dormerD / 2 + 0.06);
      dormerFascia.castShadow = true;
      dormerGroup.add(dormerFascia);

      const dormerGutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, dormerW + 0.20, 10, 1, false, 0, Math.PI),
        whitePvcMat
      );
      dormerGutter.rotation.z = Math.PI / 2;
      dormerGutter.rotation.x = Math.PI;
      dormerGutter.position.set(0, dormerH / 2 - 0.06, dormerD / 2 + 0.16);
      dormerGroup.add(dormerGutter);

      // Thin white downpipe on left edge of dormer feeding neatly down to the main black gutter
      const dormerPipePts = [
        new THREE.Vector3(-dormerW / 2 + 0.14, dormerH / 2 - 0.08, dormerD / 2 + 0.15),
        new THREE.Vector3(-dormerW / 2 + 0.20, dormerH / 2 - 0.22, dormerD / 2 + 0.05),
        new THREE.Vector3(-dormerW / 2 + 0.20, -dormerH / 2 + 0.10, dormerD / 2 + 0.05),
        new THREE.Vector3(-dormerW / 2 + 0.20, -dormerH / 2 - 0.18, dormerD / 2 + 0.44),
      ];
      const dormerPipe = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dormerPipePts), 20, 0.032, 8, false),
        whitePvcMat
      );
      dormerPipe.castShadow = true;
      dormerGroup.add(dormerPipe);

      // Recessed Asymmetric Dormer Window (left 4x3 muntins + right 2-pane hopper & 2x2 casement + pleated curtains)
      const dormerWin = createDetailedWindow({
        width: 2.54,
        height: 1.44,
        asymmetricDormer: true,
        revealDepth: 0.22,
      });
      dormerWin.position.set(0.16, -0.08, dormerD / 2 - 0.07);
      dormerGroup.add(dormerWin);

      const dormerSill = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.06, 0.16), whitePvcMat);
      dormerSill.position.set(0.16, -0.82, dormerD / 2 + 0.03);
      dormerGroup.add(dormerSill);

      // =======================================================================
      // 7. LEFT NEIGHBORING HOUSE (NO. 120) — HOLLOW OPENINGS, FLUSH ROOF & DORMER
      // =======================================================================
      const house120 = new THREE.Group();
      neighborhood.add(house120);

      // x: -7.40 to -2.80 (width 4.60)
      const h120WallH = 3.26;
      const h120Z = 0.0;

      // Front brick wall with genuine hollow openings for BOTH Door 120 (x=-3.76) AND Window 120 (x=-5.78)
      house120.add(createBrickBlock(0.40, h120WallH, frontThick, -3.00, h120WallH / 2, h120Z - frontThick / 2));
      house120.add(createBrickBlock(1.12, h120WallH - 2.36, frontThick, -3.76, 2.36 + (h120WallH - 2.36) / 2, h120Z - frontThick / 2));
      house120.add(createBrickBlock(0.84, h120WallH, frontThick, -4.74, h120WallH / 2, h120Z - frontThick / 2));
      house120.add(createBrickBlock(1.24, 1.12, frontThick, -5.78, 0.56, h120Z - frontThick / 2));
      house120.add(createBrickBlock(1.24, h120WallH - 2.44, frontThick, -5.78, 2.44 + (h120WallH - 2.44) / 2, h120Z - frontThick / 2));
      house120.add(createBrickBlock(1.00, h120WallH, frontThick, -6.90, h120WallH / 2, h120Z - frontThick / 2));

      // Sealed side walls & solid interior body set cleanly behind the deep window/door cavity
      house120.add(createBrickBlock(0.18, h120WallH, cavityD, -7.31, h120WallH / 2, -frontThick - cavityD / 2));
      house120.add(createBrickBlock(0.18, h120WallH, cavityD, -2.89, h120WallH / 2, -frontThick - cavityD / 2));
      house120.add(createBrickBlock(4.60, h120WallH, h121Depth + cavityBackZ, -5.10, h120WallH / 2, cavityBackZ - (h121Depth + cavityBackZ) / 2));

      // Door 120 + Lintel "120" + Doorstep
      const door120 = createFrontDoor({ width: 1.12, height: 2.30, splitGlass: true, brassHardware: true });
      door120.position.set(-3.76, 1.21, -0.10);
      house120.add(door120);

      const lintel120 = createStoneLintel(1.50, 0.35, 0.06, '120', true);
      lintel120.position.set(-3.76, 2.36, 0.0);
      house120.add(lintel120);

      const step120 = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.065, 0.44), stoneLintelMat);
      step120.position.set(-3.76, 0.0325, 0.13);
      step120.receiveShadow = true;
      house120.add(step120);

      // Recessed Ground-Floor Window on House 120 (real hollow opening + glossy glass + pleated curtains)
      const win120 = createDetailedWindow({ width: 1.24, height: 1.32, cols: 3, rows: 3, hasTransom: true });
      win120.position.set(-5.78, 1.78, -0.10);
      house120.add(win120);
      const lintel120Win = createStoneLintel(1.56, 0.34, 0.06, '', true);
      lintel120Win.position.set(-5.78, 2.44, 0.0);
      house120.add(lintel120Win);
      const sill120 = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 0.22), stoneLintelMat);
      sill120.position.set(-5.78, 1.09, 0.06);
      house120.add(sill120);

      // Clean Watertight Stepped-Down Pitched Roof strictly within House 120 [-7.40, -2.80]
      const roof120 = createWatertightPitchedRoof({
        xMin: -7.40,
        xMax: -2.80,
        eavesY: 3.22,
        ridgeY: 5.44,
        depth: h121Depth,
        roofMat: slate120Mat,
      });
      house120.add(roof120);

      // Black Eaves Gutter & Fascia strictly bounded to House 120
      const gutter120 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 4.62, 12, 1, false, 0, Math.PI),
        blackMetalMat
      );
      gutter120.rotation.z = Math.PI / 2;
      gutter120.rotation.x = Math.PI;
      gutter120.position.set(-5.10, 3.22, 0.20);
      gutter120.castShadow = true;
      house120.add(gutter120);

      const fascia120 = new THREE.Mesh(new THREE.BoxGeometry(4.60, 0.12, 0.08), blackMetalMat);
      fascia120.position.set(-5.10, 3.22, 0.09);
      house120.add(fascia120);

      // Smaller Grey Dormer with REAL hollow front cut-out on House 120's roof slope
      const dormer120 = new THREE.Group();
      dormer120.position.set(-4.58, 4.32, -1.32);
      house120.add(dormer120);

      const d120Shell = createHollowDormerShell({
        width: 2.10,
        height: 1.54,
        depth: 1.92,
        winW: 1.54,
        winH: 1.10,
        winOffsetX: 0,
        winOffsetY: -0.07,
        mat: dormerStuccoMat,
      });
      dormer120.add(d120Shell);

      const d120Cap = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.09, 2.08), darkTrimMat);
      d120Cap.position.set(0, 0.81, 0.05);
      dormer120.add(d120Cap);

      const d120Fascia = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.15, 0.14), whitePvcMat);
      d120Fascia.position.set(0, 0.71, 0.96);
      dormer120.add(d120Fascia);

      const d120Win = createDetailedWindow({
        width: 1.54,
        height: 1.10,
        cols: 2,
        rows: 2,
        hasTransom: true,
        revealDepth: 0.22,
      });
      d120Win.position.set(0, -0.07, 1.92 / 2 - 0.07);
      dormer120.add(d120Win);

      // =======================================================================
      // 8. RIGHT NEIGHBORING HOUSE — BRICK GROUND FLOOR + PEBBLE-DASH UPPER STORY
      // =======================================================================
      const houseRight = new THREE.Group();
      neighborhood.add(houseRight);

      // x: 2.80 to 7.40 (width 4.60, center 5.10)
      const hrWidth = 4.60;
      const hrCenterX = 5.10;
      const hrGroundH = 3.48; // Matches House 121 ground-floor brick wall height continuously
      const hrUpperH = 1.96;  // Upper pebble-dash story: y from 3.48 to 5.44

      // --- 8A. GROUND FLOOR: MATCHING VICTORIAN RED/TERRACOTTA BRICKWORK ---
      // Genuine hollow ground-floor window opening: x in [3.70, 5.14] (center 4.42, w=1.44), y in [1.10, 2.54] (h=1.44)
      houseRight.add(createBrickBlock(0.90, hrGroundH, frontThick, 3.25, hrGroundH / 2, frontZ));
      houseRight.add(createBrickBlock(1.44, 1.10, frontThick, 4.42, 0.55, frontZ));
      houseRight.add(createBrickBlock(1.44, hrGroundH - 2.54, frontThick, 4.42, 2.54 + (hrGroundH - 2.54) / 2, frontZ));
      houseRight.add(createBrickBlock(2.26, hrGroundH, frontThick, 6.27, hrGroundH / 2, frontZ));

      // Sealed side walls & solid ground-floor body set cleanly behind the deep window room cavity
      houseRight.add(createBrickBlock(0.18, hrGroundH, cavityD, 2.89, hrGroundH / 2, -frontThick - cavityD / 2));
      houseRight.add(createBrickBlock(0.18, hrGroundH, cavityD, 7.31, hrGroundH / 2, -frontThick - cavityD / 2));
      houseRight.add(createBrickBlock(hrWidth, hrGroundH, h121Depth + cavityBackZ, hrCenterX, hrGroundH / 2, cavityBackZ - (h121Depth + cavityBackZ) / 2));

      // Recessed White-Framed Ground-Floor Window on Right Neighbor's Brick Wall
      const hrWinLower = createDetailedWindow({
        width: 1.44,
        height: 1.44,
        cols: 2,
        rows: 2,
        hasTransom: true,
      });
      hrWinLower.position.set(4.42, 1.82, -0.10);
      houseRight.add(hrWinLower);

      const hrSillLower = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.09, 0.24), stoneLintelMat);
      hrSillLower.position.set(4.42, 1.06, 0.06);
      hrSillLower.castShadow = true;
      hrSillLower.receiveShadow = true;
      houseRight.add(hrSillLower);

      const hrLintelLower = createStoneLintel(1.74, 0.34, 0.06, '', false);
      hrLintelLower.position.set(4.42, 2.54, 0.0);
      houseRight.add(hrLintelLower);

      // Vintage Black Wall Lantern mounted on Right Neighbor's Brick Wall near the downpipe
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(3.24, 2.95, 0.22);
      houseRight.add(lanternGroup);

      const lBracket = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.24), blackMetalMat);
      lBracket.position.set(0, 0.10, -0.10);
      const lWallPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.03), blackMetalMat);
      lWallPlate.position.set(0, 0.08, -0.21);
      const lCap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.10, 6), blackMetalMat);
      lCap.position.set(0, 0.09, 0);
      const lBulbMat = new THREE.MeshStandardMaterial({
        color: 0xffe4aa,
        emissive: 0xffaa33,
        emissiveIntensity: 0.15,
        roughness: 0.2,
      });
      duskGlowMaterials.push(lBulbMat);

      const lGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.16, 6), lBulbMat);
      lGlass.position.set(0, -0.02, 0);
      const lBottom = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.06, 6), blackMetalMat);
      lBottom.rotation.x = Math.PI;
      lBottom.position.set(0, -0.12, 0);
      lanternGroup.add(lBracket, lWallPlate, lCap, lGlass, lBottom);

      lanternPointLight.position.set(3.24, 2.86, 0.34);
      houseRight.add(lanternPointLight);

      const haloMat = new THREE.SpriteMaterial({
        map: createGlowSpriteTexture(),
        color: 0xffc66e,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      lanternGlowSprite = new THREE.Sprite(haloMat);
      lanternGlowSprite.scale.set(1.25, 1.25, 1);
      lanternGlowSprite.position.set(3.24, 2.92, 0.25);
      houseRight.add(lanternGlowSprite);

      // Mid-level Horizontal Fascia & Gutter separating brick ground floor from upper stucco
      const hrMidTrim = new THREE.Mesh(new THREE.BoxGeometry(hrWidth, 0.14, 0.16), darkTrimMat);
      hrMidTrim.position.set(hrCenterX, hrGroundH, 0.08);
      hrMidTrim.castShadow = true;
      houseRight.add(hrMidTrim);

      const hrMidGutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, hrWidth, 10, 1, false, 0, Math.PI),
        blackMetalMat
      );
      hrMidGutter.rotation.z = Math.PI / 2;
      hrMidGutter.rotation.x = Math.PI;
      hrMidGutter.position.set(hrCenterX, hrGroundH - 0.02, 0.18);
      houseRight.add(hrMidGutter);

      // --- 8B. UPPER STORY: TAN/BEIGE PEBBLE-DASH STUCCO WITH REAL HOLLOW WINDOW OPENING ---
      const hrUpperFrontZ = 0.04;
      const hrUpperFrontT = 0.24;
      const hrUpperFrontMidZ = hrUpperFrontZ - hrUpperFrontT / 2;
      const hrUpperCavityBackZ = -0.88;
      const hrUpperCavityD = (hrUpperFrontZ - hrUpperFrontT) - hrUpperCavityBackZ;

      // Upper window opening: center (4.42, hrGroundH + 0.96), w=1.40, h=1.24 -> x in [3.72, 5.12], y in [hrGroundH+0.34, hrGroundH+1.58]
      houseRight.add(createPebbleBlock(0.92, hrUpperH, hrUpperFrontT, 3.26, hrGroundH + hrUpperH / 2, hrUpperFrontMidZ));
      houseRight.add(createPebbleBlock(1.40, 0.34, hrUpperFrontT, 4.42, hrGroundH + 0.17, hrUpperFrontMidZ));
      houseRight.add(createPebbleBlock(1.40, hrUpperH - 1.58, hrUpperFrontT, 4.42, hrGroundH + 1.58 + (hrUpperH - 1.58) / 2, hrUpperFrontMidZ));
      houseRight.add(createPebbleBlock(2.28, hrUpperH, hrUpperFrontT, 6.26, hrGroundH + hrUpperH / 2, hrUpperFrontMidZ));

      // Sealed side walls & solid upper back body cleanly behind the upper room cavity
      houseRight.add(createPebbleBlock(0.18, hrUpperH, hrUpperCavityD, 2.89, hrGroundH + hrUpperH / 2, hrUpperCavityBackZ + hrUpperCavityD / 2));
      houseRight.add(createPebbleBlock(0.18, hrUpperH, hrUpperCavityD, 7.31, hrGroundH + hrUpperH / 2, hrUpperCavityBackZ + hrUpperCavityD / 2));
      const hrUpperBackD = h121Depth + hrUpperCavityBackZ;
      houseRight.add(createPebbleBlock(hrWidth, hrUpperH, hrUpperBackD, hrCenterX, hrGroundH + hrUpperH / 2, hrUpperCavityBackZ - hrUpperBackD / 2));

      // Clean Flush Dark Roofline Parapet Trim bounded strictly to Right Neighbor's width
      const hrRoofCap = new THREE.Mesh(new THREE.BoxGeometry(hrWidth, 0.16, h121Depth + 0.12), darkTrimMat);
      hrRoofCap.position.set(hrCenterX, hrGroundH + hrUpperH + 0.08, hrUpperFrontZ - h121Depth / 2 + 0.01);
      hrRoofCap.castShadow = true;
      houseRight.add(hrRoofCap);

      // Upper Vertical Brown Downspout along left edge of pebble-dash upper story
      const hrPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, hrUpperH - 0.04, 10), brownPipeMat);
      hrPipe.position.set(3.04, hrGroundH + hrUpperH / 2, hrUpperFrontZ + 0.08);
      hrPipe.castShadow = true;
      houseRight.add(hrPipe);

      const hrPipeShoe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), brownPipeMat);
      hrPipeShoe.position.set(3.04, hrGroundH + 0.08, hrUpperFrontZ + 0.10);
      houseRight.add(hrPipeShoe);

      // Recessed Upper White-Framed Window on Pebble-Dash Story (glossy glass + 3D pleated curtains)
      const hrWinUpper = createDetailedWindow({
        width: 1.40,
        height: 1.24,
        cols: 2,
        rows: 2,
        hasTransom: true,
        revealDepth: 0.24,
      });
      hrWinUpper.position.set(4.42, hrGroundH + 0.96, hrUpperFrontZ - 0.10);
      houseRight.add(hrWinUpper);

      const hrSillUpper = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 0.22), offWhiteTrimMat);
      hrSillUpper.position.set(4.42, hrGroundH + 0.30, hrUpperFrontZ + 0.06);
      houseRight.add(hrSillUpper);

      // =======================================================================
      // 9. THREE COLORFUL WHEELIE BINS (GREEN, RED "GLASS ONLY", BLUE)
      // =======================================================================
      function createWheelieBin(hexColor, decalType) {
        const bin = new THREE.Group();

        const plasticMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          roughness: 0.42,
          metalness: 0.04,
        });

        const bodyGeo = new THREE.CylinderGeometry(0.36, 0.295, 0.88, 4, 1);
        bodyGeo.rotateY(Math.PI / 4);
        const body = new THREE.Mesh(bodyGeo, plasticMat);
        body.position.y = 0.49;
        body.scale.set(1.06, 1.0, 0.96);
        body.castShadow = true;
        body.receiveShadow = true;
        bin.add(body);

        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.065, 0.50), plasticMat);
        rim.position.y = 0.92;
        rim.castShadow = true;
        bin.add(rim);

        const lidBase = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.05, 0.52), plasticMat);
        lidBase.position.y = 0.97;
        lidBase.castShadow = true;
        const lidCrown = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.045, 0.44), plasticMat);
        lidCrown.position.y = 1.01;
        lidCrown.castShadow = true;

        for (const rx of [-0.14, 0, 0.14]) {
          const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.36), plasticMat);
          ridge.position.set(rx, 1.035, 0);
          bin.add(ridge);
        }
        bin.add(lidBase, lidCrown);

        const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 8), plasticMat);
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(0, 0.96, -0.29);
        for (const hx of [-0.18, 0.18]) {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.09), plasticMat);
          arm.position.set(hx, 0.96, -0.25);
          bin.add(arm);
        }
        bin.add(handleBar);

        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.78 });
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x5c626b, roughness: 0.5 });
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.54, 8), blackMetalMat);
        axle.rotation.z = Math.PI / 2;
        axle.position.set(0, 0.11, -0.18);
        bin.add(axle);

        for (const wx of [-0.26, 0.26]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.055, 16), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.11, -0.18);
          wheel.castShadow = true;
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 12), hubMat);
          hub.rotation.z = Math.PI / 2;
          hub.position.set(wx, 0.11, -0.18);
          bin.add(wheel, hub);
        }

        const decalTex = createBinDecalTexture(decalType);
        const decalMat = new THREE.MeshStandardMaterial({
          map: decalTex,
          transparent: true,
          roughness: 0.5,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        });
        const decalPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.40), decalMat);
        decalPlane.position.set(0, 0.56, 0.233);
        decalPlane.rotation.x = -0.052;
        bin.add(decalPlane);

        return bin;
      }

      const binGreen = createWheelieBin(0x4b7d3b, 'green');
      binGreen.position.set(-1.38, 0.0, 0.44);
      binGreen.rotation.y = 0.03;

      const binRed = createWheelieBin(0xc93026, 'glass');
      binRed.position.set(-0.62, 0.0, 0.46);
      binRed.rotation.y = -0.02;

      const binBlue = createWheelieBin(0x2d69b8, 'blue');
      binBlue.position.set(0.14, 0.0, 0.45);
      binBlue.rotation.y = -0.04;

      neighborhood.add(binGreen, binRed, binBlue);

      // =======================================================================
      // 10. STYLIZED ANIMATED COUPLE — CLEAN FACES & ZERO HAIR BLEEDING
      // =======================================================================
      const coupleGroup = new THREE.Group();
      coupleGroup.position.set(1.45, 0.00, 1.05);
      neighborhood.add(coupleGroup);

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xf7c9a8,
        roughness: 0.54,
        metalness: 0.0,
      });
      const blushMat = new THREE.MeshStandardMaterial({
        color: 0xf48b94,
        roughness: 0.72,
        transparent: true,
        opacity: 0.36,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      const hairBrownMat = new THREE.MeshStandardMaterial({
        color: 0x5c361e,
        roughness: 0.52,
      });
      const hairDarkMat = new THREE.MeshStandardMaterial({
        color: 0x3b2011,
        roughness: 0.48,
      });
      const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12 });
      const irisMat = new THREE.MeshStandardMaterial({ color: 0x5e381c, roughness: 0.18 });
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.08 });
      const lipMat = new THREE.MeshStandardMaterial({ color: 0xd9535e, roughness: 0.42 });
      const smileMouthMat = new THREE.MeshStandardMaterial({ color: 0xa62d38, roughness: 0.55 });
      const teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

      /**
       * Helper: exact front Z coordinate on the smooth peach head ellipsoid
       * (rx = 0.220, ry = 0.2332, rz = 0.2156) for clean tangential feature placement.
       */
      function headFrontZ(x, y) {
        const rx = 0.220;
        const ry = 0.2332;
        const rz = 0.2156;
        const inside = 1.0 - (x * x) / (rx * rx) - (y * y) / (ry * ry);
        return rz * Math.sqrt(Math.max(0.0, inside));
      }

      /**
       * Builds a super cute, clean stylized Pixar-like head with:
       * - Smooth high-segment peach head ellipsoid
       * - Large expressive eyes (white sclera, warm brown iris, dark pupil, bright catchlight)
       * - Clean vertical-scale eye blinking (no overlapping eyelid geometry!)
       * - Neat arched eyebrows with wide clear forehead below hairline
       * - Cute peach button nose, curved 3D friendly smile, rosy cheek blushes, neat ears
       * - Hair strictly positioned on the back/crown/top with ZERO intersection or bleeding onto the face!
       */
      function createStylizedHead({ isGirl = false }) {
        const headGroup = new THREE.Group();

        // 1. Smooth warm-peach head ellipsoid (rx=0.22, ry=0.233, rz=0.216)
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 36, 28), skinMat);
        headMesh.scale.set(1.0, 1.06, 0.98);
        headMesh.castShadow = true;
        headMesh.receiveShadow = true;
        headGroup.add(headMesh);

        // 2. Neat small ears on left & right sides
        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.040, 14, 14), skinMat);
          ear.position.set(sx * 0.216, -0.008, -0.012);
          ear.scale.set(0.54, 1.0, 0.72);
          ear.castShadow = true;
          headGroup.add(ear);
        }

        // 3. Cute peach button nose proudly on face center
        const noseY = -0.016;
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 14), skinMat);
        nose.position.set(0, noseY, headFrontZ(0, noseY) + 0.011);
        nose.scale.set(0.95, 0.82, 0.90);
        headGroup.add(nose);

        // 4. Soft subtle rosy cheek blushes sitting cleanly proud of cheeks
        for (const sx of [-1, 1]) {
          const cx = sx * 0.114;
          const cy = -0.048;
          const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.036, 18), blushMat);
          cheek.position.set(cx, cy, headFrontZ(cx, cy) + 0.004);
          cheek.rotation.y = sx * 0.54;
          cheek.rotation.x = 0.18;
          cheek.scale.set(1.18, 0.76, 1.0);
          headGroup.add(cheek);
        }

        // 5. Large Expressive Eyes (blink cleanly via vertical scale!)
        const eyeGroups = [];
        for (const sx of [-1, 1]) {
          const ex = sx * 0.074;
          const ey = 0.022;
          const ez = headFrontZ(ex, ey) - 0.006;

          const eyeGrp = new THREE.Group();
          eyeGrp.position.set(ex, ey, ez);
          eyeGrp.rotation.y = sx * 0.30;
          eyeGrp.rotation.x = -0.06;

          // Bright white sclera
          const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 18), eyeWhiteMat);
          sclera.scale.set(0.96, 1.08, 0.52);
          eyeGrp.add(sclera);

          // Warm brown iris
          const iris = new THREE.Mesh(new THREE.SphereGeometry(0.030, 16, 16), irisMat);
          iris.position.set(0, 0, 0.015);
          iris.scale.set(0.96, 1.05, 0.45);
          eyeGrp.add(iris);

          // Deep dark pupil
          const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 14), pupilMat);
          pupil.position.set(0, 0, 0.022);
          pupil.scale.set(1.0, 1.0, 0.38);
          eyeGrp.add(pupil);

          // Crisp white specular catchlight dot (main + tiny secondary glint)
          const sparkle1 = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 10, 10), eyeWhiteMat);
          sparkle1.position.set(0.011, 0.014, 0.029);
          eyeGrp.add(sparkle1);

          const sparkle2 = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 8, 8), eyeWhiteMat);
          sparkle2.position.set(-0.009, -0.010, 0.028);
          eyeGrp.add(sparkle2);

          // Subtle upper lash line for the girl
          if (isGirl) {
            const lashPts = [];
            for (let i = 0; i <= 10; i++) {
              const a = Math.PI * 0.14 + (i / 10) * Math.PI * 0.72;
              lashPts.push(new THREE.Vector3(Math.cos(a) * 0.044, Math.sin(a) * 0.049, 0.015));
            }
            const lashTube = new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lashPts), 14, 0.005, 6, false),
              hairDarkMat
            );
            eyeGrp.add(lashTube);
          }

          headGroup.add(eyeGrp);
          eyeGroups.push(eyeGrp);

          // 6. Neat Arched Brown Eyebrow cleanly above the eye with clear forehead above it
          const browPts = [];
          for (let i = 0; i <= 8; i++) {
            const u = (i / 8) * 2 - 1; // -1 to 1
            const bx = ex + u * 0.036;
            const by = 0.088 + (1 - u * u) * 0.011 - sx * u * 0.004;
            const bz = headFrontZ(bx, by) + 0.008;
            browPts.push(new THREE.Vector3(bx, by, bz));
          }
          const browMesh = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(browPts), 12, isGirl ? 0.0065 : 0.0085, 8, false),
            hairDarkMat
          );
          headGroup.add(browMesh);
        }

        // 7. Happy, Friendly Curved 3D Smile hugging the lower face curvature
        const smilePts = [];
        for (let i = 0; i <= 14; i++) {
          const u = (i / 14) * 2 - 1; // -1 to 1
          const mx = u * 0.062;
          const my = -0.094 + u * u * 0.024;
          const mz = headFrontZ(mx, my) + 0.006;
          smilePts.push(new THREE.Vector3(mx, my, mz));
        }
        const smileLine = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 20, 0.0065, 8, false),
          lipMat
        );
        headGroup.add(smileLine);

        // Cheerful subtle open-smile interior + hint of white upper teeth following face contour
        const openPts = [];
        for (let i = 0; i <= 10; i++) {
          const u = (i / 10) * 2 - 1;
          const mx = u * 0.044;
          const my = -0.091 + u * u * 0.017;
          const mz = headFrontZ(mx, my) + 0.004;
          openPts.push(new THREE.Vector3(mx, my, mz));
        }
        const smileFill = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(openPts), 14, 0.011, 8, false),
          smileMouthMat
        );
        headGroup.add(smileFill);

        const teethPts = [];
        for (let i = 0; i <= 8; i++) {
          const u = (i / 8) * 2 - 1;
          const mx = u * 0.038;
          const my = -0.084 + u * u * 0.013;
          const mz = headFrontZ(mx, my) + 0.0085;
          teethPts.push(new THREE.Vector3(mx, my, mz));
        }
        const teethArc = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(teethPts), 12, 0.0055, 8, false),
          teethMat
        );
        headGroup.add(teethArc);

        // 8. HAIR SCULPTING — STRICT GEOMETRIC CLEARANCE (ZERO BLEED ON FACE!)
        // Back & crown partial dome rotated backward (-0.64 rad) and shifted back/up
        // Front edge stays strictly above y >= +0.152 (well above eyebrows at y=0.095)
        const hairCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.232, 32, 22, 0, Math.PI * 2, 0, Math.PI * 0.50),
          hairBrownMat
        );
        hairCap.position.set(0, 0.036, -0.034);
        hairCap.rotation.x = -0.64;
        hairCap.scale.set(1.01, 1.04, 1.0);
        hairCap.castShadow = true;
        headGroup.add(hairCap);

        // Back-of-head smooth volume covering strictly behind z <= -0.02
        const backSkullHair = new THREE.Mesh(
          new THREE.SphereGeometry(0.226, 24, 20, Math.PI, Math.PI, Math.PI * 0.18, Math.PI * 0.68),
          hairBrownMat
        );
        backSkullHair.position.set(0, 0.01, -0.024);
        backSkullHair.scale.set(1.02, 1.05, 1.0);
        backSkullHair.castShadow = true;
        headGroup.add(backSkullHair);

        let crownHairGroup = null;
        let clipGroup = null;

        if (!isGirl) {
          // BOY'S STYLIZED SWEPT QUIFF (encapsulated in crownHairGroup so it hides cleanly under cap or beanie!)
          crownHairGroup = new THREE.Group();
          const boyTufts = [
            // Soft swept front quiff proudly on top of crown
            [0.02, 0.235, 0.075, 0.125, 0.068, 0.095, 0.12, 0.10, -0.26],
            [-0.085, 0.224, 0.068, 0.098, 0.058, 0.085, 0.08, -0.15, 0.28],
            [0.115, 0.215, 0.042, 0.092, 0.055, 0.082, -0.06, 0.18, -0.34],
            [0.0, 0.258, -0.015, 0.145, 0.062, 0.125, -0.14, 0.0, 0.06],
          ];
          for (const [x, y, z, sx, sy, sz, rx, ry, rz] of boyTufts) {
            const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 14), hairBrownMat);
            tuft.position.set(x, y, z);
            tuft.scale.set(sx, sy, sz);
            tuft.rotation.set(rx, ry, rz);
            tuft.castShadow = true;
            crownHairGroup.add(tuft);
          }
          headGroup.add(crownHairGroup);

          // Clean side temples / sideburns strictly behind face plane (always visible with or without hat!)
          const boyTemples = [
            [-0.195, 0.105, -0.035, 0.052, 0.095, 0.078, 0, 0, 0.18],
            [0.195, 0.105, -0.035, 0.052, 0.095, 0.078, 0, 0, -0.18],
          ];
          for (const [x, y, z, sx, sy, sz, rx, ry, rz] of boyTemples) {
            const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), hairBrownMat);
            tuft.position.set(x, y, z);
            tuft.scale.set(sx, sy, sz);
            tuft.rotation.set(rx, ry, rz);
            tuft.castShadow = true;
            headGroup.add(tuft);
          }
        } else {
          // GIRL'S SMOOTH PARTED CROWN (tucked under when wearing beanie)
          crownHairGroup = new THREE.Group();
          const waveL = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), hairBrownMat);
          waveL.position.set(-0.092, 0.212, 0.052);
          waveL.scale.set(0.122, 0.058, 0.098);
          waveL.rotation.set(0.10, -0.18, 0.36);
          waveL.castShadow = true;

          const waveR = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), hairBrownMat);
          waveR.position.set(0.098, 0.208, 0.048);
          waveR.scale.set(0.116, 0.056, 0.096);
          waveR.rotation.set(0.10, 0.18, -0.38);
          waveR.castShadow = true;

          const crownFill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 14), hairBrownMat);
          crownFill.position.set(0, 0.242, -0.02);
          crownFill.scale.set(0.165, 0.052, 0.135);
          crownHairGroup.add(waveL, waveR, crownFill);
          headGroup.add(crownHairGroup);

          // Flowing long back hair curtain positioned strictly behind head/shoulders
          const backCurtain = new THREE.Mesh(new THREE.CapsuleGeometry(0.215, 0.38, 12, 20), hairBrownMat);
          backCurtain.position.set(0, -0.16, -0.155);
          backCurtain.scale.set(1.12, 1.0, 0.52);
          backCurtain.castShadow = true;
          headGroup.add(backCurtain);

          // Smooth framing side locks tucked cleanly BEHIND the ears
          for (const sx of [-1, 1]) {
            const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.34, 10, 14), hairBrownMat);
            sideLock.position.set(sx * 0.208, -0.14, -0.088);
            sideLock.rotation.z = sx * 0.12;
            sideLock.rotation.x = 0.06;
            sideLock.castShadow = true;
            headGroup.add(sideLock);

            const temple = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), hairBrownMat);
            temple.position.set(sx * 0.195, 0.105, -0.035);
            temple.scale.set(0.062, 0.098, 0.085);
            temple.rotation.z = sx * -0.18;
            headGroup.add(temple);
          }

          // Cute Small Pink 5-Petal Flower with Yellow Center tucked cleanly above her right ear
          clipGroup = new THREE.Group();
          clipGroup.position.set(0.188, 0.135, 0.082);
          clipGroup.rotation.set(-0.18, 0.62, -0.16);
          const clipPetalMat = new THREE.MeshStandardMaterial({ color: 0xff7fb0, roughness: 0.42 });
          const clipCenterMat = new THREE.MeshStandardMaterial({ color: 0xffe04a, roughness: 0.38 });
          for (let p = 0; p < 5; p++) {
            const ang = (p / 5) * Math.PI * 2;
            const pet = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), clipPetalMat);
            pet.position.set(Math.cos(ang) * 0.025, Math.sin(ang) * 0.025, 0);
            pet.scale.set(1, 1, 0.55);
            clipGroup.add(pet);
          }
          const clipCtr = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), clipCenterMat);
          clipCtr.position.z = 0.012;
          clipGroup.add(clipCtr);
          headGroup.add(clipGroup);
        }

        return { headGroup, eyeGroups, crownHair: crownHairGroup, clipGroup };
      }

      /**
       * Creates a cute stylized cartoon hand (palm + thumb + 4 small fingers).
       */
      function createCuteHand(mirrorX = 1) {
        const hand = new THREE.Group();
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 12), skinMat);
        palm.scale.set(1.0, 1.05, 0.62);
        hand.add(palm);

        for (let f = 0; f < 4; f++) {
          const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.032, 4, 6), skinMat);
          const fx = (-0.027 + f * 0.018) * mirrorX;
          const fy = 0.044 - Math.abs(f - 1.5) * 0.005;
          finger.position.set(fx, fy, 0);
          finger.rotation.z = (0.14 - f * 0.09) * mirrorX;
          hand.add(finger);
        }
        const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.010, 0.026, 4, 6), skinMat);
        thumb.position.set(-0.042 * mirrorX, 0.008, 0.008);
        thumb.rotation.z = 0.72 * mirrorX;
        hand.add(thumb);
        return hand;
      }

      // ---- BUILD BOY CHARACTER (LEFT) ----
      const boyGroup = new THREE.Group();
      boyGroup.position.set(-0.34, 0, 0);
      coupleGroup.add(boyGroup);

      const sweaterMat = new THREE.MeshStandardMaterial({ color: 0x3372a8, roughness: 0.78 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x343a44, roughness: 0.82 });
      const boyShoeMat = new THREE.MeshStandardMaterial({ color: 0x7a4b2a, roughness: 0.62 });
      const soleMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d6, roughness: 0.75 });

      const boyBody = new THREE.Group();
      boyGroup.add(boyBody);

      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.46, 8, 12), pantsMat);
        leg.position.set(sx * 0.095, 0.34, 0);
        leg.castShadow = true;
        boyBody.add(leg);

        const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), boyShoeMat);
        shoe.position.set(sx * 0.095, 0.055, 0.045);
        shoe.scale.set(0.88, 0.65, 1.48);
        shoe.castShadow = true;
        boyBody.add(shoe);

        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.022, 0.19), soleMat);
        sole.position.set(sx * 0.095, 0.012, 0.045);
        boyBody.add(sole);
      }

      const boyTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.32, 10, 16), sweaterMat);
      boyTorso.position.set(0, 0.84, 0);
      boyTorso.scale.set(1.06, 1.0, 0.78);
      boyTorso.castShadow = true;
      boyBody.add(boyTorso);

      const boyCollar = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.022, 8, 16), whitePvcMat);
      boyCollar.rotation.x = Math.PI / 2;
      boyCollar.position.set(0, 1.08, 0.01);
      boyBody.add(boyCollar);

      // Redesigned Boy Puffy Down Jacket (Cozy, full-torso continuous quilted chambers + insulated sleeves)
      const puffyMat = new THREE.MeshStandardMaterial({
        color: 0x1b2838, // rich charcoal/midnight navy down nylon
        roughness: 0.38,
        metalness: 0.18,
      });
      const boyPuffyGroup = new THREE.Group();

      // 4 Full Continuous Insulated Puffer Torso Chambers forming a seamless down jacket
      const pufferChambers = [
        [0.72, 0.182, 0.07, 1.14, 0.86], // Hem / waist baffle
        [0.81, 0.194, 0.07, 1.16, 0.88], // Mid abdomen baffle
        [0.90, 0.198, 0.07, 1.18, 0.90], // Upper chest baffle
        [0.99, 0.188, 0.07, 1.18, 0.88], // Shoulder / yoke baffle
      ];
      for (const [y, r, h, sx, sz] of pufferChambers) {
        const chamber = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 10, 16), puffyMat);
        chamber.position.set(0, y, 0.005);
        chamber.scale.set(sx, 1.0, sz);
        chamber.castShadow = true;
        chamber.receiveShadow = true;
        boyPuffyGroup.add(chamber);
      }

      // Stand-up Thermal Collar (plump insulated neck ring)
      const puffyCollar = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.038, 10, 24), puffyMat);
      puffyCollar.position.set(0, 1.09, 0.01);
      puffyCollar.rotation.x = Math.PI / 2;
      puffyCollar.castShadow = true;
      boyPuffyGroup.add(puffyCollar);

      // Front Storm Flap with Silver Snap Fasteners
      const stormFlap = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.37, 0.016), puffyMat);
      stormFlap.position.set(0, 0.855, 0.170);
      stormFlap.castShadow = true;
      boyPuffyGroup.add(stormFlap);

      const snapMat = new THREE.MeshStandardMaterial({ color: 0xc4cdd8, metalness: 0.8, roughness: 0.25 });
      for (let s = 0; s < 4; s++) {
        const snap = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12), snapMat);
        snap.rotation.x = Math.PI / 2;
        snap.position.set(0, 0.72 + s * 0.09, 0.179);
        boyPuffyGroup.add(snap);
      }

      boyPuffyGroup.visible = false;
      boyBody.add(boyPuffyGroup);

      // Hard Fleece Hoodie details (kangaroo front pocket + hood draped behind neck)
      const fleeceMat = new THREE.MeshStandardMaterial({ color: 0x3d4f5e, roughness: 0.95 });
      const boyFleeceGroup = new THREE.Group();
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.04), fleeceMat);
      pouch.position.set(0, 0.76, 0.118);
      pouch.castShadow = true;
      const drapedHood = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.032, 8, 16, Math.PI), fleeceMat);
      drapedHood.position.set(0, 1.04, -0.08);
      drapedHood.rotation.x = -0.4;
      boyFleeceGroup.add(pouch, drapedHood);
      boyFleeceGroup.visible = false;
      boyBody.add(boyFleeceGroup);

      // Outerwear Zipper strip
      const zipMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.3, metalness: 0.6 });
      const boyZipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.38, 0.015), zipMat);
      boyZipMesh.position.set(0, 0.86, 0.125);
      boyBody.add(boyZipMesh);

      const boyNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.056, 0.10, 12), skinMat);
      boyNeck.position.set(0, 1.13, 0);
      boyBody.add(boyNeck);

      const boyHeadData = createStylizedHead({ isGirl: false });
      boyHeadData.headGroup.position.set(0, 1.36, 0.02);
      boyBody.add(boyHeadData.headGroup);

      // Boy Eyewear: Clear Glasses vs Dark Sunglasses
      const glassesFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 });
      const clearLensMat = new THREE.MeshStandardMaterial({ color: 0xe8f4f8, transparent: true, opacity: 0.32, roughness: 0.05 });
      const sunLensMat = new THREE.MeshStandardMaterial({ color: 0x111624, transparent: true, opacity: 0.90, roughness: 0.12, metalness: 0.4 });

      // 1. Clear Glasses (default on)
      const boyGlassesGroup = new THREE.Group();
      for (const sx of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.0055, 8, 20), glassesFrameMat);
        rim.position.set(sx * 0.074, 0.022, 0.218);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), clearLensMat);
        lens.position.set(sx * 0.074, 0.022, 0.219);
        boyGlassesGroup.add(rim, lens);
      }
      const gBridge = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.006, 0.006), glassesFrameMat);
      gBridge.position.set(0, 0.026, 0.222);
      boyGlassesGroup.add(gBridge);
      boyHeadData.headGroup.add(boyGlassesGroup);

      // 2. Sunglasses (for sunny scenarios)
      const boySunglassesGroup = new THREE.Group();
      for (const sx of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.006, 8, 20), glassesFrameMat);
        rim.position.set(sx * 0.074, 0.022, 0.218);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.040, 16), sunLensMat);
        lens.position.set(sx * 0.074, 0.022, 0.219);
        boySunglassesGroup.add(rim, lens);
      }
      const sBridge = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.007, 0.006), glassesFrameMat);
      sBridge.position.set(0, 0.026, 0.222);
      boySunglassesGroup.add(sBridge);
      boySunglassesGroup.visible = false;
      boyHeadData.headGroup.add(boySunglassesGroup);

      // Boy Headwear: Baseball Cap vs Knit Beanie
      // 3. Deep 6-panel Baseball Cap with curved arched visor and patch
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1c2b3d, roughness: 0.75 });
      const boyCapGroup = new THREE.Group();

      const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.248, 32, 22, 0, Math.PI * 2, 0, Math.PI * 0.52),
        capMat
      );
      capDome.position.set(0, 0.07, -0.015);
      capDome.rotation.x = -0.32;
      capDome.scale.set(1.02, 1.04, 1.02);
      capDome.castShadow = true;

      const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), capMat);
      capBtn.position.set(0, 0.31, -0.05);

      const visorShape = new THREE.Shape();
      visorShape.moveTo(-0.11, 0);
      visorShape.quadraticCurveTo(0, 0.025, 0.11, 0);
      visorShape.quadraticCurveTo(0.125, 0.09, 0.08, 0.16);
      visorShape.quadraticCurveTo(0, 0.19, -0.08, 0.16);
      visorShape.quadraticCurveTo(-0.125, 0.09, -0.11, 0);

      const visorGeo = new THREE.ExtrudeGeometry(visorShape, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 2,
      });
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.rotation.x = Math.PI / 2 + 0.16;
      visor.position.set(0, 0.118, 0.138);
      visor.castShadow = true;

      const capPatchMat = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.5 });
      const capPatch = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 16), capPatchMat);
      capPatch.position.set(0, 0.18, 0.215);
      capPatch.rotation.x = Math.PI / 2 - 0.32;

      boyCapGroup.add(capDome, capBtn, visor, capPatch);
      boyHeadData.headGroup.add(boyCapGroup);
      if (boyHeadData.crownHair) boyHeadData.crownHair.visible = false;

      // 4. Chunky Knit Beanie (for cold, chilly, snow)
      const beanieMat = new THREE.MeshStandardMaterial({ color: 0x7a2c2c, roughness: 0.95 });
      const boyBeanieGroup = new THREE.Group();

      const beanieCuff = new THREE.Mesh(new THREE.TorusGeometry(0.238, 0.046, 12, 28), beanieMat);
      beanieCuff.position.set(0, 0.135, 0.015);
      beanieCuff.rotation.x = Math.PI / 2 - 0.14;
      beanieCuff.scale.set(1.02, 1.05, 0.98);

      const beanieDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.248, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.54),
        beanieMat
      );
      beanieDome.position.set(0, 0.085, -0.025);
      beanieDome.rotation.x = -0.28;
      beanieDome.scale.set(1.02, 1.10, 1.04);
      beanieDome.castShadow = true;

      const beanieTop = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), beanieMat);
      beanieTop.position.set(0, 0.33, -0.07);

      boyBeanieGroup.add(beanieCuff, beanieDome, beanieTop);
      boyBeanieGroup.visible = false;
      boyHeadData.headGroup.add(boyBeanieGroup);

      // Boy's Inner Arm (holding girl's hand)
      const boyHoldArm = new THREE.Group();
      boyHoldArm.position.set(0.17, 1.00, 0);
      boyHoldArm.rotation.z = 0.42;
      const bhSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.32, 8, 10), sweaterMat);
      bhSleeve.position.y = -0.17;
      bhSleeve.castShadow = true;
      const bhPuffySleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.30, 10, 14), puffyMat);
      bhPuffySleeve.position.y = -0.17;
      bhPuffySleeve.castShadow = true;
      bhPuffySleeve.visible = false;
      const bhHand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), skinMat);
      bhHand.position.y = -0.37;
      boyHoldArm.add(bhSleeve, bhPuffySleeve, bhHand);
      boyBody.add(boyHoldArm);

      // Boy's Outer Arm (raised & waving cheerfully)
      const boyWaveShoulder = new THREE.Group();
      boyWaveShoulder.position.set(-0.17, 1.01, 0.01);
      boyBody.add(boyWaveShoulder);

      const bwUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.18, 8, 10), sweaterMat);
      bwUpper.position.set(-0.09, 0.04, 0);
      bwUpper.rotation.z = Math.PI * 0.38;
      bwUpper.castShadow = true;
      const bwPuffyUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.17, 10, 14), puffyMat);
      bwPuffyUpper.position.set(-0.09, 0.04, 0);
      bwPuffyUpper.rotation.z = Math.PI * 0.38;
      bwPuffyUpper.castShadow = true;
      bwPuffyUpper.visible = false;
      boyWaveShoulder.add(bwUpper, bwPuffyUpper);

      const boyWaveForearm = new THREE.Group();
      boyWaveForearm.position.set(-0.19, 0.09, 0.02);
      boyWaveShoulder.add(boyWaveForearm);

      const bwLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.18, 8, 10), sweaterMat);
      bwLower.position.set(0, 0.11, 0);
      bwLower.castShadow = true;
      const bwPuffyLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.066, 0.17, 10, 14), puffyMat);
      bwPuffyLower.position.set(0, 0.11, 0);
      bwPuffyLower.castShadow = true;
      bwPuffyLower.visible = false;
      const bwHand = createCuteHand(1);
      bwHand.position.set(0, 0.24, 0);
      boyWaveForearm.add(bwLower, bwPuffyLower, bwHand);

      // ---- BUILD GIRL CHARACTER (RIGHT) ----
      const girlGroup = new THREE.Group();
      girlGroup.position.set(0.32, 0, 0.02);
      coupleGroup.add(girlGroup);

      const dressMat = new THREE.MeshStandardMaterial({ color: 0xe86194, roughness: 0.62 });
      const flatMat = new THREE.MeshStandardMaterial({ color: 0xd94b82, roughness: 0.48 });

      const girlBody = new THREE.Group();
      girlGroup.add(girlBody);

      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.42, 8, 12), skinMat);
        leg.position.set(sx * 0.085, 0.29, 0);
        leg.castShadow = true;
        girlBody.add(leg);

        const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 12), flatMat);
        shoe.position.set(sx * 0.085, 0.042, 0.04);
        shoe.scale.set(0.84, 0.56, 1.45);
        shoe.castShadow = true;
        girlBody.add(shoe);
      }

      const dressPts = [
        new THREE.Vector2(0.28, 0.0),
        new THREE.Vector2(0.25, 0.12),
        new THREE.Vector2(0.17, 0.28),
        new THREE.Vector2(0.115, 0.40),
        new THREE.Vector2(0.135, 0.54),
        new THREE.Vector2(0.125, 0.63),
        new THREE.Vector2(0.065, 0.66),
      ];
      const dressMesh = new THREE.Mesh(new THREE.LatheGeometry(dressPts, 28), dressMat);
      dressMesh.position.set(0, 0.36, 0);
      dressMesh.scale.set(1.02, 1.0, 0.88);
      dressMesh.castShadow = true;
      dressMesh.receiveShadow = true;
      girlBody.add(dressMesh);

      const girlNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.050, 0.09, 12), skinMat);
      girlNeck.position.set(0, 1.05, 0);
      girlBody.add(girlNeck);

      const girlHeadData = createStylizedHead({ isGirl: true });
      girlHeadData.headGroup.position.set(0, 1.27, 0.02);
      girlBody.add(girlHeadData.headGroup);

      // Girl's Inner Arm (holding boy's hand)
      const girlHoldArm = new THREE.Group();
      girlHoldArm.position.set(-0.145, 0.94, 0);
      girlHoldArm.rotation.z = -0.45;
      const ghSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.08, 6, 10), dressMat);
      ghSleeve.position.y = -0.05;
      const ghArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.27, 8, 10), skinMat);
      ghArm.position.y = -0.19;
      ghArm.castShadow = true;
      const ghCoatSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.28, 8, 12), dressMat);
      ghCoatSleeve.position.y = -0.19;
      ghCoatSleeve.castShadow = true;
      ghCoatSleeve.visible = false;
      const ghHand = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), skinMat);
      ghHand.position.y = -0.35;
      girlHoldArm.add(ghSleeve, ghArm, ghCoatSleeve, ghHand);
      girlBody.add(girlHoldArm);

      // Girl's Outer Arm (raised & waving cheerfully)
      const girlWaveShoulder = new THREE.Group();
      girlWaveShoulder.position.set(0.145, 0.95, 0.01);
      girlBody.add(girlWaveShoulder);

      const gwSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.08, 6, 10), dressMat);
      gwSleeve.position.set(0.05, 0.02, 0);
      gwSleeve.rotation.z = -Math.PI * 0.36;
      const gwUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 8, 10), skinMat);
      gwUpper.position.set(0.10, 0.05, 0);
      gwUpper.rotation.z = -Math.PI * 0.36;
      gwUpper.castShadow = true;
      const gwCoatUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.16, 8, 10), dressMat);
      gwCoatUpper.position.set(0.10, 0.05, 0);
      gwCoatUpper.rotation.z = -Math.PI * 0.36;
      gwCoatUpper.castShadow = true;
      gwCoatUpper.visible = false;
      girlWaveShoulder.add(gwSleeve, gwUpper, gwCoatUpper);

      const girlWaveForearm = new THREE.Group();
      girlWaveForearm.position.set(0.18, 0.10, 0.02);
      girlWaveShoulder.add(girlWaveForearm);

      const gwLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.033, 0.16, 8, 10), skinMat);
      gwLower.position.set(0, 0.10, 0);
      gwLower.castShadow = true;
      const gwCoatLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.16, 8, 10), dressMat);
      gwCoatLower.position.set(0, 0.10, 0);
      gwCoatLower.castShadow = true;
      gwCoatLower.visible = false;
      const gwHand = createCuteHand(-1);
      gwHand.position.set(0, 0.22, 0);
      girlWaveForearm.add(gwLower, gwCoatLower, gwHand);

      // Girl Eyewear: Cat-Eye Sunglasses (for sunny weather)
      const girlSunglasses = new THREE.Group();
      const gFrameMat = new THREE.MeshStandardMaterial({ color: 0x241820, roughness: 0.3 });
      for (const sx of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.0055, 8, 20), gFrameMat);
        rim.position.set(sx * 0.070, 0.020, 0.215);
        rim.rotation.z = sx * 0.15; // cute subtle cat-eye angle
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.036, 16), sunLensMat);
        lens.position.set(sx * 0.070, 0.020, 0.216);
        girlSunglasses.add(rim, lens);
      }
      const gBridge2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.006), gFrameMat);
      gBridge2.position.set(0, 0.024, 0.218);
      girlSunglasses.add(gBridge2);
      girlSunglasses.visible = false;
      girlHeadData.headGroup.add(girlSunglasses);

      // Girl Knit Beanie with Fluffy Pom-Pom (for cold, snow)
      const girlBeanieMat = new THREE.MeshStandardMaterial({ color: 0x8a3250, roughness: 0.95 });
      const pomPomMat = new THREE.MeshStandardMaterial({ color: 0xf5edf0, roughness: 0.98 });
      const girlBeanieGroup = new THREE.Group();
      const gCuff = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.044, 12, 28), girlBeanieMat);
      gCuff.position.set(0, 0.132, 0.012);
      gCuff.rotation.x = Math.PI / 2 - 0.12;
      gCuff.scale.set(1.02, 1.05, 0.98);

      const gDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.244, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.54),
        girlBeanieMat
      );
      gDome.position.set(0, 0.080, -0.025);
      gDome.rotation.x = -0.28;
      gDome.scale.set(1.02, 1.09, 1.04);
      gDome.castShadow = true;

      const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), pomPomMat);
      pomPom.position.set(0, 0.32, -0.08);
      pomPom.castShadow = true;
      girlBeanieGroup.add(gCuff, gDome, pomPom);
      girlBeanieGroup.visible = false;
      girlHeadData.headGroup.add(girlBeanieGroup);

      // Girl Cozy Cable Knit Scarf (for chilly & cold weather)
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xe8d0b5, roughness: 0.95 });
      const girlScarfGroup = new THREE.Group();
      const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.036, 8, 20), scarfMat);
      neckRing.position.set(0, 1.04, 0.01);
      neckRing.rotation.x = Math.PI / 2;
      neckRing.castShadow = true;
      const scarfTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.16, 6, 8), scarfMat);
      scarfTail.position.set(0.045, 0.91, 0.095);
      scarfTail.rotation.z = 0.15;
      scarfTail.rotation.x = 0.12;
      scarfTail.castShadow = true;
      girlScarfGroup.add(neckRing, scarfTail);
      girlScarfGroup.visible = false;
      girlBody.add(girlScarfGroup);

      // Large 3D Open Rain Umbrella (held aloft shielding the couple)
      const umbrellaGroup = new THREE.Group();
      const umbrellaCanopyMat = new THREE.MeshStandardMaterial({
        color: 0x1d3344,
        roughness: 0.38,
        metalness: 0.15,
        side: THREE.DoubleSide
      });
      const umbrellaMetalMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.3, metalness: 0.8 });
      const umbrellaHandleMat = new THREE.MeshStandardMaterial({ color: 0x3d2215, roughness: 0.6 });

      const umbrellaCanopy = new THREE.Mesh(new THREE.ConeGeometry(0.74, 0.25, 8, 1, true), umbrellaCanopyMat);
      umbrellaCanopy.position.y = 0.52;
      umbrellaCanopy.castShadow = true;

      const umbrellaTip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.08, 8), umbrellaMetalMat);
      umbrellaTip.position.y = 0.68;

      const umbrellaShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 1.15, 10), umbrellaMetalMat);
      umbrellaShaft.position.y = 0.0;

      const umbrellaHandle = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.011, 8, 16, Math.PI), umbrellaHandleMat);
      umbrellaHandle.position.set(0.036, -0.58, 0);
      umbrellaHandle.rotation.z = Math.PI;

      umbrellaGroup.add(umbrellaCanopy, umbrellaTip, umbrellaShaft, umbrellaHandle);
      // Position parented to boyBody so it naturally sways and jumps with the couple
      umbrellaGroup.position.set(0.30, 1.28, 0.08);
      umbrellaGroup.rotation.set(-0.06, 0.0, -0.16);
      umbrellaGroup.visible = false;
      boyBody.add(umbrellaGroup);

      // =======================================================================
      // 11. SIDEWALK, CURB, ASPHALT STREET, WEEDS & DRIFTING 3D CLOUDS
      // =======================================================================
      const groundGroup = new THREE.Group();
      scene.add(groundGroup);

      const swTex = createSidewalkTextures();
      const sidewalkMat = new THREE.MeshStandardMaterial({
        map: swTex.map,
        bumpMap: swTex.bumpMap,
        bumpScale: 0.025,
        roughness: 0.88,
      });
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(26, 0.22, 3.0), sidewalkMat);
      sidewalk.position.set(0, -0.11, 1.05);
      sidewalk.receiveShadow = true;
      groundGroup.add(sidewalk);

      const curbMat = new THREE.MeshStandardMaterial({
        map: createStoneStuccoTexture('#aba296', 1.2),
        roughness: 0.86,
      });
      for (let cx = -12; cx <= 12; cx += 1.6) {
        const curbBlock = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.22, 0.26), curbMat);
        curbBlock.position.set(cx, -0.105, 2.56);
        curbBlock.castShadow = true;
        curbBlock.receiveShadow = true;
        groundGroup.add(curbBlock);
      }

      const asphaltMat = new THREE.MeshStandardMaterial({
        map: createStoneStuccoTexture('#555961', 1.4),
        roughness: 0.94,
      });
      const street = new THREE.Mesh(new THREE.PlaneGeometry(46, 18), asphaltMat);
      street.rotation.x = -Math.PI / 2;
      street.position.set(0, -0.16, 11.5);
      street.receiveShadow = true;
      groundGroup.add(street);

      const backGround = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 26),
        new THREE.MeshStandardMaterial({ color: 0x5c7c48, roughness: 0.95 })
      );
      backGround.rotation.x = -Math.PI / 2;
      backGround.position.set(0, -0.18, -14);
      groundGroup.add(backGround);

      const metalCoverMat = new THREE.MeshStandardMaterial({ color: 0x6f685f, roughness: 0.72, metalness: 0.22 });
      const cover1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.34), metalCoverMat);
      cover1.position.set(1.92, 0.005, 1.38);
      const cover2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.012, 0.36), metalCoverMat);
      cover2.position.set(-3.95, 0.005, 1.56);
      groundGroup.add(cover1, cover2);

      function addGrassTuft(x, z, scale = 1.0) {
        const tuft = new THREE.Group();
        tuft.position.set(x, 0.0, z);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x558a3a, roughness: 0.75 });
        for (let b = 0; b < 7; b++) {
          const blade = new THREE.Mesh(
            new THREE.ConeGeometry(0.022 * scale, (0.14 + Math.random() * 0.12) * scale, 5),
            bladeMat
          );
          const ang = (b / 7) * Math.PI * 2;
          blade.position.set(Math.cos(ang) * 0.04 * scale, 0.07 * scale, Math.sin(ang) * 0.04 * scale);
          blade.rotation.set((Math.random() - 0.5) * 0.5, ang, (Math.random() - 0.5) * 0.6);
          blade.castShadow = true;
          tuft.add(blade);
        }
        groundGroup.add(tuft);
      }

      addGrassTuft(-2.35, 0.12, 1.05);
      addGrassTuft(-2.08, 0.15, 0.85);
      addGrassTuft(3.15, 0.14, 1.15);
      addGrassTuft(3.45, 0.12, 0.8);
      addGrassTuft(-4.75, 0.14, 0.9);
      addGrassTuft(-2.75, 2.66, 0.7);
      addGrassTuft(2.15, 2.68, 0.65);

      // Fluffy Stylized 3D Clouds Drifting Across Sky
      const clouds = [];
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xfffaf2,
        roughness: 0.95,
        metalness: 0.0,
      });

      function createStylizedCloud(x, y, z, scale = 1.0, speed = 0.16) {
        const cGrp = new THREE.Group();
        const puffs = [
          [0, 0, 0, 1.25],
          [-1.05, -0.18, 0.08, 0.92],
          [1.08, -0.14, -0.05, 0.98],
          [-0.45, 0.42, -0.1, 0.95],
          [0.52, 0.36, 0.1, 0.88],
          [1.82, -0.32, 0.04, 0.66],
          [-1.75, -0.34, -0.06, 0.62],
        ];
        const puffGeo = new THREE.SphereGeometry(1, 14, 12);
        for (const [px, py, pz, pr] of puffs) {
          const m = new THREE.Mesh(puffGeo, cloudMat);
          m.position.set(px, py, pz);
          m.scale.set(pr * 1.15, pr * 0.85, pr * 0.88);
          cGrp.add(m);
        }
        cGrp.position.set(x, y, z);
        cGrp.scale.setScalar(scale);
        cGrp.userData = { speed, baseY: y, phase: Math.random() * Math.PI * 2 };
        scene.add(cGrp);
        clouds.push(cGrp);
      }

      createStylizedCloud(-9.5, 9.8, -14.0, 1.35, 0.14);
      createStylizedCloud(5.2, 9.2, -13.0, 1.45, 0.17);
      createStylizedCloud(-1.8, 11.4, -18.5, 1.75, 0.11);
      createStylizedCloud(14.5, 8.6, -15.5, 1.2, 0.15);
      createStylizedCloud(-18.0, 8.8, -16.0, 1.3, 0.16);
      createStylizedCloud(10.5, 12.2, -22.0, 1.9, 0.10);

      // =======================================================================
      // 12. LIGHTING MODES & SMOOTH CAMERA PRESETS
      // =======================================================================
      const lightingPresets = {
        afternoon: {
          skyTop: new THREE.Color('#3b82c4'),
          skyMid: new THREE.Color('#7eb7e4'),
          skyBottom: new THREE.Color('#f7dfc2'),
          fogColor: new THREE.Color('#9fc6e6'),
          sunColor: new THREE.Color('#ffe5be'),
          sunIntensity: 2.38,
          sunPos: new THREE.Vector3(-9.5, 11.5, 9.2),
          hemiSky: new THREE.Color('#cde5ff'),
          hemiGround: new THREE.Color('#966e54'),
          hemiIntensity: 0.92,
          bounceIntensity: 0.44,
          cloudColor: new THREE.Color('#fff9f0'),
          windowGlow: 0.0,
          lanternIntensity: 0.0,
          starOpacity: 0.0,
          exposure: 1.08,
        },
        noon: {
          skyTop: new THREE.Color('#1f6fd1'),
          skyMid: new THREE.Color('#66b3f0'),
          skyBottom: new THREE.Color('#d9eefc'),
          fogColor: new THREE.Color('#b6dcf7'),
          sunColor: new THREE.Color('#ffffff'),
          sunIntensity: 2.65,
          sunPos: new THREE.Vector3(-3.0, 16.5, 8.5),
          hemiSky: new THREE.Color('#e6f4ff'),
          hemiGround: new THREE.Color('#8e8578'),
          hemiIntensity: 1.15,
          bounceIntensity: 0.32,
          cloudColor: new THREE.Color('#ffffff'),
          windowGlow: 0.0,
          lanternIntensity: 0.0,
          starOpacity: 0.0,
          exposure: 1.12,
        },
        dusk: {
          skyTop: new THREE.Color('#101736'),
          skyMid: new THREE.Color('#2c3061'),
          skyBottom: new THREE.Color('#8a4f66'),
          fogColor: new THREE.Color('#25274a'),
          sunColor: new THREE.Color('#8ba8ff'),
          sunIntensity: 0.62,
          sunPos: new THREE.Vector3(8.5, 9.5, 7.5),
          hemiSky: new THREE.Color('#47579c'),
          hemiGround: new THREE.Color('#2a2028'),
          hemiIntensity: 0.62,
          bounceIntensity: 0.16,
          cloudColor: new THREE.Color('#695d7a'),
          windowGlow: 1.65,
          lanternIntensity: 3.4,
          starOpacity: 0.92,
          exposure: 1.05,
        },
        rainy: {
          skyTop: new THREE.Color('#415263'),
          skyMid: new THREE.Color('#687c8e'),
          skyBottom: new THREE.Color('#94a5b3'),
          fogColor: new THREE.Color('#627485'),
          sunColor: new THREE.Color('#b8cad6'),
          sunIntensity: 1.15,
          sunPos: new THREE.Vector3(-4.0, 12.0, 6.0),
          hemiSky: new THREE.Color('#788d9e'),
          hemiGround: new THREE.Color('#474f57'),
          hemiIntensity: 0.72,
          bounceIntensity: 0.18,
          cloudColor: new THREE.Color('#687887'),
          windowGlow: 0.95,
          lanternIntensity: 1.4,
          starOpacity: 0.0,
          exposure: 0.96,
        },
        chilly: {
          skyTop: new THREE.Color('#4c6680'),
          skyMid: new THREE.Color('#7893ab'),
          skyBottom: new THREE.Color('#c2d1de'),
          fogColor: new THREE.Color('#8ea4b8'),
          sunColor: new THREE.Color('#e0eaf2'),
          sunIntensity: 1.6,
          sunPos: new THREE.Vector3(-6.0, 13.0, 7.0),
          hemiSky: new THREE.Color('#94afc7'),
          hemiGround: new THREE.Color('#5c564f'),
          hemiIntensity: 0.82,
          bounceIntensity: 0.28,
          cloudColor: new THREE.Color('#dce6f0'),
          windowGlow: 0.0,
          lanternIntensity: 0.0,
          starOpacity: 0.0,
          exposure: 1.02,
        },
        snow: {
          skyTop: new THREE.Color('#58728a'),
          skyMid: new THREE.Color('#8fa4b5'),
          skyBottom: new THREE.Color('#e2ecf2'),
          fogColor: new THREE.Color('#b8cad6'),
          sunColor: new THREE.Color('#ffffff'),
          sunIntensity: 1.8,
          sunPos: new THREE.Vector3(-4.0, 14.0, 6.0),
          hemiSky: new THREE.Color('#c8dbed'),
          hemiGround: new THREE.Color('#e4edf5'),
          hemiIntensity: 1.05,
          bounceIntensity: 0.52,
          cloudColor: new THREE.Color('#edf4f8'),
          windowGlow: 0.0,
          lanternIntensity: 0.0,
          starOpacity: 0.0,
          exposure: 1.06,
        },
        heavyRain: {
          skyTop: new THREE.Color('#2e3d4c'),
          skyMid: new THREE.Color('#485a6b'),
          skyBottom: new THREE.Color('#6f8294'),
          fogColor: new THREE.Color('#4f6273'),
          sunColor: new THREE.Color('#8fa8bc'),
          sunIntensity: 0.85,
          sunPos: new THREE.Vector3(-3.0, 11.0, 5.0),
          hemiSky: new THREE.Color('#54697d'),
          hemiGround: new THREE.Color('#384048'),
          hemiIntensity: 0.60,
          bounceIntensity: 0.14,
          cloudColor: new THREE.Color('#4a5866'),
          windowGlow: 1.1,
          lanternIntensity: 2.2,
          starOpacity: 0.0,
          exposure: 0.94,
        },
        deluge: {
          skyTop: new THREE.Color('#1c2733'),
          skyMid: new THREE.Color('#2e3d4a'),
          skyBottom: new THREE.Color('#475766'),
          fogColor: new THREE.Color('#2e3e4d'),
          sunColor: new THREE.Color('#6f8599'),
          sunIntensity: 0.55,
          sunPos: new THREE.Vector3(-2.0, 10.0, 4.0),
          hemiSky: new THREE.Color('#3b4b59'),
          hemiGround: new THREE.Color('#242b30'),
          hemiIntensity: 0.48,
          bounceIntensity: 0.10,
          cloudColor: new THREE.Color('#2c3742'),
          windowGlow: 1.45,
          lanternIntensity: 2.8,
          starOpacity: 0.0,
          exposure: 0.90,
        },
      };

    // Rain particle system (high-velocity driving rain streaks)
    const rainCount = 1400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 2 * 3); // 2 vertices per line streak
    const rainSpeeds = new Float32Array(rainCount);
    const rainStreakLens = new Float32Array(rainCount);

    const rainWindX = -0.16;
    const rainWindZ = 0.04;

    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 28;
      const y = Math.random() * 18;
      const z = (Math.random() - 0.5) * 22;
      const len = 0.45 + Math.random() * 0.25;
      rainStreakLens[i] = len;
      rainSpeeds[i] = 18.0 + Math.random() * 8.0;

      // Vertex 0 (head / bottom)
      rainPositions[i * 6 + 0] = x;
      rainPositions[i * 6 + 1] = y;
      rainPositions[i * 6 + 2] = z;

      // Vertex 1 (tail / top, slanted along wind)
      rainPositions[i * 6 + 3] = x - rainWindX * len;
      rainPositions[i * 6 + 4] = y + len;
      rainPositions[i * 6 + 5] = z - rainWindZ * len;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x98caeb,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rainParticles = new THREE.LineSegments(rainGeo, rainMat);
    scene.add(rainParticles);

    // Snow particle system (for winter snow flurries & blizzards)
    const snowCount = 750;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    const snowDrifts = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3 + 0] = (Math.random() - 0.5) * 26;
      snowPositions[i * 3 + 1] = Math.random() * 16;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      snowSpeeds[i] = 1.4 + Math.random() * 1.2;
      snowDrifts[i] = Math.random() * Math.PI * 2;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // Dynamic Reflective Puddles with Concentric Ripples
    const puddlesGroup = new THREE.Group();
    scene.add(puddlesGroup);

    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x141f2a,
      roughness: 0.04,
      metalness: 0.40,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    const puddles = [
      { mesh: new THREE.Mesh(new THREE.CircleGeometry(0.70, 32), puddleMat), pos: new THREE.Vector3(-0.45, -0.152, 4.2), scale: new THREE.Vector3(1.5, 0.85, 1.0) },
      { mesh: new THREE.Mesh(new THREE.CircleGeometry(0.48, 28), puddleMat), pos: new THREE.Vector3(1.25, -0.152, 3.8), scale: new THREE.Vector3(1.2, 0.75, 1.0) },
      { mesh: new THREE.Mesh(new THREE.CircleGeometry(0.58, 30), puddleMat), pos: new THREE.Vector3(-2.8, -0.152, 5.2), scale: new THREE.Vector3(1.6, 0.65, 1.0) },
      { mesh: new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), puddleMat), pos: new THREE.Vector3(0.85, 0.005, 1.8), scale: new THREE.Vector3(1.1, 0.8, 1.0) },
    ];

    puddles.forEach((p) => {
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.x = -Math.PI / 2;
      p.mesh.scale.copy(p.scale);
      p.mesh.receiveShadow = true;
      puddlesGroup.add(p.mesh);
    });

    // Expanding ripple rings inside puddles
    const ripples = [];
    const rippleBaseMat = new THREE.MeshBasicMaterial({
      color: 0xa8cbe4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let i = 0; i < 10; i++) {
      const pIdx = i % puddles.length;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.035, 24), rippleBaseMat.clone());
      ring.rotation.x = -Math.PI / 2;
      const p = puddles[pIdx];
      ring.position.set(
        p.pos.x + (Math.random() - 0.5) * 0.4 * p.scale.x,
        p.pos.y + 0.002,
        p.pos.z + (Math.random() - 0.5) * 0.3 * p.scale.y
      );
      puddlesGroup.add(ring);
      ripples.push({
        mesh: ring,
        pIdx,
        scale: 0.1 + (i / 10) * 1.4,
        maxScale: 1.1 + Math.random() * 0.6,
        speed: 0.75 + Math.random() * 0.45,
      });
    }

    let isRaining = false;
    let isSnowing = false;
    let targetRainOpacity = 0.0;
    let targetPuddleOpacity = 0.0;
    let activeScenarioKey = 'live';
    let lightningFlashTimer = 0;
    let targetLighting = lightingPresets.afternoon;

      const cameraPresets = {
        front: {
          // Full house front view zoomed in slightly
          pos: new THREE.Vector3(0.50, 2.00, 7.00),
          target: new THREE.Vector3(0.30, 1.40, 0.0),
        },
        iso: {
          pos: new THREE.Vector3(-8.2, 5.8, 9.8),
          target: new THREE.Vector3(0.3, 2.35, -0.5),
        },
        window: {
          pos: new THREE.Vector3(-1.05, 3.45, 5.35),
          target: new THREE.Vector3(-0.25, 3.05, -0.35),
        },
        couple: {
          pos: new THREE.Vector3(1.47, 1.48, 3.65),
          target: new THREE.Vector3(1.45, 1.16, 1.05),
        },
      };

      let camAnim = {
        active: false,
        startTime: 0,
        duration: 1.1,
        fromPos: new THREE.Vector3(),
        toPos: new THREE.Vector3(),
        fromTarget: new THREE.Vector3(),
        toTarget: new THREE.Vector3(),
        onComplete: null,
      };

      let introTimer = null;
      let isIntroPlaying = false;

      function cancelIntroSequence() {
        if (introTimer) {
          clearTimeout(introTimer);
          introTimer = null;
        }
        isIntroPlaying = false;
        if (camAnim.onComplete) {
          camAnim.onComplete = null;
        }
      }

      function transitionCameraTo(presetKey, duration = 1.1, onComplete = null) {
        const preset = cameraPresets[presetKey];
        if (!preset) return;
        camAnim.active = true;
        camAnim.startTime = performance.now() / 1000;
        camAnim.duration = duration;
        camAnim.fromPos.copy(camera.position);
        camAnim.toPos.copy(preset.pos);
        camAnim.fromTarget.copy(controls.target);
        camAnim.toTarget.copy(preset.target);
        camAnim.onComplete = onComplete;
      }

      function playIntroSequence(seqOptions = {}) {
        cancelIntroSequence();
        isIntroPlaying = true;

        // Step 1: Start at iso immediately
        camera.position.copy(cameraPresets.iso.pos);
        controls.target.copy(cameraPresets.iso.target);
        controls.update();
        if (seqOptions.onStepChange) seqOptions.onStepChange('iso');

        // After 650ms, glide smoothly to couple view
        introTimer = setTimeout(() => {
          if (!isRunning || !isIntroPlaying) return;
          if (seqOptions.onStepChange) seqOptions.onStepChange('couple');

          transitionCameraTo('couple', 1.35, () => {
            if (!isRunning || !isIntroPlaying) return;
            // Friendly wave & smile bounce on couple arrival
            happyBoost = 0.85;

            // Dwell on couple for 1.3s, then glide smoothly to zoomed front view
            introTimer = setTimeout(() => {
              if (!isRunning || !isIntroPlaying) return;
              if (seqOptions.onStepChange) seqOptions.onStepChange('front');

              transitionCameraTo('front', 1.35, () => {
                isIntroPlaying = false;
                if (seqOptions.onComplete) seqOptions.onComplete();
              });
            }, 1300);
          });
        }, 650);
      }

      controls.addEventListener('start', () => {
        camAnim.active = false;
        cancelIntroSequence();
      });

      if (options.initialCamera && cameraPresets[options.initialCamera]) {
        const p = cameraPresets[options.initialCamera];
        camera.position.copy(p.pos);
        controls.target.copy(p.target);
        controls.update();
      }

    // =======================================================================
    // 13. INTERACTIVE RAYCASTER & SELECTIVE GESTURE CONTROL
    // =======================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let happyBoost = 0.0;
    let pointerDownPos = { x: 0, y: 0 };
    let isMouseDown = false;
    let lastHintTime = 0;

    // Capture-phase wheel listener:
    // Only enables zoom when Ctrl or Cmd is held. Otherwise, lets the page scroll naturally!
    const handleWheelCapture = (e) => {
      const hasCtrl = e.ctrlKey || e.metaKey;
      controls.enableZoom = hasCtrl;
      if (!hasCtrl && options.onControlHint) {
        options.onControlHint('Hold Ctrl + scroll to zoom the 3D scene');
      }
    };
    renderer.domElement.addEventListener('wheel', handleWheelCapture, { passive: true, capture: true });

    // Capture-phase pointerdown listener:
    // On desktop, requires Ctrl to rotate or pan. On mobile, 2 fingers handle zoom/orbit.
    const handlePointerDownCapture = (e) => {
      if (e.pointerType === 'mouse') {
        const hasCtrl = e.ctrlKey || e.metaKey;
        controls.enableRotate = hasCtrl;
        controls.enablePan = hasCtrl;
        isMouseDown = true;
      } else if (e.pointerType === 'touch') {
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDownCapture, { capture: true });

    const handlePointerDown = (e) => {
      pointerDownPos.x = e.clientX;
      pointerDownPos.y = e.clientY;
    };

    const handlePointerUp = (e) => {
      isMouseDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects([coupleGroup], true);
      if (hits.length > 0) {
        happyBoost = 1.0;
        if (options.onToast) {
          options.onToast('Hello from No. 121 Sacre Coeur!');
        }
      }
    };

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([coupleGroup], true);

      // Check if user is attempting to drag mouse without holding Ctrl
      if (e.pointerType === 'mouse' && isMouseDown && !e.ctrlKey && !e.metaKey) {
        const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        const now = performance.now();
        if (dragDist > 12 && now - lastHintTime > 2500) {
          lastHintTime = now;
          if (options.onControlHint) {
            options.onControlHint('Hold Ctrl + drag to orbit the 3D scene');
          }
        }
      }

      // Cursor styling
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
      } else if (e.ctrlKey || e.metaKey) {
        renderer.domElement.style.cursor = isMouseDown ? 'grabbing' : 'grab';
      } else {
        renderer.domElement.style.cursor = 'default';
      }
    };

    // Keyboard Ctrl tracking to adjust cursor and controls actively
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        if (renderer.domElement.style.cursor === 'default') {
          renderer.domElement.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        controls.enableRotate = false;
        controls.enableZoom = false;
        controls.enablePan = false;
        if (renderer.domElement.style.cursor === 'grab' || renderer.domElement.style.cursor === 'grabbing') {
          renderer.domElement.style.cursor = 'default';
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let isAnimating = true;
    let elapsedAnimTime = 0;
    let isRunning = true;
    let isOffscreen = false;
    let animFrameId = null;

    // =======================================================================
    // 15. RESPONSIVE RESIZE HANDLER (DEBOUNCED & UNLINKED FROM CANVAS STYLE)
    // =======================================================================
    let lastW = 0;
    let lastH = 0;
    let customFov = null;
    function onWindowResize() {
      if (!container || !renderer || !camera || !isRunning) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      if (w === 0 || h === 0) return;
      if (Math.abs(w - lastW) < 4 && Math.abs(h - lastH) < 4) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.fov = customFov !== null ? customFov : (w < 640 ? 46 : (w < h ? 42 : 38));
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    let resizeRaf = null;
    const resizeObserver = new ResizeObserver(() => {
      if (!isRunning) return;
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(onWindowResize);
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    // =======================================================================
    // 16. ANIMATION LOOP
    // =======================================================================
    let lastFrameTime = performance.now() / 1000;
    let boyNextBlink = 2.4;
    let girlNextBlink = 3.8;

    function animate() {
      if (!isRunning || isOffscreen) return;
      animFrameId = requestAnimationFrame(animate);

      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - lastFrameTime);
      lastFrameTime = now;

      if (isAnimating) {
        elapsedAnimTime += dt;
      }
      const t = elapsedAnimTime;

      // 1. Smooth Camera Preset Interpolation
      if (camAnim.active) {
        const p = Math.min(1, (now - camAnim.startTime) / camAnim.duration);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, ease);
        controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, ease);
        if (p >= 1) {
          camAnim.active = false;
          if (camAnim.onComplete) {
            const cb = camAnim.onComplete;
            camAnim.onComplete = null;
            cb();
          }
        }
      }

      controls.target.y = Math.max(0.45, Math.min(7.5, controls.target.y));
      controls.target.x = Math.max(-7.5, Math.min(7.5, controls.target.x));
      controls.update();

      // 2. Smooth Lighting & Atmosphere Lerp
      const lerpAmt = Math.min(1, dt * 3.4);
      skyUniforms.topColor.value.lerp(targetLighting.skyTop, lerpAmt);
      skyUniforms.midColor.value.lerp(targetLighting.skyMid, lerpAmt);
      skyUniforms.bottomColor.value.lerp(targetLighting.skyBottom, lerpAmt);
      scene.fog.color.lerp(targetLighting.fogColor, lerpAmt);

      sunLight.color.lerp(targetLighting.sunColor, lerpAmt);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, targetLighting.sunIntensity, lerpAmt);
      sunLight.position.lerp(targetLighting.sunPos, lerpAmt);

      hemiLight.color.lerp(targetLighting.hemiSky, lerpAmt);
      hemiLight.groundColor.lerp(targetLighting.hemiGround, lerpAmt);
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, targetLighting.hemiIntensity, lerpAmt);
      bounceLight.intensity = THREE.MathUtils.lerp(bounceLight.intensity, targetLighting.bounceIntensity, lerpAmt);

      cloudMat.color.lerp(targetLighting.cloudColor, lerpAmt);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, targetLighting.exposure, lerpAmt);
      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetLighting.starOpacity, lerpAmt);

      for (const gm of duskGlowMaterials) {
        gm.emissiveIntensity = THREE.MathUtils.lerp(gm.emissiveIntensity, targetLighting.windowGlow, lerpAmt);
      }
      const curtainGlowTarget = targetLighting.windowGlow * 0.58;
      for (const cm of duskCurtainMaterials) {
        cm.emissiveIntensity = THREE.MathUtils.lerp(cm.emissiveIntensity, curtainGlowTarget, lerpAmt);
      }
      const sheenOpacityTarget = targetLighting.windowGlow > 0.5 ? 0.12 : 0.34;
      for (const sm of glassSheenMaterials) {
        sm.opacity = THREE.MathUtils.lerp(sm.opacity, sheenOpacityTarget, lerpAmt);
      }
      lanternPointLight.intensity = THREE.MathUtils.lerp(lanternPointLight.intensity, targetLighting.lanternIntensity, lerpAmt);
      if (lanternGlowSprite) {
        const targetHalo = targetLighting.lanternIntensity > 0.5 ? 0.85 : 0.0;
        lanternGlowSprite.material.opacity = THREE.MathUtils.lerp(lanternGlowSprite.material.opacity, targetHalo, lerpAmt);
      }

      if (alarmLedMat) {
        alarmLedMat.emissiveIntensity = Math.sin(now * 3.5) > 0.72 ? 2.4 : 0.25;
      }

      // Rain & Dynamic Puddles animation
      if (isRaining) {
        rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, targetRainOpacity > 0 ? targetRainOpacity : 0.75, dt * 3.0);
        puddleMat.opacity = THREE.MathUtils.lerp(puddleMat.opacity, targetPuddleOpacity > 0 ? targetPuddleOpacity : 0.65, dt * 2.0);
        const posArr = rainGeo.attributes.position.array;
        for (let i = 0; i < rainCount; i++) {
          const spd = rainSpeeds[i];
          const len = rainStreakLens[i];
          const dy = spd * dt;
          const dx = rainWindX * spd * dt;
          const dz = rainWindZ * spd * dt;

          posArr[i * 6 + 0] += dx;
          posArr[i * 6 + 1] -= dy;
          posArr[i * 6 + 2] += dz;

          posArr[i * 6 + 3] += dx;
          posArr[i * 6 + 4] -= dy;
          posArr[i * 6 + 5] += dz;

          if (posArr[i * 6 + 1] < 0.05) {
            const nx = (Math.random() - 0.5) * 28;
            const ny = 16.0 + Math.random() * 2.5;
            const nz = (Math.random() - 0.5) * 22;

            posArr[i * 6 + 0] = nx;
            posArr[i * 6 + 1] = ny;
            posArr[i * 6 + 2] = nz;

            posArr[i * 6 + 3] = nx - rainWindX * len;
            posArr[i * 6 + 4] = ny + len;
            posArr[i * 6 + 5] = nz - rainWindZ * len;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;

        // Animate dynamic concentric ripple rings
        const curPuddleOp = puddleMat.opacity;
        for (const r of ripples) {
          r.scale += dt * r.speed;
          const prog = r.scale / r.maxScale;
          r.mesh.scale.set(r.scale, r.scale, 1);
          r.mesh.material.opacity = Math.max(0, (1 - prog) * curPuddleOp * 0.72);
          if (prog >= 1.0) {
            r.scale = 0.05;
            const p = puddles[r.pIdx];
            r.mesh.position.set(
              p.pos.x + (Math.random() - 0.5) * 0.45 * p.scale.x,
              p.pos.y + 0.002,
              p.pos.z + (Math.random() - 0.5) * 0.35 * p.scale.y
            );
          }
        }
      } else {
        if (rainMat.opacity > 0.01) {
          rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, 0.0, dt * 3.0);
        }
        if (puddleMat.opacity > 0.01) {
          puddleMat.opacity = THREE.MathUtils.lerp(puddleMat.opacity, 0.0, dt * 2.5);
          for (const r of ripples) {
            r.mesh.material.opacity = THREE.MathUtils.lerp(r.mesh.material.opacity, 0.0, dt * 4.0);
          }
        }
      }

      // Snow particle animation (soft drifting flakes)
      if (isSnowing) {
        snowMat.opacity = THREE.MathUtils.lerp(snowMat.opacity, 0.88, dt * 2.5);
        const sArr = snowGeo.attributes.position.array;
        for (let i = 0; i < snowCount; i++) {
          sArr[i * 3 + 1] -= snowSpeeds[i] * dt;
          sArr[i * 3 + 0] += Math.sin(t * 1.5 + snowDrifts[i]) * 0.40 * dt;
          if (sArr[i * 3 + 1] < 0.05) {
            sArr[i * 3 + 1] = 15.5;
            sArr[i * 3 + 0] = (Math.random() - 0.5) * 26;
            sArr[i * 3 + 2] = (Math.random() - 0.5) * 20;
          }
        }
        snowGeo.attributes.position.needsUpdate = true;
      } else if (snowMat.opacity > 0.01) {
        snowMat.opacity = THREE.MathUtils.lerp(snowMat.opacity, 0.0, dt * 3.0);
      }

      // Occasional atmospheric lightning flash during Cold Deluge / Thunderstorms
      if (activeScenarioKey === 'cold_deluge') {
        if (lightningFlashTimer > 0) {
          lightningFlashTimer -= dt;
          sunLight.intensity = targetLighting.sunIntensity + 3.2;
        } else if (Math.random() < 0.006) {
          lightningFlashTimer = 0.08 + Math.random() * 0.07;
        }
      }

      // 3. Couple Idle Animations (Sway, Waving, Clean Vertical-Scale Blinks & Tap Jump)
      if (happyBoost > 0) {
        happyBoost = Math.max(0, happyBoost - dt * 1.35);
      }
      const jumpHeight = Math.sin(happyBoost * Math.PI) * 0.22;
      const waveSpeedBoost = 1.0 + happyBoost * 1.7;

      boyBody.position.y = Math.sin(t * 2.2) * 0.015 + jumpHeight;
      boyBody.rotation.z = Math.sin(t * 1.35) * 0.025;
      boyHeadData.headGroup.rotation.z = Math.sin(t * 1.35 - 0.5) * 0.05;
      boyHeadData.headGroup.rotation.y = Math.sin(t * 0.8) * 0.075;

      girlBody.position.y = Math.sin(t * 2.2 + 0.6) * 0.016 + jumpHeight;
      girlBody.rotation.z = Math.sin(t * 1.35 + 0.5) * 0.028;
      girlHeadData.headGroup.rotation.z = Math.sin(t * 1.35) * 0.055;
      girlHeadData.headGroup.rotation.y = Math.sin(t * 0.8 + 0.8) * 0.085;

      boyWaveShoulder.rotation.z = Math.sin(t * 3.6 * waveSpeedBoost) * 0.14;
      boyWaveForearm.rotation.z = 0.15 + Math.sin(t * 5.2 * waveSpeedBoost) * 0.36;

      girlWaveShoulder.rotation.z = -Math.sin(t * 3.6 * waveSpeedBoost + 0.7) * 0.15;
      girlWaveForearm.rotation.z = -0.15 - Math.sin(t * 5.2 * waveSpeedBoost + 0.7) * 0.38;

      // Clean natural eye blinks via vertical eye scale
      const updateEyeBlink = (eyeGroups, nextBlinkTime, setNext) => {
        const dtBlink = now - nextBlinkTime;
        let scaleY = 1.0;
        if (dtBlink >= 0 && dtBlink < 0.15) {
          const phase = Math.sin((dtBlink / 0.15) * Math.PI);
          scaleY = THREE.MathUtils.lerp(1.0, 0.10, phase);
        } else if (dtBlink >= 0.15) {
          setNext(now + 2.6 + Math.random() * 3.2);
        }
        for (const eg of eyeGroups) eg.scale.y = scaleY;
      };

      updateEyeBlink(boyHeadData.eyeGroups, boyNextBlink, (v) => (boyNextBlink = v));
      updateEyeBlink(girlHeadData.eyeGroups, girlNextBlink, (v) => (girlNextBlink = v));

      // 4. Drifting Fluffy 3D Clouds
      if (isAnimating) {
        for (const cloud of clouds) {
          cloud.position.x += cloud.userData.speed * dt;
          cloud.position.y = cloud.userData.baseY + Math.sin(t * 0.45 + cloud.userData.phase) * 0.14;
          if (cloud.position.x > 24) {
            cloud.position.x = -24;
          }
        }
      }

      renderer.render(scene, camera);
    }

    // Start animation loop
    let loadTimeoutId = null;
    if (options.onLoaded) {
      loadTimeoutId = setTimeout(() => {
        if (isRunning && options.onLoaded) {
          options.onLoaded();
        }
      }, 150);
    }
    animFrameId = requestAnimationFrame(animate);

    // If playIntro requested, initiate intro sequence on load
    if (options.playIntro !== false) {
      // Small timeout to allow canvas mount and initial render
      setTimeout(() => {
        if (isRunning) {
          playIntroSequence({
            onStepChange: options.onStepChange,
            onComplete: options.onIntroComplete,
          });
        }
      }, 100);
    }

    // Teardown function
    function destroy() {
      isRunning = false;
      cancelIntroSequence();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (loadTimeoutId) clearTimeout(loadTimeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      renderer.domElement.removeEventListener('wheel', handleWheelCapture, { capture: true });
      renderer.domElement.removeEventListener('pointerdown', handlePointerDownCapture, { capture: true });
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      controls.dispose();

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              if (m.bumpMap) m.bumpMap.dispose();
              if (m.roughnessMap) m.roughnessMap.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.bumpMap) obj.material.bumpMap.dispose();
            if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    function setBoyPuffy(active) {
      boyPuffyGroup.visible = active;
      bhPuffySleeve.visible = active;
      bhSleeve.visible = !active;
      bwPuffyUpper.visible = active;
      bwUpper.visible = !active;
      bwPuffyLower.visible = active;
      bwLower.visible = !active;
      boyTorso.visible = !active;
      boyCollar.visible = !active;
      boyZipMesh.visible = !active;
    }

    function setBoyHeadwear({ cap = false, beanie = false }) {
      boyCapGroup.visible = cap;
      boyBeanieGroup.visible = beanie;
      if (boyHeadData && boyHeadData.crownHair) {
        // Tucks crown hair tufts inside cap or beanie so ZERO hair overflows or clips through!
        boyHeadData.crownHair.visible = !(cap || beanie);
      }
    }

    function setGirlHeadwear({ beanie = false }) {
      girlBeanieGroup.visible = beanie;
      if (girlHeadData && girlHeadData.crownHair) {
        girlHeadData.crownHair.visible = !beanie;
      }
      if (girlHeadData && girlHeadData.clipGroup) {
        girlHeadData.clipGroup.visible = !beanie;
      }
    }

    function setGirlLongSleeves(isLong) {
      ghCoatSleeve.visible = isLong;
      ghArm.visible = !isLong;
      gwCoatUpper.visible = isLong;
      gwUpper.visible = !isLong;
      gwCoatLower.visible = isLong;
      gwLower.visible = !isLong;
    }

    function setWeatherScenario(key) {
      activeScenarioKey = key;

      switch (key) {
        case 'summer':
          targetLighting = lightingPresets.noon;
          isRaining = false;
          isSnowing = false;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.0;
          // Boy: Sunglasses, baseball cap (hair tucked), summer windbreaker over tee
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = true;
          boyGlassesGroup.visible = false;
          sweaterMat.color.setHex(0x3a88c2);
          sweaterMat.roughness = 0.55;
          umbrellaGroup.visible = false;
          // Girl: Sunglasses, summer dress, bare arms
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = true;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(false);
          dressMat.color.setHex(0xe86194);
          break;

        case 'mild':
          targetLighting = lightingPresets.afternoon;
          isRaining = false;
          isSnowing = false;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.0;
          // Boy: Clear glasses, baseball cap (hair tucked), casual sport jacket
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x235b87);
          sweaterMat.roughness = 0.65;
          umbrellaGroup.visible = false;
          // Girl: Chic denim/sport jacket & dress
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(false);
          dressMat.color.setHex(0x3e6892);
          break;

        case 'chilly':
          targetLighting = lightingPresets.chilly;
          isRaining = false;
          isSnowing = false;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.15;
          // Boy: Clear glasses, knit beanie (hair tucked), hard fleece hoodie
          setBoyHeadwear({ beanie: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = true;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x3d4f5e);
          sweaterMat.roughness = 0.95;
          umbrellaGroup.visible = false;
          // Girl: Cozy knit scarf & fleece coat
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = true;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0x8a4568);
          break;

        case 'puffy_cold':
          targetLighting = lightingPresets.snow;
          isRaining = false;
          isSnowing = false;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.0;
          // Boy: Knit beanie (hair tucked), full continuous quilted down puffer jacket & insulated puffy sleeves!
          setBoyHeadwear({ beanie: true });
          setBoyPuffy(true);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          umbrellaGroup.visible = false;
          // Girl: Pom-pom beanie (hair tucked), cozy cable scarf, winter coat
          setGirlHeadwear({ beanie: true });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = true;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xa53258);
          break;

        case 'snow':
          targetLighting = lightingPresets.snow;
          isRaining = false;
          isSnowing = true;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.0;
          // Boy: Knit beanie (hair tucked), quilted down puffer jacket & puffy sleeves, clear glasses
          setBoyHeadwear({ beanie: true });
          setBoyPuffy(true);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          umbrellaGroup.visible = false;
          // Girl: Pom-pom beanie, scarf, winter coat
          setGirlHeadwear({ beanie: true });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = true;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xa53258);
          break;

        case 'light_rain':
          targetLighting = lightingPresets.rainy;
          isRaining = true;
          isSnowing = false;
          targetRainOpacity = 0.50;
          targetPuddleOpacity = 0.50;
          // Boy: Baseball cap, rain jacket, clear glasses, umbrella raised!
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x23687a);
          sweaterMat.roughness = 0.40;
          umbrellaGroup.visible = true;
          // Girl: Classic yellow raincoat & long sleeves!
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xf5a623);
          break;

        case 'heavy_rain':
          targetLighting = lightingPresets.heavyRain;
          isRaining = true;
          isSnowing = false;
          targetRainOpacity = 0.85;
          targetPuddleOpacity = 0.85;
          // Boy: Rain jacket, umbrella raised!
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x1a4e5d);
          sweaterMat.roughness = 0.35;
          umbrellaGroup.visible = true;
          // Girl: Heavy yellow raincoat & long sleeves!
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xf5a623);
          break;

        case 'cold_deluge':
          targetLighting = lightingPresets.deluge;
          isRaining = true;
          isSnowing = false;
          targetRainOpacity = 1.0;
          targetPuddleOpacity = 1.0;
          // Boy: Beanie, heavy storm jacket, umbrella raised!
          setBoyHeadwear({ beanie: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x133d49);
          sweaterMat.roughness = 0.30;
          umbrellaGroup.visible = true;
          // Girl: Heavy raincoat, beanie, scarf & long sleeves!
          setGirlHeadwear({ beanie: true });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = true;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xd48812);
          break;

        case 'clear_night':
          targetLighting = lightingPresets.dusk;
          isRaining = false;
          isSnowing = false;
          targetRainOpacity = 0.0;
          targetPuddleOpacity = 0.0;
          // Boy: Baseball cap, casual evening jacket, clear glasses
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x283b4c);
          sweaterMat.roughness = 0.70;
          umbrellaGroup.visible = false;
          // Girl: Evening jacket & dress
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0x752b48);
          break;

        case 'rain_night':
          targetLighting = lightingPresets.dusk;
          isRaining = true;
          isSnowing = false;
          targetRainOpacity = 0.65;
          targetPuddleOpacity = 0.80;
          // Boy: Rain jacket, umbrella raised!
          setBoyHeadwear({ cap: true });
          setBoyPuffy(false);
          boyFleeceGroup.visible = false;
          boySunglassesGroup.visible = false;
          boyGlassesGroup.visible = true;
          sweaterMat.color.setHex(0x1d4d5e);
          sweaterMat.roughness = 0.38;
          umbrellaGroup.visible = true;
          // Girl: Yellow raincoat!
          setGirlHeadwear({ beanie: false });
          girlSunglasses.visible = false;
          girlScarfGroup.visible = false;
          setGirlLongSleeves(true);
          dressMat.color.setHex(0xf5a623);
          break;

        case 'live':
        default:
          activeScenarioKey = 'live';
          break;
      }
    }

    function setWeatherState({
      isDay = true,
      isRaining: rain = false,
      precipitation = 0,
      temperature = 14,
      weatherCode = 0,
    }) {
      if (activeScenarioKey !== 'live') return;

      const rainVal = Number(precipitation) || 0;
      const code = Number(weatherCode) || 0;
      const temp = Number(temperature) || 14;
      const raining = !!rain || (rainVal > 0.05);

      if (code >= 71 && code <= 86) {
        // Snow conditions
        setWeatherScenario('snow');
      } else if (raining) {
        if (rainVal >= 2.5 && temp < 8) {
          setWeatherScenario('cold_deluge');
        } else if (rainVal >= 2.0) {
          setWeatherScenario(!isDay ? 'rain_night' : 'heavy_rain');
        } else {
          setWeatherScenario(!isDay ? 'rain_night' : 'light_rain');
        }
      } else if (!isDay) {
        setWeatherScenario('clear_night');
      } else if (temp >= 20) {
        setWeatherScenario('summer');
      } else if (temp >= 16) {
        setWeatherScenario('mild');
      } else if (temp >= 7) {
        setWeatherScenario('chilly');
      } else {
        setWeatherScenario('puffy_cold');
      }
      activeScenarioKey = 'live';
    }

    function setLightingPreset(key) {
      if (lightingPresets[key]) {
        targetLighting = lightingPresets[key];
        isRaining = (key === 'rainy' || key === 'heavyRain' || key === 'deluge');
      }
    }

    function setCameraPreset(key, duration) {
      cancelIntroSequence();
      transitionCameraTo(key, duration);
    }

    function triggerWaveJump() {
      happyBoost = 1.0;
      if (options.onToast) {
        options.onToast('Hello from No. 121 Sacre Coeur!');
      }
    }

    function toggleAnimation(val) {
      if (typeof val === 'boolean') {
        isAnimating = val;
      } else {
        isAnimating = !isAnimating;
      }
      return isAnimating;
    }

    function setOffscreen(paused) {
      if (isOffscreen === paused) return;
      isOffscreen = paused;
      if (!isOffscreen && isRunning) {
        lastFrameTime = performance.now() / 1000;
        animFrameId = requestAnimationFrame(animate);
      }
    }

    return {
      setWeatherState,
      setWeatherScenario,
      getActiveScenarioKey: () => activeScenarioKey,
      setCameraPreset,
      setCouplePosition: (x, y, z) => {
        if (typeof x === 'number') coupleGroup.position.x = x;
        if (typeof y === 'number') coupleGroup.position.y = y;
        if (typeof z === 'number') coupleGroup.position.z = z;
      },
      getCouplePosition: () => ({
        x: coupleGroup.position.x,
        y: coupleGroup.position.y,
        z: coupleGroup.position.z,
      }),
      setCameraSettings: ({ posX, posY, posZ, targetX, targetY, targetZ, fov } = {}) => {
        if (typeof posX === 'number') camera.position.x = posX;
        if (typeof posY === 'number') camera.position.y = posY;
        if (typeof posZ === 'number') camera.position.z = posZ;
        if (typeof targetX === 'number') controls.target.x = targetX;
        if (typeof targetY === 'number') controls.target.y = targetY;
        if (typeof targetZ === 'number') controls.target.z = targetZ;
        if (typeof fov === 'number') {
          customFov = fov;
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
        controls.update();
      },
      getCameraSettings: () => ({
        posX: camera.position.x,
        posY: camera.position.y,
        posZ: camera.position.z,
        targetX: controls.target.x,
        targetY: controls.target.y,
        targetZ: controls.target.z,
        fov: camera.fov,
      }),
      playIntroSequence,
      cancelIntroSequence,
      setLightingPreset,
      triggerWaveJump,
      toggleAnimation,
      setOffscreen,
      resize: onWindowResize,
      destroy,
      controls
    };
  }
