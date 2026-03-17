import {
  Box3,
  Group,
  MathUtils,
  Vector2,
  Vector3,
  Object3D,
  AnimationMixer,
  AnimationClip,
  AnimationAction,
  LoopRepeat,
} from 'three';

import type { InputSnapshot } from '../core/Input';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class PlayerController {
  readonly root = new Group();
  readonly collisionRadius = 0.45;
  private readonly movement = new Vector2();
  private readonly velocity = new Vector2();
  private readonly heading = new Vector2(0, 1);
  private model: Object3D | null = null;
  private mixer: AnimationMixer | null = null;
  private walkClip: AnimationClip | null = null;
  private idleClip: AnimationClip | null = null;
  private walkAction: AnimationAction | null = null;
  private idleAction: AnimationAction | null = null;
  private animState: 'idle' | 'walk' = 'idle';

  constructor(startPosition = new Vector3(0, 0, 4.2)) {
    this.root.position.copy(startPosition);
    this.loadModel('/resources/models/character.fbx', '/resources/models/walking.fbx', '/resources/models/idle.fbx').catch((error) => {
      console.error('Failed to load models:', error);
    });
  }

  async loadModel(characterPath: string, walkPath: string, idlePath: string): Promise<void> {
    const loader = new FBXLoader();

    // Load character model first
    const characterFbx = await new Promise<Object3D>((resolve, reject) => {
      loader.load(characterPath, resolve, undefined, reject);
    });
    this.model = characterFbx;
    this.model.scale.set(0.02, 0.02, 0.02);
    this.root.add(this.model);
    this.mixer = new AnimationMixer(this.model);
    console.log('Character model loaded');

    // Load walking animation
    const walkFbx = await new Promise<Object3D>((resolve, reject) => {
      loader.load(walkPath, resolve, undefined, reject);
    });
    if (walkFbx.animations && walkFbx.animations.length > 0) {
      this.walkClip = this.stripRootMotion(walkFbx.animations[0]);
      console.log('Walking animation loaded');
    }

    // Load idle animation
    const idleFbx = await new Promise<Object3D>((resolve, reject) => {
      loader.load(idlePath, resolve, undefined, reject);
    });
    if (idleFbx.animations && idleFbx.animations.length > 0) {
      this.idleClip = this.stripRootMotion(idleFbx.animations[0]);
      console.log('Idle animation loaded');
    }

    this.setupAnimationActions();
  }

  private stripRootMotion(clip: AnimationClip) {
    const stripped = clip.clone();
    stripped.tracks = stripped.tracks.filter((track) => {
      const trackName = track.name.toLowerCase();
      return !trackName.endsWith('mixamorighips.position')
        && !trackName.endsWith('hips.position')
        && !trackName.endsWith('pelvis.position');
    });
    return stripped;
  }

  private setupAnimationActions() {
    if (!this.mixer) {
      return;
    }

    if (this.walkClip) {
      this.walkAction = this.mixer.clipAction(this.walkClip);
      this.walkAction.loop = LoopRepeat;
      this.walkAction.enabled = true;
    }

    if (this.idleClip) {
      this.idleAction = this.mixer.clipAction(this.idleClip);
      this.idleAction.loop = LoopRepeat;
      this.idleAction.enabled = true;
    }

    if (this.idleAction) {
      this.idleAction.reset().play();
      this.animState = 'idle';
      return;
    }

    if (this.walkAction) {
      this.walkAction.reset().play();
      this.animState = 'walk';
    }
  }

  private getTargetAnimState(speed: number) {
    if (this.animState === 'idle') {
      return speed > 0.14 ? 'walk' : 'idle';
    }

    return speed < 0.08 ? 'idle' : 'walk';
  }

  private transitionToWalk() {
    if (!this.walkAction) {
      return;
    }

    this.walkAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (this.idleAction) {
      this.walkAction.crossFadeFrom(this.idleAction, 0.2, true);
    }
    this.animState = 'walk';
  }

  private transitionToIdle() {
    if (!this.idleAction) {
      this.walkAction?.stop();
      this.animState = 'idle';
      return;
    }

    this.idleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (this.walkAction) {
      this.idleAction.crossFadeFrom(this.walkAction, 0.2, true);
    }
    this.animState = 'idle';
  }

  get position() {
    return this.root.position;
  }

  update(delta: number, input: InputSnapshot, blockers: Box3[], roomBounds: Box3) {
    const moveX = Number(input.right) - Number(input.left);
    const moveY = Number(input.backward) - Number(input.forward);
    this.movement.set(moveX, moveY);

    if (this.movement.lengthSq() > 1) {
      this.movement.normalize();
    }

    const targetVelocity = this.movement.clone().multiplyScalar(4.2);
    this.velocity.lerp(targetVelocity, 1 - Math.exp(-delta * 10));

    const proposedPosition = this.root.position.clone();
    proposedPosition.x += this.velocity.x * delta;
    proposedPosition.z += this.velocity.y * delta;

    proposedPosition.x = MathUtils.clamp(
      proposedPosition.x,
      roomBounds.min.x + this.collisionRadius,
      roomBounds.max.x - this.collisionRadius,
    );
    proposedPosition.z = MathUtils.clamp(
      proposedPosition.z,
      roomBounds.min.z + this.collisionRadius,
      roomBounds.max.z - this.collisionRadius,
    );

    const playerBounds = new Box3().setFromCenterAndSize(
      new Vector3(proposedPosition.x, 0.8, proposedPosition.z),
      new Vector3(this.collisionRadius * 2, 1.6, this.collisionRadius * 2),
    );

    const blocked = blockers.some((blocker) => blocker.intersectsBox(playerBounds));

    if (!blocked) {
      this.root.position.copy(proposedPosition);
    } else {
      this.velocity.multiplyScalar(0.15);
    }

    if (this.velocity.lengthSq() > 0.005) {
      this.heading.set(this.velocity.x, this.velocity.y).normalize();
    }

    const targetRotation = Math.atan2(this.heading.x, this.heading.y);
    this.root.rotation.y = MathUtils.lerp(this.root.rotation.y, targetRotation, 1 - Math.exp(-delta * 12));

    const speed = this.velocity.length();
    // this.bobTime += delta * Math.max(speed * 1.8, 1);
    if (this.model) {
      this.model.position.y = 0.06;  // Fixed offset; adjust if needed for ground alignment
    }

    // Animation handling: only transition when state changes
    if (this.mixer) {
      this.mixer.update(delta);
      const targetState = this.getTargetAnimState(speed);
      if (targetState !== this.animState) {
        if (targetState === 'walk') {
          this.transitionToWalk();
        } else {
          this.transitionToIdle();
        }
      }
    }
  }
}