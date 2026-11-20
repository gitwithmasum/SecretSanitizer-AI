import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawPixel) {
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ultra-futuristic faceted cyber shield
function drawFuturisticShield(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2); // -1 to 1
  const ny = (y - cy) / (h / 2); // -1 to 1

  // Rounded rectangle chassis bounds
  const cornerRadius = 0.22;
  const dx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
  const dy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
  const outsideCorner = Math.sqrt(dx * dx + dy * dy) > cornerRadius;
  if (outsideCorner) {
    return [0, 0, 0, 0];
  }

  // Border frame
  const isEdge = Math.abs(nx) > 0.94 || Math.abs(ny) > 0.94;
  if (isEdge) {
    return [0, 242, 254, 255];
  }

  // Shield Geometry: top at ny = -0.75, sides at nx = ±0.7, bottom at ny = 0.78
  const inShieldTop = ny >= -0.75;
  const sideSlope = 0.75;
  // bottom taper
  const bottomTaper = ny <= 0.8 && Math.abs(nx) <= (ny > 0 ? (1 - (ny - 0.1) * sideSlope) : 0.72);

  if (inShieldTop && bottomTaper) {
    // Shield outer glowing perimeter
    const distToPerimeter = Math.min(
      Math.abs(ny - (-0.75)),
      Math.abs(Math.abs(nx) - (ny > 0 ? (1 - (ny - 0.1) * sideSlope) : 0.72))
    );

    if (distToPerimeter < 0.08) {
      // Dual tone: Left cyan, right purple/magenta
      return nx < 0 ? [0, 242, 254, 255] : [168, 85, 247, 255];
    }

    // Inner shield spine line (vertical center)
    if (Math.abs(nx) < 0.03 && ny >= -0.7 && ny <= 0.65) {
      return [0, 242, 254, 255];
    }

    // Central S-Core Monogram
    const inCoreX = Math.abs(nx) < 0.35;
    const inCoreY = ny >= -0.35 && ny <= 0.35;
    if (inCoreX && inCoreY) {
      // Top bar
      if (ny >= -0.30 && ny <= -0.15 && nx >= -0.28 && nx <= 0.28) {
        return [0, 242, 254, 255];
      }
      // Top left hook
      if (ny >= -0.15 && ny <= 0.0 && nx >= -0.28 && nx <= -0.14) {
        return [0, 242, 254, 255];
      }
      // Middle bar / Core center
      if (Math.abs(ny) <= 0.08 && Math.abs(nx) <= 0.28) {
        return [255, 255, 255, 255];
      }
      // Bottom right hook
      if (ny >= 0.0 && ny <= 0.15 && nx >= 0.14 && nx <= 0.28) {
        return [168, 85, 247, 255];
      }
      // Bottom bar
      if (ny >= 0.15 && ny <= 0.30 && nx >= -0.28 && nx <= 0.28) {
        return [168, 85, 247, 255];
      }
    }

    // Shield Facet Fill (Left is midnight navy with cyan tint, Right is deep obsidian with violet tint)
    if (nx < 0) {
      return [15, 23, 42, 255];
    } else {
      return [24, 16, 42, 255];
    }
  }

  // Outer ambient space background
  const rBg = Math.floor(4 + (nx + 1) * 2);
  const gBg = Math.floor(7 + (ny + 1) * 3);
  const bBg = Math.floor(18 + Math.abs(nx) * 5);
  return [rBg, gBg, bBg, 255];
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 32, 48, 128].forEach((size) => {
  const png = createPNG(size, size, drawFuturisticShield);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated futuristic icon${size}.png (${size}x${size})`);
});

// Also generate media/logo.png and vscode-extension/media/icon.png
const logoPng = createPNG(128, 128, drawFuturisticShield);
fs.writeFileSync(path.resolve('media/logo.png'), logoPng);
fs.writeFileSync(path.resolve('vscode-extension/media/icon.png'), logoPng);
console.log('Generated media/logo.png and vscode-extension/media/icon.png');
