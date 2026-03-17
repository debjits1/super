import {
  Clock,
  MathUtils,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import { portfolioPanels } from '../data/portfolio';
import { PlayerController } from '../player/PlayerController';
import { OverlayUI } from '../ui/OverlayUI';
import { RoomScene } from '../world/RoomScene';
import { InputController } from './Input';

export class Experience {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  private readonly clock = new Clock();
  private readonly input = new InputController();
  private readonly room = new RoomScene();
  private readonly player = new PlayerController();
  private readonly cameraTarget = new Vector3();
  private readonly cameraOffset = new Vector3(0, 6.5, 4.8);
  private readonly introCameraPosition = new Vector3(3.2, 4.6, 10.8);
  private readonly introCameraTarget = new Vector3(0, 1.2, 1.9);
  private readonly unitScale = new Vector3(1, 1, 1);
  private activeHotspotId: keyof typeof portfolioPanels | null = null;
  private readonly ui: OverlayUI;
  private animationFrame = 0;
  private introElapsed = 0;
  private readonly introDuration = 1.8;

  constructor(private readonly target: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.className = 'experience-canvas';

    this.target.append(this.renderer.domElement);

    this.scene.add(this.room.scene);
    this.scene.add(this.player.root);

    this.camera.position.copy(this.introCameraPosition);
    this.camera.lookAt(this.introCameraTarget);

    this.ui = new OverlayUI({
      onDirectionChange: (direction, pressed) => this.input.setVirtualDirection(direction, pressed),
      onInteract: () => this.tryInteract(),
      onClosePanel: () => this.ui.hidePanel(),
    });

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.onResize);
    this.input.dispose();
    this.ui.dispose();
    this.renderer.dispose();
  }

  private animate = () => {
    const delta = Math.min(this.clock.getDelta(), 0.033);
    const snapshot = this.input.getSnapshot();
    const introActive = this.introElapsed < this.introDuration;

    if (introActive) {
      this.introElapsed += delta;
    }

    this.player.update(
      delta,
      introActive
        ? {
            forward: false,
            backward: false,
            left: false,
            right: false,
            interactPressed: false,
          }
        : snapshot,
      this.room.blockers,
      this.room.roomBounds,
    );
    this.updateCamera(delta, introActive);
    this.updateHotspotState();

    if (!introActive && snapshot.interactPressed) {
      this.tryInteract();
    }

    this.room.update(delta, this.camera);
    this.renderer.render(this.scene, this.camera);

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private updateCamera(delta: number, introActive: boolean) {
    const desired = new Vector3(
      this.player.position.x + this.cameraOffset.x,
      this.cameraOffset.y,
      this.player.position.z + this.cameraOffset.z,
    );

    if (introActive) {
      const introProgress = MathUtils.smoothstep(this.introElapsed / this.introDuration, 0, 1);
      this.camera.position.lerpVectors(this.introCameraPosition, desired, introProgress);
      this.cameraTarget.lerpVectors(this.introCameraTarget, new Vector3(this.player.position.x, 1.1, this.player.position.z - 0.15), introProgress);
      this.camera.lookAt(this.cameraTarget);
      return;
    }

    this.camera.position.lerp(desired, 1 - Math.exp(-delta * 4));

    this.cameraTarget.set(this.player.position.x, 1.1, this.player.position.z - 0.15);
    this.camera.lookAt(this.cameraTarget);
  }

  private updateHotspotState() {
    const nearest = this.room.hotspots
      .map((hotspot) => ({
        hotspot,
        distance: hotspot.anchor.position.distanceTo(this.player.position),
      }))
      .filter(({ hotspot, distance }) => distance < hotspot.radius)
      .sort((left, right) => left.distance - right.distance)[0];

    if (!nearest) {
      this.activeHotspotId = null;
      this.ui.setActiveHotspot(null);
      this.room.hotspots.forEach((hotspot) => hotspot.anchor.scale.lerp(this.unitScale, 0.18));
      return;
    }

    const pulse = 0.95 + Math.sin(performance.now() * 0.006) * 0.08;
    nearest.hotspot.anchor.scale.setScalar(pulse);

    this.activeHotspotId = nearest.hotspot.id;
    this.ui.setActiveHotspot({
      id: nearest.hotspot.id,
      title: nearest.hotspot.title,
      prompt: nearest.hotspot.prompt,
    });

    this.room.hotspots
      .filter((hotspot) => hotspot.id !== nearest.hotspot.id)
      .forEach((hotspot) => hotspot.anchor.scale.lerp(this.unitScale, 0.18));
  }

  private tryInteract() {
    if (!this.activeHotspotId) {
      return;
    }

    const panel = portfolioPanels[this.activeHotspotId];
    this.ui.showPanel(panel);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}