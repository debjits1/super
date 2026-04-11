import type { HotspotId, PortfolioPanel } from '../data/portfolio';

type Direction = 'up' | 'down' | 'left' | 'right';

type OverlayOptions = {
  onDirectionChange: (direction: Direction, pressed: boolean) => void;
  onInteract: () => void;
  onClosePanel: () => void;
};

export class OverlayUI {
  private readonly root: HTMLDivElement;
  private readonly prompt: HTMLDivElement;
  private readonly promptTitle: HTMLSpanElement;
  private readonly promptBody: HTMLSpanElement;
  private readonly panel: HTMLDivElement;
  private readonly panelKicker: HTMLParagraphElement;
  private readonly panelTitle: HTMLHeadingElement;
  private readonly panelBody: HTMLParagraphElement;
  private readonly panelList: HTMLUListElement;
  private readonly panelLink: HTMLAnchorElement;
  private readonly interactButton: HTMLButtonElement;

  constructor(private readonly options: OverlayOptions) {
    this.root = document.createElement('div');
    this.root.className = 'overlay-shell';

    this.prompt = document.createElement('div');
    this.prompt.className = 'interaction-prompt is-hidden';
    this.promptTitle = document.createElement('span');
    this.promptTitle.className = 'prompt-title';
    this.promptBody = document.createElement('span');
    this.promptBody.className = 'prompt-body';
    this.prompt.append(this.promptTitle, this.promptBody);

    this.panel = document.createElement('div');
    this.panel.className = 'detail-panel is-hidden';
    this.panel.innerHTML = `
      <button class="close-button" type="button" aria-label="Close panel">Close</button>
    `;
    this.panelKicker = document.createElement('p');
    this.panelKicker.className = 'panel-kicker';
    this.panelTitle = document.createElement('h2');
    this.panelBody = document.createElement('p');
    this.panelBody.className = 'panel-body';
    this.panelList = document.createElement('ul');
    this.panelList.className = 'panel-list';
    this.panelLink = document.createElement('a');
    this.panelLink.className = 'panel-link';
    this.panelLink.target = '_blank';
    this.panelLink.rel = 'noreferrer';
    this.panel.append(this.panelKicker, this.panelTitle, this.panelBody, this.panelList, this.panelLink);

    const closeButton = this.panel.querySelector('button');
    closeButton?.addEventListener('click', () => this.options.onClosePanel());

    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.append(
      this.buildDirectionPad(),
      this.buildActionCluster(),
    );

    this.interactButton = mobileControls.querySelector('.interact-button') as HTMLButtonElement;

    this.root.append(this.prompt, this.panel, mobileControls);
    document.body.append(this.root);
  }

  setActiveHotspot(payload: { id: HotspotId; title: string; prompt: string } | null) {
    if (!payload) {
      this.prompt.classList.add('is-hidden');
      this.interactButton.disabled = true;
      return;
    }

    this.prompt.classList.remove('is-hidden');
    this.interactButton.disabled = false;
    this.promptTitle.textContent = payload.title;
    this.promptBody.textContent = `${payload.prompt} · press E or tap interact`;
  }

  showPanel(panel: PortfolioPanel) {
    this.panel.classList.remove('is-hidden');
    this.panelKicker.textContent = panel.kicker;
    this.panelTitle.textContent = panel.title;
    this.panelBody.textContent = panel.body;
    this.panelList.replaceChildren(
      ...panel.highlights.map((highlight) => {
        const item = document.createElement('li');
        item.textContent = highlight;
        return item;
      }),
    );
    this.panelLink.textContent = panel.ctaLabel;
    this.panelLink.href = panel.ctaHref;
  }

  hidePanel() {
    this.panel.classList.add('is-hidden');
  }

  dispose() {
    this.root.remove();
  }

  private joystickState: Record<Direction, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private activePointerId: number | null = null;

  private buildDirectionPad() {
    const pad = document.createElement('div');
    pad.className = 'direction-joystick';

    const base = document.createElement('div');
    base.className = 'joystick-base';
    const knob = document.createElement('div');
    knob.className = 'joystick-knob';
    base.append(knob);
    pad.append(base);

    const updateJoystick = (clientX: number, clientY: number) => {
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = rect.width * 0.35;
      const clampedDistance = Math.min(distance, maxDistance);
      const normalizedX = distance > 0 ? deltaX / distance : 0;
      const normalizedY = distance > 0 ? deltaY / distance : 0;

      knob.style.transform = `translate(${normalizedX * clampedDistance}px, ${normalizedY * clampedDistance}px)`;

      const threshold = rect.width * 0.15;
      this.setDirectionState('up', deltaY < -threshold);
      this.setDirectionState('down', deltaY > threshold);
      this.setDirectionState('left', deltaX < -threshold);
      this.setDirectionState('right', deltaX > threshold);
    };

    const resetJoystick = () => {
      knob.style.transform = 'translate(0, 0)';
      Object.keys(this.joystickState).forEach((direction) => {
        if (this.joystickState[direction as Direction]) {
          this.setDirectionState(direction as Direction, false);
        }
      });
      this.activePointerId = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== this.activePointerId) {
        return;
      }
      event.preventDefault();
      updateJoystick(event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== this.activePointerId) {
        return;
      }
      event.preventDefault();
      resetJoystick();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    base.style.touchAction = 'none';
    base.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      base.setPointerCapture(event.pointerId);
      this.activePointerId = event.pointerId;
      updateJoystick(event.clientX, event.clientY);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp, { passive: false });
      window.addEventListener('pointercancel', onPointerUp, { passive: false });
    }, { passive: false });

    return pad;
  }

  private setDirectionState(direction: Direction, pressed: boolean) {
    if (this.joystickState[direction] === pressed) {
      return;
    }

    this.joystickState[direction] = pressed;
    this.options.onDirectionChange(direction, pressed);
  }

  private buildActionCluster() {
    const cluster = document.createElement('div');
    cluster.className = 'action-cluster';

    const interact = document.createElement('button');
    interact.className = 'interact-button';
    interact.type = 'button';
    interact.textContent = 'Interact';
    interact.disabled = true;
    interact.addEventListener('click', () => this.options.onInteract());

    cluster.append(interact);
    return cluster;
  }
}