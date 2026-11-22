import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  ExtrudeGeometry,
  // TextureLoader,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { HotspotId } from '../data/portfolio';
import { FBXLoader } from 'three/examples/jsm/Addons.js';

export type Hotspot = {
  id: HotspotId;
  title: string;
  prompt: string;
  anchor: Object3D;
  beacon: Mesh;
  beaconMaterial: ShaderMaterial;
  groundDisc: Mesh;
  radius: number;
};

export class RoomScene {
  readonly scene = new Scene();
  readonly roomBounds = new Box3(new Vector3(-9.2, 0, -8.2), new Vector3(9.2, 5.6, 8.2));
  readonly blockers: Box3[] = [];
  readonly hotspots: Hotspot[] = [];
  private gltfLoader = new GLTFLoader();
  private workstationGroup: Group | null = null;
  private cpuGraphLine: Line | null = null;
  private cpuUsageHistory: number[] = [];
  private cpuUsage = 0.34;
  private cpuSampleElapsed = 0;
  private achievementEmblem: Group | null = null;
  private achievementHalo: Mesh | null = null;
  private achievementGlowMaterial: MeshStandardMaterial | null = null;
  private achievementJewel: Mesh | null = null;
  private catRoot: Group | null = null;
  private catBody: Mesh | null = null;
  private catHead: Group | null = null;
  private catEyes: Group[] = [];
  private catTail: Group | null = null;
  private experiencePath: CatmullRomCurve3 | null = null;
  private experiencePulse: Mesh | null = null;
  private experienceNodeRings: Mesh[] = [];
  private experienceNodes: Mesh[] = [];
  private skillOrbits: Group[] = [];
  private skillCore: Mesh | null = null;
  private animationTime = 0;

  constructor() {
    this.scene.background = new Color('#0f1722');
    this.scene.fog = null;
    this.buildLights();
    this.buildShell();
    this.buildSetPieces();
  }

  async initialize() {
    await this.loadWorkstationModel();
  }

  mountInto(parent: Scene) {
    parent.add(this.scene);
  }

  update(delta: number, camera: PerspectiveCamera) {
    this.animationTime += delta;
    this.updateCpuGraph(delta);

    if (this.achievementEmblem) {
      this.achievementEmblem.rotation.y = Math.sin(this.animationTime * 0.65) * 0.1;
      this.achievementEmblem.position.y = 2.58 + Math.sin(this.animationTime * 1.1) * 0.025;
    }
    if (this.achievementHalo) {
      this.achievementHalo.rotation.z += delta * 0.22;
    }
    if (this.achievementGlowMaterial) {
      this.achievementGlowMaterial.emissiveIntensity = 0.75 + Math.sin(this.animationTime * 1.8) * 0.22;
    }
    if (this.achievementJewel) {
      const jewelPulse = 1 + Math.sin(this.animationTime * 2.4) * 0.08;
      this.achievementJewel.scale.setScalar(jewelPulse);
    }
    if (this.catTail) {
      this.catTail.rotation.y = Math.sin(this.animationTime * 1.7) * 0.2;
      this.catTail.rotation.z = Math.sin(this.animationTime * 1.15) * 0.12;
    }
    if (this.catRoot) {
      this.catRoot.position.y = Math.sin(this.animationTime * 1.1) * 0.012;
    }
    if (this.catBody) {
      this.catBody.scale.y = 0.58 * (1 + Math.sin(this.animationTime * 2.1) * 0.018);
    }
    if (this.catHead) {
      this.catHead.rotation.y = Math.sin(this.animationTime * 0.55) * 0.045;
      this.catHead.rotation.z = Math.sin(this.animationTime * 0.38) * 0.018;
    }
    const blinkPhase = (this.animationTime + 2.4) % 4.8;
    const blink = blinkPhase < 0.14 ? Math.sin((blinkPhase / 0.14) * Math.PI) : 0;
    this.catEyes.forEach((eyeGroup) => {
      eyeGroup.scale.y = 1 - blink * 0.94;
    });
    if (this.experiencePath && this.experiencePulse) {
      this.experiencePulse.position.copy(this.experiencePath.getPointAt((this.animationTime * 0.11) % 1));
    }
    this.experienceNodeRings.forEach((ring, index) => {
      ring.rotation.x += delta * (index % 2 === 0 ? 0.35 : -0.28);
    });
    this.experienceNodes.forEach((node, index) => {
      node.scale.setScalar(1 + Math.sin(this.animationTime * 2 + index * 1.3) * 0.08);
    });
    this.skillOrbits.forEach((orbit, index) => {
      orbit.rotation.x += delta * (index === 1 ? -0.42 : 0.28);
      orbit.rotation.y += delta * (index === 2 ? 0.38 : 0.18);
    });
    if (this.skillCore) {
      const corePulse = 1 + Math.sin(this.animationTime * 2.2) * 0.06;
      this.skillCore.scale.setScalar(corePulse);
    }

    this.hotspots.forEach((hotspot, index) => {
      const wave = Math.sin(this.animationTime * 1.8 + index * 0.8);
      hotspot.beaconMaterial.uniforms.uOpacity.value = 0.34 + wave * 0.025;
      hotspot.anchor.lookAt(camera.position.x, hotspot.anchor.position.y + 0.4, camera.position.z);
    });
  }

  private updateCpuGraph(delta: number) {
    if (!this.cpuGraphLine || this.cpuUsageHistory.length < 2) return;

    const sampleInterval = 0.12;
    this.cpuSampleElapsed += Math.min(delta, 0.5);
    while (this.cpuSampleElapsed >= sampleInterval) {
      this.cpuSampleElapsed -= sampleInterval;
      this.cpuUsageHistory.shift();

      // CPU load tends to drift gradually, with short bursts when work arrives.
      const drift = (0.34 - this.cpuUsage) * 0.1;
      const noise = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.055;
      const burst = Math.random() < 0.012 ? 0.18 + Math.random() * 0.2 : 0;
      this.cpuUsage = Math.max(0.06, Math.min(0.92, this.cpuUsage + drift + noise + burst));
      this.cpuUsageHistory.push(this.cpuUsage);
    }

    const position = this.cpuGraphLine.geometry.getAttribute('position') as BufferAttribute;
    const step = 0.84 / (this.cpuUsageHistory.length - 1);
    const scroll = this.cpuSampleElapsed / sampleInterval;
    this.cpuUsageHistory.forEach((load, index) => {
      position.setXYZ(index, -0.485, 1.51 + load * 0.34, -0.42 + (index - scroll) * step);
    });
    position.needsUpdate = true;
    this.cpuGraphLine.geometry.computeBoundingSphere();
  }

  private buildLights() {
    const ambient = new AmbientLight('#ffd7b6', 2.05);
    this.scene.add(ambient);

    const warmLight = new PointLight('#ffad72', 28, 16, 2);
    warmLight.position.set(-5.8, 4.4, 3.2);
    this.scene.add(warmLight);

    const coolLight = new PointLight('#66d8ff', 24, 16, 2);
    coolLight.position.set(5.4, 4.2, -3.6);
    this.scene.add(coolLight);

    const rearLight = new PointLight('#8c9eff', 16, 18, 2);
    rearLight.position.set(0, 4.8, -6.4);
    this.scene.add(rearLight);
  }

  private buildShell() {
    const width = 20;
    const depth = 18;
    const height = 5.6;

    const floor = new Mesh(
      new PlaneGeometry(width, depth),
      new MeshStandardMaterial({ color: '#18212d', roughness: 0.95, metalness: 0.08 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const insetRunway = new Mesh(
      new PlaneGeometry(5.8, depth - 1.8),
      new MeshStandardMaterial({ color: '#101922', roughness: 0.92, metalness: 0.1 }),
    );
    insetRunway.rotation.x = -Math.PI / 2;
    insetRunway.position.set(0, 0.01, 0.2);
    this.scene.add(insetRunway);

    const wallMaterial = new MeshStandardMaterial({ color: '#233040', roughness: 0.92 });
    const wallGeometry = new BoxGeometry(width, height, 0.3);

    const backWall = new Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, height * 0.5, -9);
    this.scene.add(backWall);

    const sideWallGeometry = new BoxGeometry(0.3, height, depth);
    const leftWall = new Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-10, height * 0.5, 0);
    this.scene.add(leftWall);

    const rightWall = new Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(10, height * 0.5, 0);
    this.scene.add(rightWall);

    const ceiling = new Mesh(
      new PlaneGeometry(width, depth),
      new MeshStandardMaterial({ color: '#101721', roughness: 1 }),
    );
    ceiling.position.y = height;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

  }

  private buildSetPieces() {
    const deskMaterial = new MeshStandardMaterial({ color: '#5c4634', roughness: 0.88 });
    const darkMaterial = new MeshStandardMaterial({ color: '#121923', roughness: 0.6, metalness: 0.35 });
    const glowMaterial = new MeshStandardMaterial({
      color: '#5de2ff',
      emissive: '#12323a',
      roughness: 0.35,
      metalness: 0.1,
    });

    // this.buildEntryGallery(darkMaterial, glowMaterial);
    this.buildFloorSignage();
    this.buildProjectArchive(darkMaterial, glowMaterial);
    this.buildSkillsLab(darkMaterial, glowMaterial);
    this.buildExperienceArchive(darkMaterial, glowMaterial);
    this.buildAchievementsCorner(darkMaterial);
    // this.buildContactTerminal(darkMaterial, glowMaterial);
    this.buildAmbientProps(deskMaterial, darkMaterial, glowMaterial);

    this.hotspots.push(
      this.createHotspot({
        id: 'about',
        title: 'About Lounge',
        prompt: 'Read profile',
        position: new Vector3(-7.1, 0, 7.1),
      }),
      this.createHotspot({
        id: 'featured-projects',
        title: 'Featured Projects',
        prompt: 'Open flagship work',
        position: new Vector3(0, 0, -5.15),
      }),
      this.createHotspot({
        id: 'project-archive',
        title: 'Project Archive',
        prompt: 'Browse the wider body of work',
        position: new Vector3(7.25, 0, -2.15),
      }),
      this.createHotspot({
        id: 'skills',
        title: 'Skills Lab',
        prompt: 'Inspect strengths and tools',
        position: new Vector3(-6.2, 0, -4.4),
      }),
      this.createHotspot({
        id: 'experience',
        title: 'Experience Archive',
        prompt: 'Walk the timeline',
        position: new Vector3(-6.6, 0, 1.4),
      }),
      this.createHotspot({
        id: 'achievements',
        title: 'Achievements Shelf',
        prompt: 'Review highlights',
        position: new Vector3(6.2, 0, 5.4),
      }),
      this.createHotspot({
        id: 'contact',
        title: 'Contact Terminal',
        prompt: 'Open contact links',
        position: new Vector3(0, 0, 6.1),
      }),
    );
  }

  // private buildEntryGallery(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
  //   const arch = new Mesh(new BoxGeometry(5.2, 0.28, 0.4), darkMaterial);
  //   arch.position.set(0, 3.35, 7.05);
  //   this.scene.add(arch);

  //   const leftPillar = new Mesh(new BoxGeometry(0.42, 3.4, 0.42), darkMaterial);
  //   leftPillar.position.set(-2.2, 1.7, 7.05);
  //   this.scene.add(leftPillar);

  //   const rightPillar = leftPillar.clone();
  //   rightPillar.position.x = 2.2;
  //   this.scene.add(rightPillar);

  //   const sign = new Mesh(new BoxGeometry(3.4, 0.9, 0.08), glowMaterial);
  //   sign.position.set(0, 2.45, 8.4);
  //   this.scene.add(sign);
  // }

  private buildFloorSignage() {
    // const nameSign = this.createFloorTextPlane({
    //   width: 4.8,
    //   height: 1.2,
    //   lines: [
    //     { text: 'DEBJIT SINHA', size: 72, color: '#f5efe3', weight: '700' },
    //     { text: 'Software Developer', size: 34, color: '#8fe7ff', weight: '500' },
    //   ],
    // });
    // nameSign.position.set(0, 1.03, 0.2);
    // this.scene.add(nameSign);

    const instructionSign = this.createFloorTextPlane({
      width: 6.2,
      height: 1.35,
      lines: [
        { text: 'Move: WASD or Drag and rotate the joystick in mobile', size: 34, color: '#f4eadc', weight: '600' },
        { text: 'Interact: E key or tap interact', size: 28, color: '#ffc98d', weight: '500' },
      ],
    });
    instructionSign.position.set(0, 0.031, 4.75);
    this.scene.add(instructionSign);
  }

  private createFloorTextPlane(config: {
    width: number;
    height: number;
    lines: Array<{ text: string; size: number; color: string; weight: string }>;
  }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    if (!context) {
      return new Mesh();
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(10, 18, 28, 0.7)';
    context.fillRect(28, 28, canvas.width - 56, canvas.height - 56);
    context.strokeStyle = 'rgba(143, 231, 255, 0.18)';
    context.lineWidth = 4;
    context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    config.lines.forEach((line, index) => {
      context.font = `${line.weight} ${line.size}px Space Grotesk, Segoe UI, sans-serif`;
      context.fillStyle = line.color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(line.text, canvas.width / 2, 92 + index * 74);
    });

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;

    const plane = new Mesh(
      new PlaneGeometry(config.width, config.height),
      new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide }),
    );
    plane.rotation.x = -Math.PI / 2;
    return plane;
  }

  private async loadWorkstationModel() {
    try {
      const gltf = await this.gltfLoader.loadAsync('/resources/models/low_poly_gaming_desk.glb');
      const workstation = gltf.scene;
      
      // Remove any existing workstation if reloading
      if (this.workstationGroup) {
        this.scene.remove(this.workstationGroup);
      }
      
      this.workstationGroup = new Group();
      this.workstationGroup.position.set(0.7, 1.5, -5.2);
      // this.workstationGroup.rotation.y = (Math.PI);
      
      // Scale down the model to fit the scene (original is ~837 units, we need ~5)
      const scale = 2;
      workstation.scale.set(scale, scale, scale);
      
      workstation.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      this.workstationGroup.add(workstation);
      this.scene.add(this.workstationGroup);
      
      console.log('Workstation group added to scene at position:', this.workstationGroup.position);
      console.log('Applied scale:', scale);
      
      // Add blocker for the workstation area
      this.addBlockerFromCenter(new Vector3(0, 0.8, -6.2), new Vector3(5.2, 1.8, 2.6));
      this.addBlockerFromCenter(new Vector3(3.4, 0.8, -6.42), new Vector3(1.1, 1.8, 1.3));
    } catch (error) {
      console.error('Failed to load workstation GLTF model:', error);
    }
  }

  private buildProjectArchive(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const cabinet = new Group();
    cabinet.position.set(8.3, 0, -2.7);

    const walnut = new MeshStandardMaterial({ color: '#594333', roughness: 0.78 });
    const brass = new MeshStandardMaterial({ color: '#b88652', roughness: 0.4, metalness: 0.62 });
    const inset = new MeshStandardMaterial({ color: '#111b27', roughness: 0.72, metalness: 0.12 });
    const folioColors = ['#d18c58', '#6c91a2', '#b8a06f', '#778b70', '#c37568', '#8a82ad'];

    // A deep timber surround makes the archive read as built-in furniture.
    const back = new Mesh(new BoxGeometry(0.3, 3.5, 5.65), darkMaterial);
    back.position.set(0.08, 1.75, 0);
    cabinet.add(back);

    const insetPanel = new Mesh(new BoxGeometry(0.08, 3.12, 5.25), inset);
    insetPanel.position.set(-0.12, 1.78, 0);
    cabinet.add(insetPanel);

    for (const z of [-2.72, 2.72]) {
      const upright = new Mesh(new BoxGeometry(0.42, 3.5, 0.22), walnut);
      upright.position.set(-0.12, 1.75, z);
      cabinet.add(upright);
    }

    for (const y of [0.12, 1.18, 2.25, 3.38]) {
      const shelf = new Mesh(new BoxGeometry(0.5, 0.16, 5.52), walnut);
      shelf.position.set(-0.12, y, 0);
      cabinet.add(shelf);

      const lightStrip = new Mesh(new BoxGeometry(0.025, 0.035, 4.95), glowMaterial);
      lightStrip.position.set(-0.39, y - 0.1, 0);
      cabinet.add(lightStrip);
    }

    // Three framed project displays sit in the middle bay, facing the room.
    for (const [index, z] of [-1.68, 0, 1.68].entries()) {
      const frame = new Mesh(new BoxGeometry(0.14, 0.76, 1.32), brass);
      frame.position.set(-0.32, 1.72, z);
      cabinet.add(frame);

      const display = new Mesh(
        new BoxGeometry(0.055, 0.62, 1.18),
        new MeshStandardMaterial({
          color: ['#17303a', '#252a3d', '#352b25'][index],
          emissive: ['#0b4552', '#28234a', '#57351f'][index],
          emissiveIntensity: 0.55,
          roughness: 0.38,
          metalness: 0.12,
        }),
      );
      display.position.set(-0.42, 1.72, z);
      cabinet.add(display);

      // Small raised bars suggest a screen header and project metadata.
      const accent = new Mesh(new BoxGeometry(0.035, 0.035, 0.48), glowMaterial);
      accent.position.set(-0.46, 1.94, z + (index === 1 ? 0.28 : -0.21));
      cabinet.add(accent);
      const detail = new Mesh(new BoxGeometry(0.035, 0.025, 0.7), brass);
      detail.position.set(-0.46, 1.54, z + (index === 1 ? 0.52 : 0.08));
      cabinet.add(detail);

      if (index === 1) {
        const chartGrid = new MeshStandardMaterial({
          color: '#31525e',
          emissive: '#18323b',
          emissiveIntensity: 0.7,
          roughness: 0.5,
        });
        const gridZ = new Mesh(new BoxGeometry(0.012, 0.009, 0.88), chartGrid);
        for (const y of [1.57, 1.66, 1.75, 1.84]) {
          const line = gridZ.clone();
          line.position.set(-0.46, y, 0);
          cabinet.add(line);
        }

        this.cpuUsageHistory = Array.from({ length: 32 }, (_, pointIndex) => (
          0.34 + 0.075 * Math.sin(pointIndex * 0.37) + 0.025 * Math.sin(pointIndex * 1.17)
        ));
        this.cpuUsage = this.cpuUsageHistory[this.cpuUsageHistory.length - 1];
        const pointStep = 0.84 / (this.cpuUsageHistory.length - 1);
        const tracePoints = this.cpuUsageHistory.map((load, pointIndex) => new Vector3(
          -0.485,
          1.51 + load * 0.34,
          -0.42 + pointIndex * pointStep,
        ));
        this.cpuGraphLine = new Line(
          new BufferGeometry().setFromPoints(tracePoints),
          new LineBasicMaterial({ color: '#68e9ff', transparent: true, opacity: 0.95 }),
        );
        cabinet.add(this.cpuGraphLine);

        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 384;
        labelCanvas.height = 96;
        const context = labelCanvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
          context.fillStyle = '#9ceeff';
          context.font = 'bold 34px monospace';
          context.textBaseline = 'middle';
          context.fillText('CPU  /  LOAD', 8, 48);

          const label = new Mesh(
            new PlaneGeometry(0.48, 0.12),
            new MeshBasicMaterial({ map: new CanvasTexture(labelCanvas), transparent: true }),
          );
          label.rotation.y = -Math.PI / 2;
          label.position.set(-0.48, 1.94, -0.27);
          cabinet.add(label);
        }
      } else {
        // Fine status marks keep the neighboring displays from reading as blank panels.
        for (let mark = 0; mark < 3; mark += 1) {
          const statusMark = new Mesh(
            new BoxGeometry(0.025, 0.025, 0.12 + mark * 0.08),
            mark === 0 ? glowMaterial : brass,
          );
          statusMark.position.set(-0.46, 1.75 - mark * 0.1, z + 0.28);
          cabinet.add(statusMark);
        }
      }
    }

    // Upright folios add a warm, paper archive detail below the displays.
    for (const [index, z] of [-2.05, -1.78, -1.51, 1.45, 1.72, 1.99].entries()) {
      const height = 0.62 + (index % 3) * 0.09;
      const folio = new Mesh(
        new BoxGeometry(0.32, height, 0.19),
        new MeshStandardMaterial({ color: folioColors[index], roughness: 0.86 }),
      );
      folio.position.set(-0.27, 0.2 + height / 2, z);
      cabinet.add(folio);

      const spine = new Mesh(new BoxGeometry(0.025, 0.045, 0.1), brass);
      spine.position.set(-0.44, 0.2 + height * 0.72, z);
      cabinet.add(spine);
    }

    const cabinetFoot = new Mesh(new BoxGeometry(0.58, 0.24, 5.72), darkMaterial);
    cabinetFoot.position.set(0, 0.12, 0);
    cabinet.add(cabinetFoot);

    this.scene.add(cabinet);
    this.addBlockerFromCenter(new Vector3(8.3, 1.6, -2.7), new Vector3(0.9, 3.4, 5.8));
  }

  private buildSkillsLab(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const rack = new Group();
    rack.position.set(-8.05, 0, -4.4);

    const brass = new MeshStandardMaterial({ color: '#a9804d', roughness: 0.42, metalness: 0.68 });
    const walnut = new MeshStandardMaterial({ color: '#594333', roughness: 0.82 });
    const panel = new Mesh(new BoxGeometry(0.38, 2.68, 3.72), darkMaterial);
    panel.position.set(0, 1.34, 0);
    rack.add(panel);

    for (const z of [-1.84, 1.84]) {
      const stile = new Mesh(new BoxGeometry(0.43, 2.68, 0.08), brass);
      stile.position.set(0.03, 1.34, z);
      rack.add(stile);
    }

    for (const y of [0.43, 2.42]) {
      const shelf = new Mesh(new BoxGeometry(1.05, 0.1, 3.58), walnut);
      shelf.position.set(0.42, y, 0);
      rack.add(shelf);

      const light = new Mesh(new BoxGeometry(0.025, 0.035, 3.24), glowMaterial);
      light.position.set(0.9, y - 0.045, 0);
      rack.add(light);
    }

    const footing = new Mesh(new BoxGeometry(1.12, 0.22, 3.78), darkMaterial);
    footing.position.set(0.4, 0.11, 0);
    rack.add(footing);

    // A small armillary sphere gives the skills display a crafted, interior focal point.
    const pedestal = new Mesh(new CylinderGeometry(0.24, 0.3, 0.16, 16), brass);
    pedestal.position.set(0.53, 0.57, 0);
    rack.add(pedestal);
    const pedestalStem = new Mesh(new CylinderGeometry(0.08, 0.12, 0.72, 12), walnut);
    pedestalStem.position.set(0.53, 1.0, 0);
    rack.add(pedestalStem);

    const orrery = new Group();
    orrery.position.set(0.53, 1.48, 0);
    rack.add(orrery);

    const coreMaterial = new MeshStandardMaterial({
      color: '#a6f2df',
      emissive: '#2ba98e',
      emissiveIntensity: 1.2,
      roughness: 0.24,
      metalness: 0.22,
    });
    const core = new Mesh(new SphereGeometry(0.15, 18, 14), coreMaterial);
    orrery.add(core);
    this.skillCore = core;

    const orbitMaterials = [brass, glowMaterial, brass];
    const orbitRadii = [0.46, 0.36, 0.52];
    const orbitOrientations = [
      new Vector3(0.15, 0.3, 0),
      new Vector3(Math.PI / 2, 0.2, 0.1),
      new Vector3(0.65, Math.PI / 2, -0.35),
    ];
    orbitRadii.forEach((radius, index) => {
      const orbit = new Group();
      orbit.rotation.set(orbitOrientations[index].x, orbitOrientations[index].y, orbitOrientations[index].z);
      const ring = new Mesh(new TorusGeometry(radius, 0.018, 8, 40), orbitMaterials[index]);
      orbit.add(ring);

      const satellite = new Mesh(
        new SphereGeometry(index === 1 ? 0.065 : 0.05, 12, 10),
        index === 1 ? coreMaterial : new MeshStandardMaterial({ color: '#ffd28a', emissive: '#6b3f12', emissiveIntensity: 0.6, metalness: 0.55 }),
      );
      satellite.position.set(radius, 0, 0);
      orbit.add(satellite);
      orrery.add(orbit);
      this.skillOrbits.push(orbit);
    });

    // Quietly fill the shelves with books and ceramic forms so the sculpture feels at home.
    const bookColors = ['#6b4f43', '#82929a', '#b07b50', '#526c63', '#8b7890'];
    [-1.38, -1.08, 1.08, 1.38].forEach((z, index) => {
      const bookHeight = 0.38 + (index % 2) * 0.08;
      const book = new Mesh(
        new BoxGeometry(0.25, bookHeight, 0.18),
        new MeshStandardMaterial({ color: bookColors[index], roughness: 0.88 }),
      );
      book.position.set(0.55, 0.43 + 0.05 + bookHeight / 2, z);
      rack.add(book);

      const bookBand = new Mesh(new BoxGeometry(0.018, 0.045, 0.19), brass);
      bookBand.position.set(0.686, book.position.y, z);
      rack.add(bookBand);
    });

    for (const z of [-1.28, 1.28]) {
      const vase = new Mesh(new CylinderGeometry(0.12, 0.17, 0.27, 12), walnut);
      vase.position.set(0.53, 2.42 + 0.05 + 0.135, z);
      rack.add(vase);

      const vaseLip = new Mesh(new TorusGeometry(0.115, 0.018, 8, 16), brass);
      vaseLip.position.set(0.53, 2.42 + 0.05 + 0.27, z);
      rack.add(vaseLip);
    }

    this.scene.add(rack);
    this.addBlockerFromCenter(new Vector3(-7.55, 1.34, -4.4), new Vector3(1.9, 2.7, 3.9));

    // this.buildSkillsPoster();
  }

  private buildExperienceArchive(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const timeline = new Group();
    timeline.position.set(-7.7, 0, 1.4);

    const bronze = new MeshStandardMaterial({ color: '#b78345', roughness: 0.38, metalness: 0.72 });
    const backing = new Mesh(new BoxGeometry(0.42, 3.12, 5.9), darkMaterial);
    backing.position.set(0, 1.58, 0);
    timeline.add(backing);

    for (const y of [0.08, 3.08]) {
      const trim = new Mesh(new BoxGeometry(0.5, 0.08, 6.02), bronze);
      trim.position.set(0.04, y, 0);
      timeline.add(trim);
    }
    for (const z of [-2.96, 2.96]) {
      const stile = new Mesh(new BoxGeometry(0.5, 3.05, 0.08), bronze);
      stile.position.set(0.04, 1.58, z);
      timeline.add(stile);
    }

    const milestones = [
      { y: 1.02, z: 1.76 },
      { y: 1.7, z: 0 },
      { y: 2.38, z: -1.76 },
    ];

    const nodeMaterial = new MeshStandardMaterial({
      color: '#79eaff',
      emissive: '#178eac',
      emissiveIntensity: 1.15,
      metalness: 0.3,
      roughness: 0.28,
    });
    const milestoneNodes: Vector3[] = [];

    milestones.forEach((milestone, index) => {
      const frame = new Mesh(new BoxGeometry(0.15, 0.76, 1.54), bronze);
      frame.position.set(0.33, milestone.y, milestone.z);
      timeline.add(frame);

      const plaque = new Mesh(new BoxGeometry(0.055, 0.66, 1.44), new MeshStandardMaterial({
        color: '#10202b',
        emissive: ['#10212d', '#1b2030', '#162a31'][index],
        emissiveIntensity: 0.4,
        roughness: 0.48,
        metalness: 0.18,
      }));
      plaque.position.set(0.435, milestone.y, milestone.z);
      timeline.add(plaque);

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 240;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#101c27';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#73e4fa';
        context.font = '600 19px Space Grotesk, Segoe UI, sans-serif';
        context.fillText('CAREER ARCHIVE', 24, 42);
        context.fillStyle = '#f4eadc';
        context.font = '700 58px Space Grotesk, Segoe UI, sans-serif';
        context.fillText(`0${index + 1}`, 24, 119);
        context.fillStyle = '#cbd8df';
        context.font = '500 17px Space Grotesk, Segoe UI, sans-serif';
        context.fillText('MILESTONE', 112, 112);
        context.fillStyle = 'rgba(143, 231, 255, 0.22)';
        context.fillRect(112, 132, 326, 2);

        const barHeights = [16, 28, 21, 38, 25, 33, 19, 42, 29, 35, 23, 39];
        barHeights.forEach((height, barIndex) => {
          const variation = ((barIndex * 3 + index * 5) % 7) * 2;
          context.fillStyle = barIndex % 3 === index ? '#ffc98d' : '#5de2ff';
          context.fillRect(24 + barIndex * 35, 207 - height - variation, 18, height + variation);
        });
        context.fillStyle = '#8ea3b3';
        context.fillRect(20, 208, 420, 2);

        const label = new Mesh(
          new PlaneGeometry(1.4, 0.7),
          new MeshBasicMaterial({ map: new CanvasTexture(canvas), side: DoubleSide }),
        );
        label.rotation.y = Math.PI / 2;
        label.position.set(0.468, milestone.y, milestone.z);
        timeline.add(label);
      }

      for (const yOffset of [-0.29, 0.29]) {
        for (const zOffset of [-0.66, 0.66]) {
          const stud = new Mesh(new SphereGeometry(0.028, 10, 8), bronze);
          stud.position.set(0.48, milestone.y + yOffset, milestone.z + zOffset);
          timeline.add(stud);
        }
      }

      const nodeY = milestone.y - 0.48;
      const nodePosition = new Vector3(0.36, nodeY, milestone.z);
      milestoneNodes.push(nodePosition);

      const mount = new Mesh(new BoxGeometry(0.08, 0.13, 0.08), bronze);
      mount.position.set(0.31, milestone.y - 0.395, milestone.z);
      timeline.add(mount);

      const node = new Mesh(new SphereGeometry(0.11, 16, 12), nodeMaterial);
      node.position.copy(nodePosition);
      timeline.add(node);
      this.experienceNodes.push(node);

      const ring = new Mesh(new TorusGeometry(0.17, 0.018, 8, 24), glowMaterial);
      ring.rotation.y = Math.PI / 2;
      ring.position.copy(nodePosition);
      timeline.add(ring);
      this.experienceNodeRings.push(ring);
    });

    const pathPoints = [
      new Vector3(0.25, 0.55, 2.34),
      milestoneNodes[0],
      new Vector3(0.25, 0.88, 1.14),
      milestoneNodes[1],
      new Vector3(0.25, 1.55, -0.94),
      milestoneNodes[2],
      new Vector3(0.25, 2.62, -2.34),
    ];
    this.experiencePath = new CatmullRomCurve3(pathPoints);
    const pathMesh = new Mesh(
      new TubeGeometry(this.experiencePath, 72, 0.035, 8, false),
      new MeshStandardMaterial({ color: '#52d9f3', emissive: '#167d98', emissiveIntensity: 0.8, roughness: 0.3 }),
    );
    timeline.add(pathMesh);

    const pulse = new Mesh(
      new SphereGeometry(0.085, 14, 12),
      new MeshStandardMaterial({ color: '#e0fbff', emissive: '#52d9f3', emissiveIntensity: 2.2, roughness: 0.2 }),
    );
    timeline.add(pulse);
    this.experiencePulse = pulse;

    this.scene.add(timeline);
    this.addBlockerFromCenter(new Vector3(-7.7, 1.55, 1.4), new Vector3(1.2, 3.2, 6.2));
  }

  private buildAchievementsCorner(darkMaterial: MeshStandardMaterial) {
    const showcase = new Group();
    showcase.position.set(6.7, 0, 3.6);

    const bronze = new MeshStandardMaterial({ color: '#b78345', roughness: 0.34, metalness: 0.78 });
    const gold = new MeshStandardMaterial({
      color: '#ffd27c',
      emissive: '#6b3f12',
      emissiveIntensity: 0.75,
      roughness: 0.28,
      metalness: 0.68,
    });
    const shieldInset = new MeshStandardMaterial({ color: '#172d3a', roughness: 0.38, metalness: 0.42 });
    const cabinetWood = new MeshStandardMaterial({ color: '#493629', roughness: 0.8 });

    const cabinet = new Mesh(new BoxGeometry(2.6, 1.35, 1), darkMaterial);
    cabinet.position.set(0, 0.68, 0);
    showcase.add(cabinet);

    const cabinetFront = new Mesh(new BoxGeometry(2.42, 0.92, 0.08), cabinetWood);
    cabinetFront.position.set(0, 0.67, 0.53);
    showcase.add(cabinetFront);

    for (const y of [0.28, 1.06]) {
      const inlay = new Mesh(new BoxGeometry(2.45, 0.035, 0.1), bronze);
      inlay.position.set(0, y, 0.56);
      showcase.add(inlay);
    }
    for (const x of [-0.78, 0, 0.78]) {
      const drawerPull = new Mesh(new SphereGeometry(0.045, 12, 10), gold);
      drawerPull.position.set(x, 0.67, 0.62);
      showcase.add(drawerPull);
    }

    const top = new Mesh(new BoxGeometry(2.8, 0.09, 1.16), cabinetWood);
    top.position.set(0, 1.4, 0);
    showcase.add(top);

    for (const x of [-0.9, 0.9]) {
      const trophyBase = new Mesh(new CylinderGeometry(0.13, 0.17, 0.14, 16), bronze);
      trophyBase.position.set(x, 1.52, 0.03);
      showcase.add(trophyBase);

      const stem = new Mesh(new CylinderGeometry(0.055, 0.075, 0.2, 12), gold);
      stem.position.set(x, 1.68, 0.03);
      showcase.add(stem);

      const cup = new Mesh(new CylinderGeometry(0.2, 0.11, 0.25, 16, 1, true), gold);
      cup.position.set(x, 1.9, 0.03);
      showcase.add(cup);

      for (const side of [-1, 1]) {
        const handle = new Mesh(new TorusGeometry(0.12, 0.025, 8, 16), bronze);
        handle.position.set(x + side * 0.16, 1.91, 0.03);
        showcase.add(handle);
      }
    }

    const backboard = new Mesh(new BoxGeometry(3.15, 2.42, 0.16), darkMaterial);
    backboard.position.set(0, 2.67, -0.42);
    showcase.add(backboard);

    for (const y of [1.47, 3.87]) {
      const rail = new Mesh(new BoxGeometry(3.2, 0.055, 0.2), bronze);
      rail.position.set(0, y, -0.32);
      showcase.add(rail);
    }
    for (const x of [-1.57, 1.57]) {
      const rail = new Mesh(new BoxGeometry(0.055, 2.4, 0.2), bronze);
      rail.position.set(x, 2.67, -0.32);
      showcase.add(rail);
    }

    const emblem = new Group();
    emblem.position.set(0, 2.58, -0.2);
    showcase.add(emblem);
    this.achievementEmblem = emblem;

    const haloMaterial = new MeshStandardMaterial({
      color: '#5de2ff',
      emissive: '#123d50',
      emissiveIntensity: 0.9,
      metalness: 0.38,
      roughness: 0.3,
    });
    const halo = new Mesh(new TorusGeometry(0.84, 0.025, 10, 64), haloMaterial);
    halo.scale.y = 1.18;
    halo.position.z = -0.035;
    emblem.add(halo);
    this.achievementHalo = halo;
    this.achievementGlowMaterial = haloMaterial;

    const shieldShape = (scale: number) => {
      const shape = new Shape();
      shape.moveTo(-0.58 * scale, 0.62 * scale);
      shape.lineTo(0.58 * scale, 0.62 * scale);
      shape.lineTo(0.52 * scale, -0.12 * scale);
      shape.quadraticCurveTo(0.43 * scale, -0.55 * scale, 0, -0.82 * scale);
      shape.quadraticCurveTo(-0.43 * scale, -0.55 * scale, -0.52 * scale, -0.12 * scale);
      shape.closePath();
      return shape;
    };
    const outerShield = new Mesh(
      new ExtrudeGeometry(shieldShape(1), { depth: 0.14, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.035, bevelThickness: 0.035 }),
      gold,
    );
    emblem.add(outerShield);

    const innerShield = new Mesh(
      new ExtrudeGeometry(shieldShape(0.84), { depth: 0.075, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.018, bevelThickness: 0.018 }),
      shieldInset,
    );
    innerShield.position.set(0, 0, 0.12);
    emblem.add(innerShield);

    const medallion = new Mesh(new CylinderGeometry(0.22, 0.22, 0.075, 20), bronze);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 0.08, 0.25);
    emblem.add(medallion);
    const medallionRim = new Mesh(new TorusGeometry(0.18, 0.018, 8, 24), gold);
    medallionRim.position.set(0, 0.08, 0.3);
    emblem.add(medallionRim);

    const jewelMaterial = new MeshStandardMaterial({
      color: '#8ef2ff',
      emissive: '#1eb9d6',
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.25,
    });
    const jewel = new Mesh(new SphereGeometry(0.085, 16, 12), jewelMaterial);
    jewel.position.set(0, 0.08, 0.32);
    emblem.add(jewel);
    this.achievementJewel = jewel;

    // Engraved laurel leaves flank the central jewel.
    for (const side of [-1, 1]) {
      for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
        const leaf = new Mesh(new SphereGeometry(0.075, 10, 8), gold);
        leaf.scale.set(0.7, 1.5, 0.35);
        leaf.position.set(side * (0.3 + leafIndex * 0.035), 0.27 - leafIndex * 0.18, 0.205);
        leaf.rotation.z = side * (0.55 - leafIndex * 0.18);
        emblem.add(leaf);
      }
    }

    const metricCards = [
      { x: -1.12, heading: '51%', caption: 'FASTER LCP' },
      { x: 1.12, heading: '2×', caption: 'IMPRESSIONS' },
    ];
    for (const card of metricCards) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#111e2a';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#b78345';
        context.lineWidth = 5;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        context.textAlign = 'center';
        context.fillStyle = '#ffe0a3';
        context.font = 'bold 52px Space Grotesk, Segoe UI, sans-serif';
        context.fillText(card.heading, 128, 70);
        context.fillStyle = '#a9c3d1';
        context.font = '600 18px Space Grotesk, Segoe UI, sans-serif';
        context.fillText(card.caption, 128, 116);

        // const plaque = new Mesh(
        //   new PlaneGeometry(0.7, 0.44),
        //   new MeshBasicMaterial({ map: new CanvasTexture(canvas), side: DoubleSide }),
        // );
        // plaque.position.set(card.x, 2.62, -0.18);
        // showcase.add(plaque);
      }
    }

    this.scene.add(showcase);
    this.addBlockerFromCenter(new Vector3(6.7, 0.85, 3.6), new Vector3(3, 1.8, 1.5));
  }

  private buildCat() {
    const cat = new Group();
    cat.position.set(-4.65, 0, 5.2);
    cat.rotation.y = 0;
    cat.scale.setScalar(0.78);
    this.catRoot = cat;

    const ginger = new MeshStandardMaterial({ color: '#c8753f', roughness: 0.88 });
    const tabby = new MeshStandardMaterial({ color: '#985331', roughness: 0.9 });
    const cream = new MeshStandardMaterial({ color: '#f2d8b5', roughness: 0.92 });
    const darkFur = new MeshStandardMaterial({ color: '#49352e', roughness: 0.8 });
    const pink = new MeshStandardMaterial({ color: '#df8b87', roughness: 0.58 });
    const eye = new MeshStandardMaterial({ color: '#17251c', roughness: 0.25 });
    const iris = new MeshStandardMaterial({ color: '#9dc66e', roughness: 0.28 });
    const collarMaterial = new MeshStandardMaterial({ color: '#5de2ff', emissive: '#12323a', roughness: 0.38, metalness: 0.2 });

    const addEllipsoid = (parent: Group, material: MeshStandardMaterial, position: Vector3, scale: Vector3) => {
      const mesh = new Mesh(new SphereGeometry(1, 16, 12), material);
      mesh.position.copy(position);
      mesh.scale.copy(scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // A rounded seated pose with a pale chest and tucked paws.
    this.catBody = addEllipsoid(cat, ginger, new Vector3(0, 0.58, 0), new Vector3(0.38, 0.58, 0.34));
    addEllipsoid(cat, cream, new Vector3(0, 0.72, 0.255), new Vector3(0.25, 0.4, 0.17));
    addEllipsoid(cat, darkFur, new Vector3(-0.19, 0.19, 0.24), new Vector3(0.16, 0.18, 0.2));
    addEllipsoid(cat, darkFur, new Vector3(0.19, 0.19, 0.24), new Vector3(0.16, 0.18, 0.2));

    for (const side of [-1, 1]) {
      for (const toe of [-1, 0, 1]) {
        addEllipsoid(
          cat,
          pink,
          new Vector3(side * 0.19 + toe * 0.045, 0.16, 0.419),
          new Vector3(0.022, 0.018, 0.012),
        );
      }
    }

    // A few soft tabby stripes break up the smooth coat without making it busy.
    for (const side of [-1, 1]) {
      for (const stripe of [0, 1]) {
        const marking = addEllipsoid(
          cat,
          tabby,
          new Vector3(side * (0.29 - stripe * 0.045), 0.68 + stripe * 0.15, 0.09 - stripe * 0.03),
          new Vector3(0.035, 0.13, 0.055),
        );
        marking.rotation.z = side * -0.22;
      }
    }

    const head = new Group();
    head.position.set(0, 1.17, 0.08);
    cat.add(head);
    this.catHead = head;
    addEllipsoid(head, ginger, new Vector3(0, 0.12, 0.05), new Vector3(0.35, 0.33, 0.31));

    for (const x of [-0.095, 0, 0.095]) {
      const foreheadStripe = addEllipsoid(head, tabby, new Vector3(x, 0.34, 0.32), new Vector3(0.028, 0.075, 0.016));
      foreheadStripe.rotation.z = x * -1.4;
    }

    for (const side of [-1, 1]) {
      const ear = new Mesh(new ConeGeometry(0.17, 0.34, 3), ginger);
      ear.position.set(side * 0.23, 0.4, 0.015);
      ear.rotation.z = side * -0.12;
      ear.castShadow = true;
      head.add(ear);

      const innerEar = new Mesh(new ConeGeometry(0.09, 0.21, 3), pink);
      innerEar.position.set(side * 0.23, 0.405, 0.105);
      innerEar.rotation.z = side * -0.12;
      head.add(innerEar);

      const eyeGroup = new Group();
      eyeGroup.position.set(side * 0.13, 0.15, 0.327);
      head.add(eyeGroup);
      this.catEyes.push(eyeGroup);
      addEllipsoid(eyeGroup, eye, new Vector3(0, 0, 0), new Vector3(0.062, 0.075, 0.035));
      addEllipsoid(eyeGroup, iris, new Vector3(0, 0, 0.027), new Vector3(0.031, 0.047, 0.018));
      addEllipsoid(eyeGroup, darkFur, new Vector3(0, 0, 0.042), new Vector3(0.012, 0.034, 0.009));
      addEllipsoid(head, cream, new Vector3(side * 0.075, -0.015, 0.33), new Vector3(0.095, 0.07, 0.065));
      addEllipsoid(head, darkFur, new Vector3(side * 0.055, -0.025, 0.392), new Vector3(0.012, 0.012, 0.008));

      for (const whiskerOffset of [-0.045, 0.015, 0.07]) {
        const start = new Vector3(side * 0.14, -0.02 + whiskerOffset, 0.35);
        const end = new Vector3(side * (0.39 + Math.abs(whiskerOffset)), -0.035 + whiskerOffset * 1.5, 0.36);
        const direction = end.clone().sub(start);
        const whisker = new Mesh(new CylinderGeometry(0.004, 0.006, direction.length(), 5), cream);
        whisker.position.copy(start).add(end).multiplyScalar(0.5);
        whisker.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
        head.add(whisker);
      }
    }

    const nose = new Mesh(new ConeGeometry(0.045, 0.06, 3), pink);
    nose.position.set(0, 0.035, 0.405);
    nose.rotation.x = Math.PI;
    head.add(nose);
    for (const side of [-1, 1]) {
      const mouthLine = new Mesh(new CylinderGeometry(0.006, 0.006, 0.055, 5), darkFur);
      mouthLine.position.set(side * 0.018, -0.055, 0.411);
      mouthLine.rotation.z = side * 0.45;
      head.add(mouthLine);
    }

    const collar = new Mesh(new TorusGeometry(0.23, 0.027, 8, 24), collarMaterial);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.99, 0.04);
    cat.add(collar);
    const bell = new Mesh(
      new SphereGeometry(0.055, 12, 10),
      new MeshStandardMaterial({ color: '#ffd27c', metalness: 0.6, roughness: 0.32 }),
    );
    bell.position.set(0, 0.91, 0.275);
    cat.add(bell);

    const tail = new Group();
    tail.position.set(0.28, 0.48, -0.08);
    const tailCurve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.22, -0.04, -0.12),
      new Vector3(0.42, 0.12, -0.22),
      new Vector3(0.47, 0.4, -0.21),
      new Vector3(0.31, 0.58, -0.16),
    ]);
    const tailMesh = new Mesh(new TubeGeometry(tailCurve, 24, 0.075, 8, false), ginger);
    tailMesh.castShadow = true;
    tail.add(tailMesh);
    for (const t of [0.35, 0.62, 0.86]) {
      const tailBand = new Mesh(new TorusGeometry(0.061, 0.012, 6, 14), tabby);
      tailBand.position.copy(tailCurve.getPointAt(t));
      tailBand.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), tailCurve.getTangentAt(t).normalize());
      tail.add(tailBand);
    }
    cat.add(tail);
    this.catTail = tail;

    this.scene.add(cat);
    this.addBlockerFromCenter(new Vector3(-4.65, 0.8, 5.2), new Vector3(1, 1.6, 1));
  }

  // private buildContactTerminal(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
  //   const terminal = new Group();
  //   terminal.position.set(0, 0, 6.2);

  //   const pedestal = new Mesh(new CylinderGeometry(0.7, 0.82, 1.18, 14), darkMaterial);
  //   pedestal.position.y = 0.59;
  //   terminal.add(pedestal);

  //   const screenArm = new Mesh(new BoxGeometry(0.18, 1.1, 0.18), darkMaterial);
  //   screenArm.position.set(0, 1.55, -0.18);
  //   terminal.add(screenArm);

  //   const screen = new Mesh(new BoxGeometry(1.85, 1.05, 0.12), glowMaterial);
  //   screen.position.set(0, 2.15, -0.42);
  //   terminal.add(screen);

  //   const keyboard = new Mesh(new BoxGeometry(1.45, 0.08, 0.62), darkMaterial);
  //   keyboard.position.set(0, 1.2, 0.26);
  //   terminal.add(keyboard);

  //   this.scene.add(terminal);
  //   this.addBlockerFromCenter(new Vector3(0, 1.1, 6.2), new Vector3(2.4, 2.4, 1.8));
  // }

  private async buildAmbientProps(
    _deskMaterial: MeshStandardMaterial,
    _darkMaterial: MeshStandardMaterial,
    _glowMaterial: MeshStandardMaterial,
  ) {
    // const lounge = new Group();
    // lounge.position.set(-7.15, 0, 5.15);

    // const sofaBase = new Mesh(new BoxGeometry(2.8, 0.55, 1.15), darkMaterial);
    // sofaBase.position.set(0, 0.28, 0);
    // lounge.add(sofaBase);

    // const sofaBack = new Mesh(new BoxGeometry(2.8, 0.95, 0.22), darkMaterial);
    // sofaBack.position.set(0, 0.8, -0.48);
    // lounge.add(sofaBack);

    // const coffeeTable = new Mesh(new BoxGeometry(1.2, 0.12, 0.74), deskMaterial);
    // coffeeTable.position.set(0.15, 0.36, 1.1);
    // lounge.add(coffeeTable);
    const loader = new FBXLoader();
    const lounge = await new Promise<Object3D>((resolve, reject) => {
      loader.load('/resources/models/sofa.fbx', resolve, undefined, reject);
    });
    lounge.scale.set(0.02, 0.04, 0.02);
    lounge.position.set(-7.15, 0, 5.15);
    this.scene.add(lounge);
    this.buildCat();
    this.addBlockerFromCenter(new Vector3(-7.15, 0.55, 5.15), new Vector3(4.1, 1.3, 1.4));

    const planterLeft = await this.createPlanter();
    planterLeft.position.set(-8.3, 0, 7.2);
    this.scene.add(planterLeft);

    const planterRight = await this.createPlanter();
    planterRight.position.set(-6, 0, 7.2);
    this.scene.add(planterRight);
  }

  private async createPlanter() {
    const gltf = await this.gltfLoader.loadAsync('/resources/models/pot_plant.glb');
    const planter = gltf.scene;
    planter.scale.set(10, 10, 10);

    return planter;
  }

  private createHotspot(config: {
    id: HotspotId;
    title: string;
    prompt: string;
    position: Vector3;
  }): Hotspot {
    const group = new Group();
    group.position.copy(config.position);

    const beaconMaterial = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color('#ff5b91') },
        uOpacity: { value: 0.34 },
        uHeight: { value: 1.82 },
      },
      vertexShader: `
        varying float vHeight;
        void main() {
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uHeight;
        varying float vHeight;
        void main() {
          float heightRatio = (vHeight + uHeight * 0.5) / uHeight;
          float fadeIn = smoothstep(0.0, 0.2, heightRatio);
          float fadeOut = 1.0 - smoothstep(0.34, 1.0, heightRatio);
          float fade = fadeIn * fadeOut;
          gl_FragColor = vec4(uColor, uOpacity * fade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    const beacon = new Mesh(new CylinderGeometry(0.48, 0.48, 1.82, 40, 24, true), beaconMaterial);
    beacon.position.y = 0.93;
    group.add(beacon);

    const groundDisc = new Mesh(
      new CylinderGeometry(0.48, 0.48, 0.035, 40),
      new MeshBasicMaterial({ color: '#ff5b91', transparent: true, opacity: 0.12, depthWrite: false }),
    );
    groundDisc.position.y = 0.018;
    group.add(groundDisc);

    this.scene.add(group);

    return {
      id: config.id,
      title: config.title,
      prompt: config.prompt,
      anchor: group,
      beacon,
      beaconMaterial,
      groundDisc,
      radius: 1.9,
    };
  }

  private addBlockerFromCenter(center: Vector3, size: Vector3) {
    const blocker = new Box3().setFromCenterAndSize(center, size);
    this.blockers.push(blocker);
  }
}
