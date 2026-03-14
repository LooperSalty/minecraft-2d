import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;

function resize(): void {
  canvas.width = Math.min(window.innerWidth, 1200);
  canvas.height = Math.min(window.innerHeight, 800);
}

resize();
window.addEventListener('resize', resize);

const game = new Game(canvas);
game.init().then(() => {
  loading.style.display = 'none';
});
