export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private currentIndex = 0;
  private isPlaying = false;
  private onTrackChange: ((trackName: string) => void) | null = null;
  private volume = 0.5; // 50% initial volume
  private musicFiles = [
    'A Stroll Alone - Everet Almond.mp3',
    'Bazaar Ballad - Patrick Patrikios.mp3',
    'Floating Lanterns - The Mini Vandals.mp3',
    'From Here on In - Everet Almond.mp3',
    'Ghibli Station - The Mini Vandals.mp3',
    'Mirage melody - Patrick Patrikios.mp3',
    'Sample Mind - Freedom Trail Studio.mp3',
    'inner_outer - Lish Grooves.mp3',
  ];

  constructor() {
    this.audio = new Audio();
    this.audio.volume = this.volume;
    this.audio.addEventListener('ended', () => this.playNext());
    this.initializePlaylist();
  }

  private initializePlaylist() {
    this.playlist = [...this.musicFiles];
    this.shufflePlaylist();
  }

  private shufflePlaylist() {
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
  }

  setOnTrackChange(callback: (trackName: string) => void) {
    this.onTrackChange = callback;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentIndex = 0;
    this.playTrack(0);
  }

  private playTrack(index: number) {
    if (!this.audio || index >= this.playlist.length) {
      this.currentIndex = 0;
      this.shufflePlaylist();
      this.playTrack(0);
      return;
    }

    const trackName = this.playlist[index];
    const audioPath = `/resources/music/${trackName}`;
    
    this.audio.src = audioPath;
    this.audio.play().catch((error) => {
      console.warn('Failed to play audio:', error);
      this.playNext();
    });

    this.onTrackChange?.(trackName);
  }

  private playNext() {
    this.currentIndex++;
    
    if (this.currentIndex >= this.playlist.length) {
      this.currentIndex = 0;
      this.shufflePlaylist();
    }

    this.playTrack(this.currentIndex);
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
  }

  setVolume(level: number) {
    this.volume = Math.max(0, Math.min(1, level));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute() {
    this.setVolume(this.volume === 0 ? 0.5 : 0);
  }

  dispose() {
    this.stop();
    if (this.audio) {
      this.audio.removeEventListener('ended', () => this.playNext());
    }
  }
}
