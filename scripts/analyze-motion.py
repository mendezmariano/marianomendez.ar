"""Sample the supplied gameplay at its recorded cadence and measure camera motion.
Requires the optional Pillow lockfile and FFmpeg. Source files remain unchanged.
"""
import argparse
import json
from pathlib import Path
from statistics import mean
import subprocess
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[2] / 'resourses/imagenes')
parser.add_argument('--output', type=Path, default=Path('/tmp/mendez-motion-analysis'))
args = parser.parse_args()
video = next(args.source.glob('*.mp4'))
args.output.mkdir(parents=True, exist_ok=True)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 11)
except OSError:
    font = ImageFont.load_default()
# Crops are explicit observations from the 960 x 720 recording, not automatic detections.
clips = [
    ('right', 598.8, 1.3, (620, 198, 770, 406)),
    ('left', 1199.8, 1.1, (300, 180, 640, 430)),
    ('turn', 118.8, 1.5, (380, 170, 540, 420)),
    ('other-character', 1801.0, 1.3, (0, 35, 960, 450)),
]
report = {'video': video.name, 'sample_fps': 30, 'clips': [], 'scope': 'Selected clips, not the full recording. Camera measurements use static background rows in the right-facing clip.'}
for name, start, duration, crop in clips:
    directory = args.output / name
    directory.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', str(video), '-t', str(duration), '-vf', 'fps=30', '-y', str(directory / '%03d.png')], check=True)
    paths = sorted(directory.glob('*.png'))[:round(duration*30)]
    frames = [Image.open(path).convert('RGB') for path in paths]
    indices = list(range(0, len(frames), 2))
    columns, width, height = 6, 180, 245
    sheet = Image.new('RGB', (columns*width, ((len(indices)+columns-1)//columns)*height), '#171c23')
    draw = ImageDraw.Draw(sheet)
    for index, frame_number in enumerate(indices):
        image = frames[frame_number].crop(crop)
        image.thumbnail((width-12, height-36), Image.Resampling.NEAREST)
        x, y = index % columns * width, index // columns * height
        sheet.paste(image, (x+(width-image.width)//2, y+5))
        draw.text((x+8,y+height-24), f'{start+frame_number/30:.3f} s', font=font, fill='white')
    sheet.save(args.output / f'{name}-contact.png')
    entry = {'name': name, 'start_seconds': start, 'duration_seconds': duration, 'crop': list(crop), 'frames': len(frames)}
    if name == 'right':
        shifts = []
        for before, after in zip(frames, frames[1:]):
            a, b = before.load(), after.load()
            candidates = []
            for shift in range(-28, 29):
                error = sum(sum(abs(a[x,y][channel]-b[x+shift,y][channel]) for channel in range(3)) for y in (160,175,190) for x in range(40,600,8))
                candidates.append((error, abs(shift), shift))
            shifts.append(min(candidates)[2])
        entry['background_shift_per_frame_px'] = shifts
        entry['camera_displacement_px'] = -sum(shifts)
        entry['camera_speed_px_per_second'] = round(-mean(shifts)*30, 2)
        entry['nonzero_background_updates'] = sum(shift != 0 for shift in shifts)
        # Twenty recorded frames cover approximately one visually identified cycle.
        cycle = [image.crop(crop) for image in frames[:20]]
        cycle[0].save(args.output / 'reference-cycle.gif', save_all=True, append_images=cycle[1:], duration=[30,30,40]*6+[30,40], loop=0)
    report['clips'].append(entry)
(args.output / 'measurements.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
