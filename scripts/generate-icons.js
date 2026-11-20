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

// Futuristic cyber shield with electric cyan, purple, and quantum core
function drawFuturisticShield(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2); // -1 to 1
  const ny = (y - cy) / (h / 2); // -1 to 1

  const dist = Math.sqrt(nx * nx + ny * ny);

  // Outer border cutoff
  if (dist > 0.96) {
    return [0, 0, 0, 0];
  }

  // Neon Cyan / Purple outer rim
  if (dist > 0.84) {
    const isTop = ny < 0;
    return isTop ? [0, 242, 254, 255] : [168, 85, 247, 255];
  }

  // Inner contour ring
  if (dist > 0.70 && dist < 0.75) {
    return [6, 182, 212, 180];
  }

  // Center Shield S Core
  const inCenter = Math.abs(nx) < 0.4 && Math.abs(ny) < 0.5;
  if (inCenter) {
    // S shape core
    if (ny < -0.15 && nx > -0.3 && nx < 0.3) {
      return [0, 242, 254, 255]; // upper bar
    }
    if (Math.abs(ny) <= 0.15 && nx > -0.25 && nx < 0.25) {
      return [255, 255, 255, 255]; // white quantum center spark
    }
    if (ny > 0.15 && nx > -0.3 && nx < 0.3) {
      return [168, 85, 247, 255]; // lower bar
    }
  }

  // Deep dark graphite/midnight navy backdrop
  return [11, 17, 32, 255];
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 32, 48, 128].forEach((size) => {
  const png = createPNG(size, size, drawFuturisticShield);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated futuristic icon${size}.png (${size}x${size})`);
});
