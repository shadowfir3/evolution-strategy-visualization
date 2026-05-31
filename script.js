const canvas = document.getElementById("evolution-canvas");
const context = canvas.getContext("2d");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");
const statusText = document.getElementById("status-text");
const generationValue = document.getElementById("generation-value");
const dotCountValue = document.getElementById("dot-count-value");
const averageGoodnessValue = document.getElementById("average-goodness-value");
const bestGoodnessValue = document.getElementById("best-goodness-value");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const DOT_COUNT = 50;
const DOT_RADIUS = 6;
const X_WAVES = 5;
const Y_WAVES = 3;
const REPRODUCTION_RATIO = 0.2;
const MUTATION_RADIUS = 60;
const GENERATION_DELAY_MS = 1000;

let generation = 1;
let isPaused = false;
let evolutionTimerId = null;

class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.goodness = 0;
  }

  updateGoodness() {
    this.goodness = sampleGoodness(this.x, this.y);
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4d4d";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.stroke();
  }
}

function getSinComponents(x, y) {
  const xAngle = (x / WIDTH) * Math.PI * 2 * X_WAVES;
  const yAngle = (y / HEIGHT) * Math.PI * 2 * Y_WAVES;

  return {
    xComponent: Math.sin(xAngle),
    yComponent: Math.sin(yAngle),
  };
}

function sampleGoodness(x, y) {
  const { xComponent, yComponent } = getSinComponents(x, y);
  const shiftedX = (xComponent + 1) / 2;
  const shiftedY = (yComponent + 1) / 2;
  return shiftedX * shiftedY;
}

function sampleGrayscaleValue(x, y) {
  return Math.round(sampleGoodness(x, y) * 255);
}

function createBackgroundImage() {
  const imageData = context.createImageData(WIDTH, HEIGHT);
  const { data } = imageData;

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const pixelIndex = (y * WIDTH + x) * 4;
      const grayscale = sampleGrayscaleValue(x, y);

      data[pixelIndex] = grayscale;
      data[pixelIndex + 1] = grayscale;
      data[pixelIndex + 2] = grayscale;
      data[pixelIndex + 3] = 255;
    }
  }

  return imageData;
}

function createRandomDots(count) {
  return Array.from({ length: count }, () => {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    return new Dot(x, y);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function evaluateDots(dots) {
  for (const dot of dots) {
    dot.updateGoodness();
  }
}

function createMutatedChild(parent) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * MUTATION_RADIUS;
  const x = clamp(parent.x + Math.cos(angle) * distance, 0, WIDTH);
  const y = clamp(parent.y + Math.sin(angle) * distance, 0, HEIGHT);
  const child = new Dot(x, y);
  child.updateGoodness();
  return child;
}

function evolveDots(currentDots) {
  evaluateDots(currentDots);

  const sortedDots = [...currentDots].sort((left, right) => {
    return right.goodness - left.goodness;
  });

  const eliteCount = Math.max(1, Math.floor(currentDots.length * REPRODUCTION_RATIO));
  const parents = sortedDots.slice(0, eliteCount);
  // Keep the best 80% and refill the removed bottom 20% with local mutations
  // spawned from the elite parents.
  const survivors = sortedDots.slice(0, currentDots.length - eliteCount);
  const offspring = parents.map((parent) => createMutatedChild(parent));

  return [...survivors, ...offspring];
}

function getSimulationStats(currentDots) {
  const averageGoodness =
    currentDots.reduce((sum, dot) => sum + dot.goodness, 0) / currentDots.length;
  const bestGoodness = Math.max(...currentDots.map((dot) => dot.goodness));

  return {
    averageGoodness,
    bestGoodness,
  };
}

function updateStatistics(currentDots) {
  const { averageGoodness, bestGoodness } = getSimulationStats(currentDots);

  generationValue.textContent = String(generation);
  dotCountValue.textContent = String(currentDots.length);
  averageGoodnessValue.textContent = averageGoodness.toFixed(3);
  bestGoodnessValue.textContent = bestGoodness.toFixed(3);
}

function updateControls() {
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  statusText.textContent = isPaused
    ? `Paused on generation ${generation}`
    : `Running generation ${generation}`;
}

const backgroundImage = createBackgroundImage();
let dots = [];

function render() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.putImageData(backgroundImage, 0, 0);

  for (const dot of dots) {
    dot.draw(context);
  }
  updateStatistics(dots);
}

function clearScheduledGeneration() {
  if (evolutionTimerId !== null) {
    window.clearTimeout(evolutionTimerId);
    evolutionTimerId = null;
  }
}

function scheduleNextGeneration() {
  if (isPaused) {
    return;
  }

  evolutionTimerId = window.setTimeout(runGenerationStep, GENERATION_DELAY_MS);
}

function runGenerationStep() {
  if (isPaused) {
    return;
  }

  dots = evolveDots(dots);
  generation += 1;
  render();
  updateControls();
  scheduleNextGeneration();
}

function resetSimulation() {
  clearScheduledGeneration();
  generation = 1;
  dots = createRandomDots(DOT_COUNT);
  evaluateDots(dots);
  render();
  updateControls();

  if (!isPaused) {
    scheduleNextGeneration();
  }
}

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;

  if (isPaused) {
    clearScheduledGeneration();
  }

  updateControls();

  if (!isPaused) {
    scheduleNextGeneration();
  }
});

resetButton.addEventListener("click", () => {
  resetSimulation();
});

resetSimulation();
