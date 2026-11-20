import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

function renderSvg(svgPath, pngPath, width) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Rendered ${svgPath} -> ${pngPath} (${pngBuffer.length} bytes)`);
}

// 1. Render banner.png (1200px width)
renderSvg(path.resolve('media/banner.svg'), path.resolve('media/banner.png'), 1200);

// 2. Render logo.png (512px width)
renderSvg(path.resolve('media/logo.svg'), path.resolve('media/logo.png'), 512);

// 3. Render icon for VS Code extension
renderSvg(path.resolve('media/logo.svg'), path.resolve('vscode-extension/media/icon.png'), 128);

// 4. Also copy banner.png into vscode-extension/media/banner.png
fs.copyFileSync(path.resolve('media/banner.png'), path.resolve('vscode-extension/media/banner.png'));
console.log('Copied banner.png to vscode-extension/media/banner.png');
