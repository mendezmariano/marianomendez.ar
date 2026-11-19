import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../dist/style.css', import.meta.url), 'utf8');

function palette(selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `Missing palette: ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--reader-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, value]) => [name, value]));
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(component => parseInt(component, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

for (const [theme, selector] of [['light', '.reader-dialog {'], ['dark', '.reader-dialog[data-reader-theme="dark"] {']]) {
  test(`${theme} reader text, metadata, links and selected controls meet WCAG AA contrast`, () => {
    const colors = palette(selector);
    for (const foreground of ['ink', 'muted', 'link', 'link-hover']) {
      for (const background of ['paper', 'inset']) {
        const ratio = contrast(colors[foreground], colors[background]);
        assert.ok(ratio >= 4.5, `${theme}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1`);
      }
    }
    // The selected theme button inverts link/paper; its text uses the same ratio.
    assert.ok(contrast(colors.paper, colors.link) >= 4.5);
    for (const background of ['paper', 'inset']) {
      assert.ok(contrast(colors['control-line'], colors[background]) >= 3, `${theme}: button boundaries remain visible`);
    }
  });
}
