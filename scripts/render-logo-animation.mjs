import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configuration
const OUT_DIR = path.resolve(new URL('.', import.meta.url).pathname, '..', 'public', 'anim-frames');
const LOGO_PATH = path.resolve(new URL('.', import.meta.url).pathname, '..', 'public', 'images', 'GBP_Logo.jpg');
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 60;
const DURATION = 3.0;
const FRAMES = Math.round(FPS * DURATION); // 180

async function ensureOut() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function lerp(a,b,t){return a + (b-a)*t}

async function main(){
  await ensureOut();
  console.log('Loading logo:', LOGO_PATH);
  const logoMeta = await sharp(LOGO_PATH).metadata();
  console.log('Source logo size:', logoMeta.width, 'x', logoMeta.height);

  // Scale logo to fit the composition while preserving proportions.
  // Target: logo height about 56% of frame height (matches visual proportion in asset)
  const targetLogoHeight = Math.round(HEIGHT * 0.56);
  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ height: targetLogoHeight })
    .png()
    .toBuffer();

  const logo = sharp(logoBuffer);
  const { data: rawLogo, info: logoInfo } = await logo.raw().toBuffer({ resolveWithObject: true });
  const lw = logoInfo.width, lh = logoInfo.height, lch = logoInfo.channels; // expect 3 or 4
  console.log('Scaled logo size:', lw, 'x', lh, 'channels:', lch);

  // Sample background color from corners of the scaled logo: the logo file has background same as desired deep royal blue.
  // We'll sample pixel at (4,4)
  function samplePixel(x,y){
    const idx = (y*lw + x) * lch;
    return { r: rawLogo[idx], g: rawLogo[idx+1], b: rawLogo[idx+2], a: lch===4?rawLogo[idx+3]:255 };
  }
  const bgSample = samplePixel(4,4);
  const BG = { r: bgSample.r, g: bgSample.g, b: bgSample.b };
  console.log('Sampled background color:', BG);

  // Detect dominant non-background color (gold) to identify logo pixels.
  // Simple scan: collect quantized RGB bins for pixels that differ from background
  const freq = new Map();
  const bgThresh = 30; // color distance to consider as background
  for(let y=0;y<lh;y++){
    for(let x=0;x<lw;x++){
      const idx = (y*lw + x) * lch;
      const r=rawLogo[idx], g=rawLogo[idx+1], b=rawLogo[idx+2];
      const d = Math.sqrt((r-BG.r)**2 + (g-BG.g)**2 + (b-BG.b)**2);
      if(d > bgThresh){
        const key = `${r>>3},${g>>3},${b>>3}`;
        freq.set(key, (freq.get(key)||0)+1);
      }
    }
  }
  // find most frequent bucket
  let bestKey = null, bestCount=0;
  for(const [k,c] of freq){ if(c>bestCount){ bestCount=c; bestKey=k; }}
  const [gr,gg,gb] = bestKey.split(',').map(n=>parseInt(n)*8 + 4);
  const GOLD = { r: gr, g: gg, b: gb };
  console.log('Detected gold color (approx):', GOLD);

  // Create boolean mask of "gold" pixels (logo) relative to GOLD color using a tolerance
  const goldMask = new Uint8Array(lw*lh);
  for(let y=0;y<lh;y++){
    for(let x=0;x<lw;x++){
      const idx = (y*lw + x) * lch;
      const r=rawLogo[idx], g=rawLogo[idx+1], b=rawLogo[idx+2];
      const d = Math.sqrt((r-GOLD.r)**2 + (g-GOLD.g)**2 + (b-GOLD.b)**2);
      goldMask[y*lw + x] = d < 70 ? 1 : 0; // tolerant threshold
    }
  }

  // Define fractional bounding boxes (empirically chosen to match the source layout)
  // These are fractions of the scaled logo width/height
  const boxes = {
    G: { x: 0.06, y: 0.02, w: 0.5, h: 0.5 },
    B: { x: 0.28, y: 0.22, w: 0.5, h: 0.5 },
    P: { x: 0.52, y: 0.34, w: 0.46, h: 0.5 },
    TEXT: { x: 0.06, y: 0.74, w: 0.88, h: 0.16 }
  };

  // Precompute per-pixel assignment to one of the masks: 0=none,1=G,2=B,3=P, 4.. = text char index (1-based)
  const assign = new Uint8Array(lw*lh);
  // G/B/P masks
  function fillBoxAssign(box, val){
    const x0 = Math.floor(box.x * lw);
    const y0 = Math.floor(box.y * lh);
    const w = Math.floor(box.w * lw);
    const h = Math.floor(box.h * lh);
    for(let y=y0;y<y0+h;y++){
      if(y<0||y>=lh) continue;
      for(let x=x0;x<x0+w;x++){
        if(x<0||x>=lw) continue;
        const i = y*lw + x;
        if(goldMask[i]) assign[i] = val;
      }
    }
  }
  fillBoxAssign(boxes.G, 1);
  fillBoxAssign(boxes.B, 2);
  fillBoxAssign(boxes.P, 3);

  // TEXT: subdivide into 17 characters left-to-right
  const textChars = 17;
  const tx0 = Math.floor(boxes.TEXT.x * lw);
  const ty0 = Math.floor(boxes.TEXT.y * lh);
  const tw = Math.floor(boxes.TEXT.w * lw);
  const th = Math.floor(boxes.TEXT.h * lh);
  for(let ci=0;ci<textChars;ci++){
    const sx = tx0 + Math.floor(ci * (tw / textChars));
    const ex = tx0 + Math.floor((ci+1) * (tw / textChars));
    for(let y=ty0;y<ty0+th;y++){
      if(y<0||y>=lh) continue;
      for(let x=sx;x<ex;x++){
        if(x<0||x>=lw) continue;
        const i = y*lw + x;
        if(goldMask[i]) assign[i] = 4 + ci; // text indices start at 4
      }
    }
  }

  // Precompute a blurred glow layer from the gold pixels: downscale -> blur -> upscale to create soft glow
  const goldPng = Buffer.from(new Uint8Array(lw*lh*4));
  for(let y=0;y<lh;y++){
    for(let x=0;x<lw;x++){
      const srcIdx = (y*lw + x) * lch;
      const dstIdx = (y*lw + x) * 4;
      // if goldMask, copy gold color, else transparent
      if(goldMask[y*lw + x]){
        goldPng[dstIdx] = rawLogo[srcIdx];
        goldPng[dstIdx+1] = rawLogo[srcIdx+1];
        goldPng[dstIdx+2] = rawLogo[srcIdx+2];
        goldPng[dstIdx+3] = 255;
      } else {
        goldPng[dstIdx] = 0; goldPng[dstIdx+1]=0; goldPng[dstIdx+2]=0; goldPng[dstIdx+3]=0;
      }
    }
  }
  const glowBuf = await sharp(goldPng, { raw: { width: lw, height: lh, channels: 4 } })
    .resize(Math.max(1, Math.round(lw*0.25)))
    .png()
    .toBuffer();
  const glow = await sharp(glowBuf).resize(lw, lh).blur(20).png().toBuffer();

  // Loop frames
  for(let f=0; f<FRAMES; f++){
    const t = f / FPS; // seconds
    // Start with solid background
    const bg = { r: BG.r, g: BG.g, b: BG.b, a: 255 };
    const frame = Buffer.alloc(WIDTH * HEIGHT * 4);
    // fill background
    for(let i=0;i<WIDTH*HEIGHT;i++){
      const idx = i*4; frame[idx]=bg.r; frame[idx+1]=bg.g; frame[idx+2]=bg.b; frame[idx+3]=255;
    }

    // Camera push-in scale (2% over entire duration)
    const push = 1 + 0.02 * (t / DURATION); // 1.0 -> 1.02

    // Compute logo placement in frame: center horizontally, vertical offset to match original composition
    const destLogoW = Math.round(lw * push);
    const destLogoH = Math.round(lh * push);
    const dx = Math.round((WIDTH - destLogoW)/2);
    const dy = Math.round((HEIGHT - destLogoH)/2 - Math.round(HEIGHT*0.04)); // slight upward centering like source

    // For each pixel in scaled logo area, composite according to masks and per-letter visibility
    // Determine visibility for masks
    const vis = new Map();
    // G,B,P appear times
    const appear = { G:0.5, B:1.0, P:1.5 };
    const fadeDur = 0.22; // seconds for each letter fade-in
    vis.set(1, (()=>{ const s=appear.G; if(t<s) return 0; if(t>=s+fadeDur) return 1; return easeOutCubic((t-s)/fadeDur);})());
    vis.set(2, (()=>{ const s=appear.B; if(t<s) return 0; if(t>=s+fadeDur) return 1; return easeOutCubic((t-s)/fadeDur);})());
    vis.set(3, (()=>{ const s=appear.P; if(t<s) return 0; if(t>=s+fadeDur) return 1; return easeOutCubic((t-s)/fadeDur);})());

    // Text characters reveal from 2.0 to 2.6 (complete by 2.6), per-char small stagger
    const textStart = 2.0; const textEnd = 2.6; const textTotal = textEnd - textStart; // 0.6
    const perChar = textTotal / textChars; // ~0.035s
    for(let ci=0;ci<textChars;ci++){
      const s = textStart + ci*perChar;
      const v = (t < s) ? 0 : (t >= s + perChar ? 1 : easeOutCubic((t - s)/perChar));
      vis.set(4 + ci, v);
    }

    // Compose glow underneath with alpha scaled by overall reveal progress (so glow appears as letters appear)
    const overallReveal = Math.max(vis.get(1), vis.get(2), vis.get(3), ...Array.from({length:textChars},(_,i)=>vis.get(4+i)||0));

    // Prepare scaled rawLogo sampling: we'll use nearest-neighbor sampling for simplicity
    for(let yy=0; yy<destLogoH; yy++){
      const sy = Math.floor((yy / destLogoH) * lh);
      const fy = dy + yy;
      if(fy<0 || fy>=HEIGHT) continue;
      for(let xx=0; xx<destLogoW; xx++){
        const sx = Math.floor((xx / destLogoW) * lw);
        const fx = dx + xx;
        if(fx<0 || fx>=WIDTH) continue;
        const srcIdx = (sy*lw + sx) * lch;
        const dstIdx = (fy*WIDTH + fx) * 4;

        // determine assignment and visibility
        const aidx = sy*lw + sx;
        const assignVal = assign[aidx];
        // If this pixel is not part of gold (logo), skip — the source image included background which we already filled
        if(!goldMask[aidx]) continue;
        const visibility = vis.get(assignVal) || 0;
        if(visibility <= 0) continue;

        // vertical offset for fade-in (slight upward motion)
        let yOffset = 0;
        if(assignVal >=1 && assignVal <=3){
          // G/B/P upward motion during their fade: -10px -> 0
          const start = (assignVal===1?appear.G: assignVal===2?appear.B:appear.P);
          const v = vis.get(assignVal);
          yOffset = Math.round(-8 * (1 - v));
        }

        // sample from slightly offset source for motion (simple nearest)
        let ssy = clamp(sy - yOffset, 0, lh-1);
        const ssrcIdx = (ssy*lw + sx) * lch;
        const sr = rawLogo[ssrcIdx], sg = rawLogo[ssrcIdx+1], sb = rawLogo[ssrcIdx+2];

        // apply alpha as visibility (and assume source fully opaque gold)
        const srcA = 255 * visibility;
        const dstR = frame[dstIdx], dstG = frame[dstIdx+1], dstB = frame[dstIdx+2], dstA = frame[dstIdx+3];

        // simple 'over' composite
        const a = srcA/255;
        frame[dstIdx] = Math.round(sr*a + dstR*(1-a));
        frame[dstIdx+1] = Math.round(sg*a + dstG*(1-a));
        frame[dstIdx+2] = Math.round(sb*a + dstB*(1-a));
        frame[dstIdx+3] = 255;
      }
    }

    // Add glow layer (soft) underneath the logo according to overallReveal
    if(overallReveal > 0){
      // resize glow to destination logo size and composite with low alpha
      const glowImg = await sharp(glow).resize(destLogoW, destLogoH).png().toBuffer();
      // read glow raw
      const { data: graw, info: ginfo } = await sharp(glowImg).raw().toBuffer({ resolveWithObject: true });
      const gw = ginfo.width, gh = ginfo.height, gch = ginfo.channels;
      const gAlpha = 0.35 * overallReveal; // glow strength
      for(let yy=0; yy<gh; yy++){
        const fy = dy + yy; if(fy<0||fy>=HEIGHT) continue;
        for(let xx=0; xx<gw; xx++){
          const fx = dx + xx; if(fx<0||fx>=WIDTH) continue;
          const gIdx = (yy*gw + xx) * gch;
          const gr = graw[gIdx], gg = graw[gIdx+1], gb = graw[gIdx+2], ga = graw[gIdx+3];
          if(ga === 0) continue;
          const dstIdx = (fy*WIDTH + fx)*4;
          const a = (ga/255) * gAlpha;
          frame[dstIdx] = Math.round(gr*a + frame[dstIdx]*(1-a));
          frame[dstIdx+1] = Math.round(gg*a + frame[dstIdx+1]*(1-a));
          frame[dstIdx+2] = Math.round(gb*a + frame[dstIdx+2]*(1-a));
        }
      }
    }

    // Add metallic reflection sweep across completed logo between 2.2s and 2.9s
    const sweepStart = 2.2, sweepEnd = 2.9;
    if(t >= sweepStart && t <= sweepEnd){
      const sweepProgress = (t - sweepStart) / (sweepEnd - sweepStart);
      // sweep center across logo width
      const centerX = dx + Math.round(lerp(-destLogoW, destLogoW*2, sweepProgress));
      const sweepWidth = Math.round(destLogoW * 0.18);
      for(let yy=0; yy<destLogoH; yy++){
        const fy = dy + yy; if(fy<0||fy>=HEIGHT) continue;
        for(let xx=0; xx<destLogoW; xx++){
          const fx = dx + xx; if(fx<0||fx>=WIDTH) continue;
          const dist = Math.abs(fx - centerX);
          if(dist > sweepWidth) continue;
          const idx = (fy*WIDTH + fx)*4;
          // only affect pixels that are gold (rough check by distance to GOLD)
          // sample corresponding source pixel
          const sx = Math.floor((xx/destLogoW)*lw);
          const sy = Math.floor((yy/destLogoH)*lh);
          const sidx = (sy*lw + sx) * lch;
          const sr = rawLogo[sidx], sg = rawLogo[sidx+1], sb = rawLogo[sidx+2];
          const dToGold = Math.sqrt((sr-GOLD.r)**2 + (sg-GOLD.g)**2 + (sb-GOLD.b)**2);
          if(dToGold > 80) continue;
          // strength falls off with distance
          const strength = (1 - (dist / sweepWidth)) * 0.9;
          // add soft white-on-top highlight
          frame[idx] = clamp(frame[idx] + Math.round(255 * 0.6 * strength), 0, 255);
          frame[idx+1] = clamp(frame[idx+1] + Math.round(230 * 0.5 * strength), 0, 255);
          frame[idx+2] = clamp(frame[idx+2] + Math.round(200 * 0.4 * strength), 0, 255);
        }
      }
    }

    // Encode frame as PNG
    const outPath = path.join(OUT_DIR, `frame_${String(f).padStart(4,'0')}.png`);
    await sharp(frame, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toFile(outPath);
    if(f % 10 === 0) console.log('Wrote', outPath);
  }

  console.log('\nAll frames written to', OUT_DIR);
  console.log('To encode to MP4 at 60fps, use (requires ffmpeg installed):');
  console.log(`ffmpeg -y -framerate ${FPS} -i ${path.join(OUT_DIR,'frame_%04d.png')} -c:v libx264 -pix_fmt yuv420p -crf 18 -vf "format=yuv420p" gbp_logo_reveal_1920x1080_60fps.mp4`);
  console.log('Notes: If timings or letter box positions need fine-tuning, adjust the fractional boxes near the top of this script (boxes object).');
}

main().catch(err=>{ console.error(err); process.exit(1); });
