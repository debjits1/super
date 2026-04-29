import type { HotspotId, PortfolioPanel } from '../data/portfolio';
import { portfolioPanels } from '../data/portfolio';
import type { MusicPlayer } from '../player/MusicPlayer';

type Direction = 'up' | 'down' | 'left' | 'right';

type OverlayOptions = {
  onDirectionChange: (direction: Direction, pressed: boolean) => void;
  onInteract: () => void;
  onClosePanel: () => void;
  musicPlayer?: MusicPlayer;
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
  private readonly volumeButton: HTMLButtonElement;
  private readonly volumeSlider: HTMLInputElement;
  private readonly readingModeContainer: HTMLDivElement;
  private readonly nowPlayingNotification: HTMLDivElement;
  private nowPlayingTimeout: number | null = null;
  private isReadingMode = false;

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

    this.nowPlayingNotification = document.createElement('div');
    this.nowPlayingNotification.className = 'now-playing-notification is-hidden';
    this.nowPlayingNotification.innerHTML = `
      <div class="now-playing-content">
        <p class="now-playing-label">Now Playing</p>
        <p class="now-playing-track"></p>
      </div>
    `;

    const desktopVolumeControl = document.createElement('div');
    desktopVolumeControl.className = 'desktop-volume-control';
    desktopVolumeControl.innerHTML = `
      <svg class="volume-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a7 7 0 0 1 0 9.9M20 12a9.9 9.9 0 0 1 0 0"></path>
      </svg>
      <input type="range" class="volume-slider" min="0" max="100" value="50" aria-label="Volume control">
    `;
    this.volumeSlider = desktopVolumeControl.querySelector('.volume-slider') as HTMLInputElement;
    this.volumeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.options.musicPlayer?.setVolume(value / 100);
    });

    this.readingModeContainer = document.createElement('div');
    this.readingModeContainer.className = 'reading-mode-container is-hidden';

    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.append(
      this.buildDirectionPad(),
      this.buildActionCluster(),
    );

    this.interactButton = mobileControls.querySelector('.interact-button') as HTMLButtonElement;
    this.volumeButton = mobileControls.querySelector('.volume-button') as HTMLButtonElement;

    this.root.append(this.prompt, this.panel, this.nowPlayingNotification, this.readingModeContainer, desktopVolumeControl, mobileControls);
    document.body.append(this.root);
    
    this.buildReadingMode();
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

  showNowPlaying(trackName: string) {
    const trackElement = this.nowPlayingNotification.querySelector('.now-playing-track');
    if (trackElement) {
      trackElement.textContent = trackName;
    }
    
    this.nowPlayingNotification.classList.remove('is-hidden');

    if (this.nowPlayingTimeout !== null) {
      clearTimeout(this.nowPlayingTimeout);
    }

    this.nowPlayingTimeout = window.setTimeout(() => {
      this.nowPlayingNotification.classList.add('is-hidden');
      this.nowPlayingTimeout = null;
    }, 5000);
  }

  dispose() {
    if (this.nowPlayingTimeout !== null) {
      clearTimeout(this.nowPlayingTimeout);
    }
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

    const volume = document.createElement('button');
    volume.className = 'volume-button';
    volume.type = 'button';
    volume.setAttribute('aria-label', 'Toggle volume');
    volume.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a7 7 0 0 1 0 9.9M20 12a9.9 9.9 0 0 1 0 0"></path>
      </svg>
    `;
    volume.addEventListener('click', () => this.handleVolumeToggle());

    cluster.append(interact, volume);
    return cluster;
  }

  addReadingModeButton() {
    const readingButton = document.createElement('button');
    readingButton.className = 'reading-mode-toggle';
    readingButton.type = 'button';
    readingButton.setAttribute('aria-label', 'Toggle reading mode');
    readingButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `;
    readingButton.addEventListener('click', () => this.toggleReadingMode());
    this.root.append(readingButton);
  }

  private handleVolumeToggle() {
    if (this.options.musicPlayer) {
      this.options.musicPlayer.toggleMute();
      this.updateVolumeButton();
    }
  }

  private updateVolumeButton() {
    if (!this.options.musicPlayer) return;
    
    const volume = this.options.musicPlayer.getVolume();
    const opacity = volume === 0 ? 0.5 : 1;
    this.volumeButton.style.opacity = opacity.toString();
    
    if (this.volumeSlider) {
      this.volumeSlider.value = (volume * 100).toString();
    }
  }

  toggleReadingMode() {
    this.isReadingMode = !this.isReadingMode;
    
    if (this.isReadingMode) {
      this.readingModeContainer.classList.remove('is-hidden');
      document.body.style.overflow = 'hidden';
    } else {
      this.readingModeContainer.classList.add('is-hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  private buildReadingMode() {
    const header = document.createElement('div');
    header.className = 'reading-mode-header';
    header.innerHTML = `
      <h1 class="reading-mode-title">Portfolio</h1>
      <button class="reading-mode-close" type="button" aria-label="Exit reading mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeButton = header.querySelector('.reading-mode-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => this.toggleReadingMode());

    const content = document.createElement('div');
    content.className = 'reading-mode-content';

    const sectionIds: HotspotId[] = ['about', 'featured-projects', 'project-archive', 'skills', 'experience', 'achievements', 'contact'];

    sectionIds.forEach((id) => {
      const panel = portfolioPanels[id];
      if (panel) {
        const section = document.createElement('section');
        section.className = 'reading-mode-section';

        const kicker = document.createElement('p');
        kicker.className = 'reading-mode-kicker';
        kicker.textContent = panel.kicker;

        const title = document.createElement('h2');
        title.className = 'reading-mode-section-title';
        title.textContent = panel.title;

        const body = document.createElement('p');
        body.className = 'reading-mode-body';
        body.textContent = panel.body;

        const highlights = document.createElement('ul');
        highlights.className = 'reading-mode-highlights';
        panel.highlights.forEach((highlight) => {
          const li = document.createElement('li');
          li.textContent = highlight;
          highlights.append(li);
        });

        const cta = document.createElement('a');
        cta.className = 'reading-mode-cta';
        cta.href = panel.ctaHref;
        cta.target = '_blank';
        cta.rel = 'noreferrer';
        cta.textContent = panel.ctaLabel;

        section.append(kicker, title, body, highlights, cta);
        content.append(section);
      }
    });

    this.readingModeContainer.append(header, content);
  }
}