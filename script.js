const canvas = document.getElementById("evolution-canvas");
const context = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const DOT_COUNT = 50;
const DOT_RADIUS = 6;
const X_WAVES = 5;
const Y_WAVES = 3;

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

function drawGenerationInfo(dots) {
  const averageGoodness =
    dots.reduce((sum, dot) => sum + dot.goodness, 0) / dots.length;

  context.fillStyle = "rgba(0, 0, 0, 0.55)";
  context.fillRect(18, 18, 220, 74);

  context.fillStyle = "#ffffff";
  context.font = '18px "Trebuchet MS", sans-serif';
  context.fillText("Generation 1", 32, 46);
  context.fillText(`Dots: ${dots.length}`, 32, 68);
  context.fillText(`Avg goodness: ${averageGoodness.toFixed(3)}`, 32, 90);
}

const backgroundImage = createBackgroundImage();
const dots = createRandomDots(DOT_COUNT);

function render() {
  context.putImageData(backgroundImage, 0, 0);

  for (const dot of dots) {
    dot.updateGoodness();
    dot.draw(context);
  }

  drawGenerationInfo(dots);
  requestAnimationFrame(render);
}

render();
