import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { HotspotId } from '../data/portfolio';

export type Hotspot = {
  id: HotspotId;
  title: string;
  prompt: string;
  anchor: Object3D;
  radius: number;
};

export class RoomScene {
  readonly scene = new Scene();
  readonly roomBounds = new Box3(new Vector3(-9.2, 0, -8.2), new Vector3(9.2, 5.6, 8.2));
  readonly blockers: Box3[] = [];
  readonly hotspots: Hotspot[] = [];
  private gltfLoader = new GLTFLoader();
  private workstationGroup: Group | null = null;

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
    this.hotspots.forEach((hotspot, index) => {
      const orb = hotspot.anchor.children[1];
      if (orb) {
        orb.position.y = 1.2 + Math.sin(performance.now() * 0.0018 + index) * 0.08;
        orb.rotation.y += delta * 1.2;
      }
      hotspot.anchor.lookAt(camera.position.x, hotspot.anchor.position.y + 0.4, camera.position.z);
    });
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
    this.buildAchievementsCorner(darkMaterial, glowMaterial);
    // this.buildContactTerminal(darkMaterial, glowMaterial);
    this.buildAmbientProps(deskMaterial, darkMaterial, glowMaterial);

    this.hotspots.push(
      this.createHotspot({
        id: 'about',
        title: 'About Lounge',
        prompt: 'Read profile',
        position: new Vector3(-7.1, 0, 5.1),
        color: '#ffd166',
      }),
      this.createHotspot({
        id: 'featured-projects',
        title: 'Featured Projects',
        prompt: 'Open flagship work',
        position: new Vector3(0, 0, -5.15),
        color: '#5de2ff',
      }),
      this.createHotspot({
        id: 'project-archive',
        title: 'Project Archive',
        prompt: 'Browse the wider body of work',
        position: new Vector3(7.25, 0, -2.15),
        color: '#67c5ff',
      }),
      this.createHotspot({
        id: 'skills',
        title: 'Skills Lab',
        prompt: 'Inspect strengths and tools',
        position: new Vector3(-7.2, 0, -2.3),
        color: '#9fffa8',
      }),
      this.createHotspot({
        id: 'experience',
        title: 'Experience Archive',
        prompt: 'Walk the timeline',
        position: new Vector3(-6.6, 0, 1.4),
        color: '#a995ff',
      }),
      this.createHotspot({
        id: 'achievements',
        title: 'Achievements Shelf',
        prompt: 'Review highlights',
        position: new Vector3(6.2, 0, 3.4),
        color: '#ffb95c',
      }),
      this.createHotspot({
        id: 'contact',
        title: 'Contact Terminal',
        prompt: 'Open contact links',
        position: new Vector3(0, 0, 6.1),
        color: '#ff7d66',
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
    const nameSign = this.createFloorTextPlane({
      width: 4.8,
      height: 1.2,
      lines: [
        { text: 'DEBJIT SINHA', size: 72, color: '#f5efe3', weight: '700' },
        { text: 'Software Developer', size: 34, color: '#8fe7ff', weight: '500' },
      ],
    });
    nameSign.position.set(0, 1.03, 0.2);
    this.scene.add(nameSign);

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
    const wall = new Group();
    wall.position.set(8.3, 0, -2.7);

    const frame = new Mesh(new BoxGeometry(0.42, 3.2, 5.4), darkMaterial);
    frame.position.set(0, 1.6, 0);
    wall.add(frame);

    for (const y of [0.8, 1.95, 3.1]) {
      const rail = new Mesh(new BoxGeometry(0.08, 0.06, 4.6), glowMaterial);
      rail.position.set(-0.18, y, 0);
      wall.add(rail);
    }

    for (const z of [-1.55, 0, 1.55]) {
      const card = new Mesh(new BoxGeometry(0.12, 0.82, 1.08), glowMaterial);
      card.position.set(-0.25, 1.9, z);
      wall.add(card);
    }

    this.scene.add(wall);
    this.addBlockerFromCenter(new Vector3(8.3, 1.6, -2.7), new Vector3(0.9, 3.4, 5.8));
  }

  private buildSkillsLab(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const rack = new Group();
    rack.position.set(-8.05, 0, -2.35);

    const frame = new Mesh(new BoxGeometry(0.36, 2.8, 4.4), darkMaterial);
    frame.position.set(0, 1.4, 0);
    rack.add(frame);

    for (const y of [0.75, 1.45, 2.15]) {
      const shelf = new Mesh(new BoxGeometry(1.3, 0.08, 4.2), darkMaterial);
      shelf.position.set(0.4, y, 0);
      rack.add(shelf);

      for (const z of [-1.4, -0.45, 0.45, 1.4]) {
        const node = new Mesh(new BoxGeometry(0.46, 0.24, 0.46), glowMaterial);
        node.position.set(0.45, y + 0.2, z);
        rack.add(node);
      }
    }

    this.scene.add(rack);
    this.addBlockerFromCenter(new Vector3(-7.6, 1.4, -2.35), new Vector3(1.9, 2.9, 4.6));
  }

  private buildExperienceArchive(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const timeline = new Group();
    timeline.position.set(-7.7, 0, 1.4);

    const base = new Mesh(new BoxGeometry(0.5, 2.5, 5.8), darkMaterial);
    base.position.set(0, 1.25, 0);
    timeline.add(base);

    const rail = new Mesh(new BoxGeometry(0.1, 0.1, 5.2), glowMaterial);
    rail.position.set(0.18, 1.4, 0);
    timeline.add(rail);

    for (const z of [-2, -1, 0, 1, 2]) {
      const marker = new Mesh(new SphereGeometry(0.18, 16, 16), glowMaterial);
      marker.position.set(0.2, 1.4, z);
      timeline.add(marker);

      const plaque = new Mesh(new BoxGeometry(0.12, 0.65, 0.82), glowMaterial);
      plaque.position.set(0.16, 1.95, z);
      timeline.add(plaque);
    }

    this.scene.add(timeline);
    this.addBlockerFromCenter(new Vector3(-7.7, 1.25, 1.4), new Vector3(1.2, 2.7, 6.2));
  }

  private buildAchievementsCorner(darkMaterial: MeshStandardMaterial, glowMaterial: MeshStandardMaterial) {
    const showcase = new Group();
    showcase.position.set(6.7, 0, 3.6);

    const cabinet = new Mesh(new BoxGeometry(2.6, 1.35, 1), darkMaterial);
    cabinet.position.set(0, 0.68, 0);
    showcase.add(cabinet);

    const top = new Mesh(new BoxGeometry(2.8, 0.08, 1.12), darkMaterial);
    top.position.set(0, 1.39, 0);
    showcase.add(top);

    for (const x of [-0.9, 0, 0.9]) {
      const trophyBase = new Mesh(new CylinderGeometry(0.12, 0.15, 0.14, 12), darkMaterial);
      trophyBase.position.set(x, 1.53, 0);
      showcase.add(trophyBase);

      const trophy = new Mesh(new TorusGeometry(0.16, 0.05, 10, 18), glowMaterial);
      trophy.position.set(x, 1.76, 0);
      trophy.rotation.x = Math.PI / 2;
      showcase.add(trophy);
    }

    const socialPanel = new Mesh(new BoxGeometry(1.8, 1, 0.08), glowMaterial);
    socialPanel.position.set(0, 2.5, -0.38);
    showcase.add(socialPanel);

    this.scene.add(showcase);
    this.addBlockerFromCenter(new Vector3(6.7, 0.85, 3.6), new Vector3(3, 1.8, 1.5));
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
    deskMaterial: MeshStandardMaterial,
    darkMaterial: MeshStandardMaterial,
    _glowMaterial: MeshStandardMaterial,
  ) {
    const lounge = new Group();
    lounge.position.set(-7.15, 0, 5.15);

    const sofaBase = new Mesh(new BoxGeometry(2.8, 0.55, 1.15), darkMaterial);
    sofaBase.position.set(0, 0.28, 0);
    lounge.add(sofaBase);

    const sofaBack = new Mesh(new BoxGeometry(2.8, 0.95, 0.22), darkMaterial);
    sofaBack.position.set(0, 0.8, -0.48);
    lounge.add(sofaBack);

    const coffeeTable = new Mesh(new BoxGeometry(1.2, 0.12, 0.74), deskMaterial);
    coffeeTable.position.set(0.15, 0.36, 1.1);
    lounge.add(coffeeTable);

    this.scene.add(lounge);
    this.addBlockerFromCenter(new Vector3(-7.15, 0.55, 5.15), new Vector3(3.1, 1.3, 1.4));

    const planterLeft = await this.createPlanter();
    planterLeft.position.set(-8.3, 0, 7.2);
    this.scene.add(planterLeft);

    const planterRight = await this.createPlanter();
    planterRight.position.set(8.3, 0, 7.2);
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
    color: string;
  }): Hotspot {
    const group = new Group();
    group.position.copy(config.position);

    const pedestal = new Mesh(
      new CylinderGeometry(0.42, 0.5, 0.14, 12),
      new MeshStandardMaterial({ color: '#202a37', roughness: 0.6, metalness: 0.18 }),
    );
    pedestal.position.y = 0.08;
    group.add(pedestal);

    const orb = new Mesh(
      new SphereGeometry(0.22, 20, 20),
      new MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.6 }),
    );
    orb.position.y = 1.2;
    group.add(orb);

    const ring = new Mesh(
      new TorusGeometry(0.36, 0.04, 12, 28),
      new MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.3 }),
    );
    ring.position.y = 1.2;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    this.scene.add(group);

    return {
      id: config.id,
      title: config.title,
      prompt: config.prompt,
      anchor: group,
      radius: 1.9,
    };
  }

  private addBlockerFromCenter(center: Vector3, size: Vector3) {
    const blocker = new Box3().setFromCenterAndSize(center, size);
    this.blockers.push(blocker);
  }
}