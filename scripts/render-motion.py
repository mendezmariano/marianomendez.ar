"""Render a walking GIF from actual site modules. Requires Pillow and ImageMagick."""
import argparse
import json
from pathlib import Path
import subprocess
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--before', type=Path, help='Optional older checkout for a before/after comparison')
args = parser.parse_args()
command = ['node', str(Path(__file__).with_suffix('.mjs'))]
if args.before:
    command += ['--before', str(args.before.resolve())]
manifest = Path(subprocess.check_output(command, text=True).strip())
data = json.loads(manifest.read_text())
images = []
for path in map(Path, data['frames']):
    target = path.with_suffix('.png')
    subprocess.run(['convert', '-background', 'none', str(path), str(target)], check=True)
    images.append(Image.open(target).convert('RGB'))
output = manifest.parent / ('comparison.gif' if data['comparison'] else 'walking.gif')
images[0].save(output, save_all=True, append_images=images[1:], duration=[30,30,40]*16, loop=0)
print(f'{output}\nAnimation rendered from site modules, not a browser recording.')
