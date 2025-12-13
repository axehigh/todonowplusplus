export function spawnConfettiFromMainContent() {
  const container = document.querySelector('#main-content') as HTMLElement | null;
  if (!container) return;

  const burst = document.createElement('div');
  burst.className = 'confetti-burst';
  const count = 14;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--rx', (Math.random() * 360).toFixed(0));
    piece.style.setProperty('--dx', (Math.random() * 200 - 100).toFixed(0));
    piece.style.setProperty('--dy', (-Math.random() * 200 - 80).toFixed(0));
    piece.style.setProperty('--delay', (Math.random() * 0.1).toFixed(2) + 's');
    piece.style.background = randomConfettiColor();
    burst.appendChild(piece);
  }

  container.appendChild(burst);
  setTimeout(() => burst.remove(), 1200);
}

function randomConfettiColor() {
  const colors = ['#ff0080', '#00e5ff', '#6200ea', '#ffd400', '#34c759'];
  return colors[Math.floor(Math.random() * colors.length)];
}

