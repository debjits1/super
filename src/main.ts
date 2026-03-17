import './style.css';

import { Experience } from './core/Experience';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found');
}

const experience = new Experience(app);

window.addEventListener('beforeunload', () => {
  experience.dispose();
});