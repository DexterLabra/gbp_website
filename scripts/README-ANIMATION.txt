Script: render-logo-animation.mjs

What it does:
- Generates 180 PNG frames (1920x1080, 60 FPS, 3s) in public/anim-frames
- Preserves the original logo colors and proportions
- Implements per-letter reveal timing:
  * G: starts at 0.5s (fade + slight upward motion + metallic shine)
  * B: starts at 1.0s
  * P: starts at 1.5s
  * "HOME ART & DECORS" reveals letter-by-letter from 2.0s to 2.6s (left-to-right)
- Adds a soft glow under the logo, a metallic reflection sweep across the completed logo (2.2s-2.9s), and a 2% camera push-in over the whole animation.

Requirements:
- Node.js
- npm install (sharp is already listed in package.json for this repo)
- ffmpeg (to encode PNG frames into MP4) - ffmpeg is not required for frame generation but is required to produce the final MP4.

Usage:
1. From the repository root run:
   npm install

2. Run the renderer (this writes frames to public/anim-frames):
   node scripts/render-logo-animation.mjs

3. Encode frames to MP4 (requires ffmpeg):
   ffmpeg -y -framerate 60 -i public/anim-frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -vf "format=yuv420p" gbp_logo_reveal_1920x1080_60fps.mp4

Notes / Tuning:
- The script attempts to auto-detect the gold color and the dark royal-blue background from the provided image.
- Per-letter bounding boxes are defined as fractions near the top of the script. If a letter's reveal mask does not perfectly match the artwork, tweak those fractions in the `boxes` object.
- If ffmpeg is available in your environment you can also modify the script to call ffmpeg automatically after frames are created.

If you'd like, I can:
- Run the renderer here and produce the MP4 for you if ffmpeg becomes available in this environment (or if you want me to call ffmpeg directly when it's present).
- Adjust per-letter boxes if you provide pixel-accurate bounding-box coordinates or want me to iterate until the masks align perfectly.
