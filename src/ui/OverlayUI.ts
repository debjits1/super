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

  private buildDirectionPad() {
    const pad = document.createElement('div');
    pad.className = 'direction-pad';

    const up = this.buildHoldButton('up', '▲');
    up.classList.add('pad-up');
    const left = this.buildHoldButton('left', '◀');
    left.classList.add('pad-left');
    const down = this.buildHoldButton('down', '▼');
    down.classList.add('pad-down');
    const right = this.buildHoldButton('right', '▶');
    right.classList.add('pad-right');

    pad.append(up, left, down, right);
    return pad;
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

  private buildHoldButton(direction: Direction, label: string) {
    const button = document.createElement('button');
    button.className = 'pad-button';
    button.type = 'button';
    button.textContent = label;
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.touchAction = 'none';

    const press = (e: PointerEvent) => {
      e.preventDefault();
      this.options.onDirectionChange(direction, true);
    };
    const release = (e: PointerEvent) => {
      e.preventDefault();
      this.options.onDirectionChange(direction, false);
    };

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('pointerup', release, { passive: false });
    button.addEventListener('pointerleave', release, { passive: false });
    button.addEventListener('pointercancel', release, { passive: false });
    button.addEventListener('selectstart', (e) => e.preventDefault());

    return button;
  }
}