export type InputSnapshot = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interactPressed: boolean;
};

type Direction = 'up' | 'down' | 'left' | 'right';

export class InputController {
  private state = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  private interactQueued = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  getSnapshot(): InputSnapshot {
    const interactPressed = this.interactQueued;
    this.interactQueued = false;

    return {
      ...this.state,
      interactPressed,
    };
  }

  setVirtualDirection(direction: Direction, pressed: boolean) {
    if (direction === 'up') {
      this.state.forward = pressed;
    }

    if (direction === 'down') {
      this.state.backward = pressed;
    }

    if (direction === 'left') {
      this.state.left = pressed;
    }

    if (direction === 'right') {
      this.state.right = pressed;
    }
  }

  queueInteract() {
    this.interactQueued = true;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === 'w' || key === 'arrowup') {
      this.state.forward = true;
    }

    if (key === 's' || key === 'arrowdown') {
      this.state.backward = true;
    }

    if (key === 'a' || key === 'arrowleft') {
      this.state.left = true;
    }

    if (key === 'd' || key === 'arrowright') {
      this.state.right = true;
    }

    if (key === 'e' || key === ' ') {
      this.interactQueued = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === 'w' || key === 'arrowup') {
      this.state.forward = false;
    }

    if (key === 's' || key === 'arrowdown') {
      this.state.backward = false;
    }

    if (key === 'a' || key === 'arrowleft') {
      this.state.left = false;
    }

    if (key === 'd' || key === 'arrowright') {
      this.state.right = false;
    }
  };
}