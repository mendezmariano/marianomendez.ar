"""Extract reproducible color samples and video contact sheets from local references.
Requires Pillow plus ffmpeg/ffprobe. Does not alter the reference files.
"""
import argparse
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[2] / 'resourses/imagenes')
parser.add_argument('--output', type=Path, default=Path('/tmp/mendez-lab-references'))
parser.add_argument('--motion-start', type=float, default=598.8)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 12)
except OSError:
    font = ImageFont.load_default()

def sheet(items, filename, columns=4, cell=(320, 264)):
    result = Image.new('RGB', (columns * cell[0], ((len(items)+columns-1)//columns)*cell[1]), '#181b24')
    draw = ImageDraw.Draw(result)
    for i, (name, im) in enumerate(items):
        x, y = (i % columns)*cell[0], (i//columns)*cell[1]
        im = im.convert('RGB')
        im.thumbnail((cell[0]-12, cell[1]-38), Image.Resampling.NEAREST)
        result.paste(im, (x+(cell[0]-im.width)//2, y+6))
        draw.text((x+6, y+cell[1]-28), name[:43], font=font, fill='white')
    result.save(args.output / filename)

images, records = [], []
for path in sorted(args.source.iterdir()):
    if path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.gif', '.webp'}:
        continue
    with Image.open(path) as source:
        im = source.convert('RGB')
    images.append((path.name, im))
    # Most screenshots include verbs below the scene. Exclude that lower area.
    scene = im.crop((0, 0, im.width, round(im.height*.70))) if im.width > im.height else im
    scene.thumbnail((320, 240), Image.Resampling.NEAREST)
    quantized = scene.quantize(colors=16, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()
    colors = []
    for count, index in sorted(quantized.getcolors(), reverse=True):
        rgb = palette[index*3:index*3+3]
        colors.append({'hex': '#'+''.join(f'{channel:02x}' for channel in rgb), 'share': round(count/(scene.width*scene.height), 4)})
    records.append({'file': path.name, 'size': list(im.size), 'colors': colors})
sheet(images, 'images.jpg')
video = next(args.source.glob('*.mp4'), None)
if video:
    metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=width,height,r_frame_rate', '-of', 'json', str(video)]))
    def video_frame(time):
        target = args.output / f'frame-{time:.3f}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', str(video), '-frames:v', '1', '-y', str(target)], check=True)
        return Image.open(target).convert('RGB')
    frames = [(f'{time:.1f} s', video_frame(time)) for time in [5, 30, 60, 90, 120, 180, 240, 360, 600, 900, 1200, 1800]]
    sheet(frames, 'video.jpg')
    motion = [(f'{args.motion_start+i/10:.2f} s', video_frame(args.motion_start+i/10)) for i in range(12)]
    sheet(motion, 'motion.jpg', columns=4)
    walking = [(name, im.crop((0, round(im.height*.0556), im.width, round(im.height*.6111)))) for name, im in motion]
    sheet(walking, 'walking.jpg', columns=4, cell=(320, 175))
else:
    metadata = None
(args.output / 'analysis.json').write_text(json.dumps({'images': records, 'video': metadata, 'motion_start': args.motion_start}, indent=2)+'\n')
print(f'Analyzed {len(images)} images. Results: {args.output}')
