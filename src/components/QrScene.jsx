import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import GUI from 'lil-gui';
import qrcode from 'qrcode-generator';

const USER_DEFAULTS = {
  mode: 'URL Link',
  url: 'https://ozony.tech/',
  vName: 'Sabo Sugi',
  vEmail: 'sugirov@gmail.com',
  vPhone1: '+7 708 9635525',
  vPhone2: '',
  vWeb: 'https://sabosugi.framer.website/',
  cutScale: 0.45,
  border: false,
};

export default function QrScene({ payload }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let animationFrameId = 0;
    let currentQR = null;
    let hdriTexture = null;

    const disposableTextures = new Set();
    const disposableMaterials = new Set();
    const disposableGeometries = new Set();

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      18,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
    });

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mount.appendChild(renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(15, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enablePan = false;

    const qrGroup = new THREE.Group();
    scene.add(qrGroup);

    const CAMERA_PRESETS = {
      desktop: {
        fov: 18,
        position: [165, 6, 165],
        target: [0, -5, 0],
        groupPosition: [0, 0, 0],
        groupScale: 1,
      },
      tablet: {
        fov: 22,
        position: [185, 18, 185],
        target: [0, -5, 0],
        groupPosition: [0, 0, 0],
        groupScale: 1,
      },
      mobilePortrait: {
        fov: 27,
        position: [198, 24, 198],
        target: [0, -10, 0],
        groupPosition: [0, 8, 0],
        groupScale: 1.08,
      },
      mobileLandscape: {
        fov: 20,
        position: [138, 8, 138],
        target: [0, -8, 0],
        groupPosition: [-100, -24, 0],
        groupScale: 1.85,
      },
    };

    function isMobileLandscape() {
      return window.innerWidth <= 932 && window.innerWidth > window.innerHeight;
    }

    function getCameraPreset() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;

      if (width <= 932 && isLandscape) {
        return CAMERA_PRESETS.mobileLandscape;
      }

      if (width < 768) {
        return CAMERA_PRESETS.mobilePortrait;
      }

      if (width < 1024) {
        return CAMERA_PRESETS.tablet;
      }

      return CAMERA_PRESETS.desktop;
    }

    const params = {
      mode: USER_DEFAULTS.mode,
      url: payload || USER_DEFAULTS.url,
      vName: USER_DEFAULTS.vName,
      vEmail: USER_DEFAULTS.vEmail,
      vPhone1: USER_DEFAULTS.vPhone1,
      vPhone2: USER_DEFAULTS.vPhone2,
      vWeb: USER_DEFAULTS.vWeb,
      baseSize: 20,
      layerDepth: 1.0,
      fineOpacity: 0.4,
      fineDensity: 0.5,
      cutScale: USER_DEFAULTS.cutScale,
      cutThreshold: 0.5,
      metalness: 0.5,
      roughness: 0.05,
      rotate: true,
      border: USER_DEFAULTS.border,
    };

    function setResponsiveCamera() {
      const preset = getCameraPreset();
      const [x, y, z] = preset.position;
      const [tx, ty, tz] = preset.target;
      const [gx, gy, gz] = preset.groupPosition;

      camera.fov = preset.fov;
      camera.position.set(x, y, z);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();

      qrGroup.position.set(gx, gy, gz);
      qrGroup.scale.setScalar(preset.groupScale);

      controls.target.set(tx, ty, tz);
      controls.autoRotate = isMobileLandscape() ? false : params.rotate;
      controls.update();
    }

    new RGBELoader()
      .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/')
      .load('brown_photostudio_02_2k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        scene.environment = texture;
        hdriTexture = texture;
      });

    function trackTexture(texture) {
      disposableTextures.add(texture);
      return texture;
    }

    function trackMaterial(material) {
      disposableMaterials.add(material);
      return material;
    }

    function trackGeometry(geometry) {
      disposableGeometries.add(geometry);
      return geometry;
    }

    function createMaskedFineNoiseTexture(
      density = 1.0,
      qrData = null,
      useBorder = false
    ) {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, size, size);

      if (!qrData) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return trackTexture(tex);
      }

      const rawCount = qrData.getModuleCount();
      const borderOffset = useBorder ? 1 : 0;
      const totalCount = rawCount + borderOffset * 2;
      const modulePx = size / totalCount;

      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 1.0 - density * 0.5) {
          const alpha = Math.random() * 150;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = alpha;
        } else {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'black';

      for (let r = 0; r < rawCount; r += 1) {
        for (let c = 0; c < rawCount; c += 1) {
          if (qrData.isDark(r, c)) {
            const drawC = c + borderOffset;
            const drawR = r + borderOffset;
            ctx.fillRect(drawC * modulePx, drawR * modulePx, modulePx, modulePx);
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return trackTexture(tex);
    }

    function createVeinsTexture(scale = 1.0, qrData = null, useBorder = false) {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 4;
      ctx.strokeStyle = '#FFFFFF';

      function drawCrack(x, y, angle, width, life) {
        if (life <= 0 || width < 0.2) return;

        const segmentLength = 5 + Math.random() * 15;
        const x2 = x + Math.cos(angle) * segmentLength;
        const y2 = y + Math.sin(angle) * segmentLength;

        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const jaggedness = (Math.random() - 0.5) * 1.5;
        const newAngle = angle + jaggedness;
        const newWidth = width * 0.92;
        const newLife = life - 1;

        drawCrack(x2, y2, newAngle, newWidth, newLife);

        if (Math.random() < 0.08) {
          const splitDir = Math.random() < 0.5 ? -1 : 1;
          const splitAngle = angle + splitDir * (0.4 + Math.random() * 0.5);
          drawCrack(x2, y2, splitAngle, newWidth * 0.7, newLife * 0.7);
        }
      }

      const rootsCount = 15 * scale;

      for (let i = 0; i < rootsCount; i += 1) {
        const startX = Math.random() * size;
        const startY = Math.random() * size;
        const startAngle = Math.random() * Math.PI * 2;
        const startWidth = (Math.random() * 3 + 1) * scale;
        drawCrack(startX, startY, startAngle, startWidth, 50);
      }

      if (qrData) {
        const rawCount = qrData.getModuleCount();
        const borderOffset = useBorder ? 1 : 0;
        const totalCount = rawCount + borderOffset * 2;
        const modulePx = size / totalCount;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'black';

        for (let r = 0; r < rawCount; r += 1) {
          for (let c = 0; c < rawCount; c += 1) {
            if (qrData.isDark(r, c)) {
              const drawC = c + borderOffset;
              const drawR = r + borderOffset;
              ctx.fillRect(drawC * modulePx, drawR * modulePx, modulePx, modulePx);
            }
          }
        }

        ctx.globalCompositeOperation = 'source-over';
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return trackTexture(tex);
    }

    let texFine = createMaskedFineNoiseTexture(
      0.5,
      null,
      USER_DEFAULTS.border
    );

    const materialMetal = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.1,
      })
    );

    const materialSide = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x050505,
        metalness: 0.5,
        roughness: 0.1,
      })
    );

    const materialBase = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x050505,
        metalness: 0.5,
        roughness: 0.1,
      })
    );

    const materialOverlayFine = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        alphaMap: texFine,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    const veinsMaterials = [];

    function initVeinsMaterials() {
      veinsMaterials.length = 0;

      for (let i = 0; i < 6; i += 1) {
        const tex = createVeinsTexture(USER_DEFAULTS.cutScale);
        const mat = trackMaterial(
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            alphaMap: tex,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            depthWrite: true,
          })
        );

        veinsMaterials.push(mat);
      }
    }

    initVeinsMaterials();

    function clearGroup(group) {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);

        if (child.geometry && typeof child.geometry.dispose === 'function') {
          child.geometry.dispose();
        }
      }
    }

    function updateFineTexture() {
      if (materialOverlayFine.alphaMap) {
        materialOverlayFine.alphaMap.dispose();
      }

      texFine = createMaskedFineNoiseTexture(
        params.fineDensity,
        currentQR,
        params.border
      );
      materialOverlayFine.alphaMap = texFine;
      materialOverlayFine.needsUpdate = true;
    }

    function updateAllVeinsTextures() {
      veinsMaterials.forEach((mat) => {
        if (mat.alphaMap) {
          mat.alphaMap.dispose();
        }

        mat.alphaMap = createVeinsTexture(
          params.cutScale,
          currentQR,
          params.border
        );
        mat.needsUpdate = true;
      });
    }

    function generateQR() {
      clearGroup(qrGroup);

      const qr = qrcode(0, 'L');
      currentQR = qr;

      try {
        let stringToEncode = '';

        if (params.mode === 'URL Link') {
          stringToEncode = params.url;
        } else {
          stringToEncode = 'BEGIN:VCARD\nVERSION:3.0\n';
          if (params.vName) stringToEncode += `FN:${params.vName}\n`;
          if (params.vEmail) stringToEncode += `EMAIL:${params.vEmail}\n`;
          if (params.vPhone1) stringToEncode += `TEL;TYPE=CELL:${params.vPhone1}\n`;
          if (params.vPhone2) stringToEncode += `TEL;TYPE=WORK:${params.vPhone2}\n`;
          if (params.vWeb) stringToEncode += `URL:${params.vWeb}\n`;
          stringToEncode += 'END:VCARD';
        }

        qr.addData(stringToEncode);
        qr.make();
      } catch (error) {
        console.warn('Data too long for QR code version', error);
        return;
      }

      updateFineTexture();
      updateAllVeinsTextures();

      const rawCount = qr.getModuleCount();
      const borderOffset = params.border ? 1 : 0;
      const totalCount = rawCount + borderOffset * 2;
      const moduleSize = params.baseSize / totalCount;

      const baseGeometry = trackGeometry(
        new THREE.BoxGeometry(params.baseSize, params.baseSize, params.baseSize)
      );
      const baseCube = new THREE.Mesh(baseGeometry, materialBase);
      baseCube.castShadow = true;
      baseCube.receiveShadow = true;
      qrGroup.add(baseCube);

      const baseDustGeo = trackGeometry(
        new THREE.BoxGeometry(
          params.baseSize + 0.01,
          params.baseSize + 0.01,
          params.baseSize + 0.01
        )
      );
      const baseDust = new THREE.Mesh(baseDustGeo, materialOverlayFine);
      qrGroup.add(baseDust);

      const tileSize = moduleSize * 1.02;
      const blockGeometry = trackGeometry(
        new THREE.BoxGeometry(tileSize, tileSize, params.layerDepth)
      );

      let metalTilesCount = 0;

      for (let r = 0; r < totalCount; r += 1) {
        for (let c = 0; c < totalCount; c += 1) {
          if (
            r < borderOffset ||
            r >= totalCount - borderOffset ||
            c < borderOffset ||
            c >= totalCount - borderOffset
          ) {
            metalTilesCount += 1;
          } else {
            const qrR = r - borderOffset;
            const qrC = c - borderOffset;

            if (!qr.isDark(qrR, qrC)) {
              metalTilesCount += 1;
            }
          }
        }
      }

      const materialsList = [
        materialSide,
        materialSide,
        materialSide,
        materialSide,
        materialMetal,
        materialSide,
      ];

      const totalInstances = metalTilesCount * 6;
      const meshInstanced = new THREE.InstancedMesh(
        blockGeometry,
        materialsList,
        totalInstances
      );

      const dummy = new THREE.Object3D();
      let idx = 0;
      const surfaceDist = params.baseSize / 2 + params.layerDepth / 2;

      for (let face = 0; face < 6; face += 1) {
        for (let r = 0; r < totalCount; r += 1) {
          for (let c = 0; c < totalCount; c += 1) {
            let isMetal = false;

            if (
              r < borderOffset ||
              r >= totalCount - borderOffset ||
              c < borderOffset ||
              c >= totalCount - borderOffset
            ) {
              isMetal = true;
            } else {
              const qrR = r - borderOffset;
              const qrC = c - borderOffset;

              if (!qr.isDark(qrR, qrC)) {
                isMetal = true;
              }
            }

            if (!isMetal) continue;

            const u = (c - totalCount / 2 + 0.5) * moduleSize;
            const v = -(r - totalCount / 2 + 0.5) * moduleSize;

            dummy.rotation.set(0, 0, 0);

            switch (face) {
              case 0:
                dummy.position.set(u, v, surfaceDist);
                break;
              case 1:
                dummy.position.set(-u, v, -surfaceDist);
                dummy.rotation.y = Math.PI;
                break;
              case 2:
                dummy.position.set(u, surfaceDist, -v);
                dummy.rotation.x = -Math.PI / 2;
                break;
              case 3:
                dummy.position.set(u, -surfaceDist, v);
                dummy.rotation.x = Math.PI / 2;
                break;
              case 4:
                dummy.position.set(surfaceDist, v, -u);
                dummy.rotation.y = Math.PI / 2;
                break;
              case 5:
                dummy.position.set(-surfaceDist, v, u);
                dummy.rotation.y = -Math.PI / 2;
                break;
              default:
                break;
            }

            dummy.updateMatrix();
            meshInstanced.setMatrixAt(idx, dummy.matrix);
            idx += 1;
          }
        }
      }

      meshInstanced.castShadow = true;
      meshInstanced.receiveShadow = true;
      qrGroup.add(meshInstanced);

      const overlayPlaneGeo = trackGeometry(
        new THREE.PlaneGeometry(params.baseSize, params.baseSize)
      );

      const dustGroup = new THREE.Group();
      const dustDist = params.baseSize / 2 + params.layerDepth + 0.005;

      for (let i = 0; i < 6; i += 1) {
        const mesh = new THREE.Mesh(overlayPlaneGeo, materialOverlayFine);

        switch (i) {
          case 0:
            mesh.position.z = dustDist;
            break;
          case 1:
            mesh.position.z = -dustDist;
            mesh.rotation.y = Math.PI;
            break;
          case 2:
            mesh.position.y = dustDist;
            mesh.rotation.x = -Math.PI / 2;
            break;
          case 3:
            mesh.position.y = -dustDist;
            mesh.rotation.x = Math.PI / 2;
            break;
          case 4:
            mesh.position.x = dustDist;
            mesh.rotation.y = Math.PI / 2;
            break;
          case 5:
            mesh.position.x = -dustDist;
            mesh.rotation.y = -Math.PI / 2;
            break;
          default:
            break;
        }

        dustGroup.add(mesh);
      }

      qrGroup.add(dustGroup);

      const cutsGroup = new THREE.Group();
      const cutDist = params.baseSize / 2 + params.layerDepth + 0.01;

      for (let i = 0; i < 6; i += 1) {
        const mesh = new THREE.Mesh(overlayPlaneGeo, veinsMaterials[i]);

        switch (i) {
          case 0:
            mesh.position.z = cutDist;
            break;
          case 1:
            mesh.position.z = -cutDist;
            mesh.rotation.y = Math.PI;
            break;
          case 2:
            mesh.position.y = cutDist;
            mesh.rotation.x = -Math.PI / 2;
            break;
          case 3:
            mesh.position.y = -cutDist;
            mesh.rotation.x = Math.PI / 2;
            break;
          case 4:
            mesh.position.x = cutDist;
            mesh.rotation.y = Math.PI / 2;
            break;
          case 5:
            mesh.position.x = -cutDist;
            mesh.rotation.y = -Math.PI / 2;
            break;
          default:
            break;
        }

        cutsGroup.add(mesh);
      }

      qrGroup.add(cutsGroup);

      qrGroup.rotation.set(0, Math.PI * 0.12, 0);

      setResponsiveCamera();
    }

    const isDev = import.meta.env.DEV;
    let gui = null;
    let folderUrl = null;
    let folderVCard = null;

    function updateGuiVisibility(mode) {
      if (!folderUrl || !folderVCard) return;

      if (mode === 'URL Link') {
        folderUrl.show();
        folderVCard.hide();
      } else {
        folderUrl.hide();
        folderVCard.show();
      }
    }

    if (isDev) {
      gui = new GUI({ title: 'QR Settings' });

      folderUrl = gui.addFolder('URL Data');
      folderVCard = gui.addFolder('vCard Data');

      gui
        .add(params, 'mode', ['URL Link', 'vCard'])
        .name('QR Type')
        .onChange((value) => {
          updateGuiVisibility(value);
          generateQR();
        });

      folderUrl.add(params, 'url').name('Link').onFinishChange(generateQR);

      folderVCard.add(params, 'vName').name('Full Name').onFinishChange(generateQR);
      folderVCard.add(params, 'vEmail').name('Email').onFinishChange(generateQR);
      folderVCard.add(params, 'vPhone1').name('Phone 1').onFinishChange(generateQR);
      folderVCard.add(params, 'vPhone2').name('Phone 2').onFinishChange(generateQR);
      folderVCard.add(params, 'vWeb').name('Website').onFinishChange(generateQR);

      gui
        .add(params, 'rotate')
        .name('Auto Rotation')
        .onChange((value) => {
          controls.autoRotate = isMobileLandscape() ? false : value;
        });

      const fGeo = gui.addFolder('Geometry');
      fGeo.add(params, 'border').name('Quiet Zone (Frame)').onChange(generateQR);
      fGeo.add(params, 'layerDepth', 0.01, 1).name('Layer Depth').onChange(generateQR);

      const fFine = gui.addFolder('Layer: Dust (Fine)');
      fFine
        .add(params, 'fineOpacity', 0, 1)
        .name('Opacity')
        .onChange((value) => {
          materialOverlayFine.opacity = value;
        });
      fFine
        .add(params, 'fineDensity', 0.1, 2.0)
        .name('Density')
        .onChange(updateFineTexture);

      const fVeins = gui.addFolder('Layer: Cracks (Cuts)');
      fVeins
        .add(params, 'cutScale', 0.1, 3.0)
        .name('Scale/Frequency')
        .onChange(updateAllVeinsTextures);
      fVeins
        .add(params, 'cutThreshold', 0.0, 0.9)
        .name('Cut Width')
        .onChange((value) => {
          veinsMaterials.forEach((mat) => {
            mat.alphaTest = value;
            mat.needsUpdate = true;
          });
        });

      const fMat = gui.addFolder('Materials (Base)');
      fMat
        .add(params, 'metalness', 0, 1)
        .name('Metalness')
        .onChange((value) => {
          materialMetal.metalness = value;
        });
      fMat
        .add(params, 'roughness', 0, 1)
        .name('Roughness')
        .onChange((value) => {
          materialMetal.roughness = value;
        });

      updateGuiVisibility(params.mode);
    }

    generateQR();
    setResponsiveCamera();

    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      camera.aspect = width / height;
      setResponsiveCamera();
    };

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      if (isMobileLandscape()) {
        qrGroup.rotation.y += 0.01;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      gui?.destroy();
      controls.dispose();

      clearGroup(qrGroup);

      if (scene.environment) {
        scene.environment = null;
      }

      if (hdriTexture) {
        hdriTexture.dispose();
      }

      disposableTextures.forEach((texture) => {
        if (texture && typeof texture.dispose === 'function') texture.dispose();
      });

      disposableMaterials.forEach((material) => {
        if (material && typeof material.dispose === 'function') material.dispose();
      });

      disposableGeometries.forEach((geometry) => {
        if (geometry && typeof geometry.dispose === 'function') geometry.dispose();
      });

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [payload]);

  return <div ref={mountRef} className="qr-scene" />;
}