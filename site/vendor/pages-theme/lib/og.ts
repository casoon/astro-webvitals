import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { ResolvedConfig } from '../index';

/** Dark theme tokens (styles/tokens.css): the card looks like the site at night. */
const BG = '#101010';
const HEADING = '#f4f4f4';
const TEXT = '#c3c7c7';
const MUTED = '#8c9090';
const ACCENT = 'rgb(58 206 222)';

const WIDTH = 1200;
const HEIGHT = 630;
const X = 88;

const asset = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const SANS = asset('../fonts/onest-latin-wght-normal.woff2');
const MONO = asset('../fonts/jetbrains-mono-latin-400-normal.woff2');

const escapeMarkup = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Cut at a word boundary so the text keeps to about three lines on the card. */
const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max - 1))} …`;

/** One text block via Pango, in a font file of the theme: no system fonts involved. */
const text = (markup: string, font: string, fontfile: string, width: number) =>
  sharp({ text: { text: markup, font, fontfile, width, wrap: 'word', rgba: true } })
    .png()
    .toBuffer();

/** The project's 1200×630 Open Graph image: name, tagline and description, address. */
export async function renderOgImage(config: ResolvedConfig, site: URL): Promise<Buffer> {
  const accent = config.accent?.dark ?? ACCENT;
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` +
      `<rect width="100%" height="100%" fill="${BG}"/>` +
      `<rect width="12" height="100%" fill="${accent}"/>` +
      `<rect x="${X}" y="${HEIGHT - 128}" width="${WIDTH - 2 * X}" height="1" fill="${MUTED}" opacity="0.4"/>` +
      '</svg>'
  );
  const logo = await sharp(await readFile(asset('../assets/casoon-logo-dark.svg')), {
    density: 300,
  })
    .resize({ width: 176 })
    .png()
    .toBuffer();
  const address = `${site.host}${site.pathname}`.replace(/\/$/, '');
  const span = (color: string, content: string) =>
    `<span foreground="${color}">${escapeMarkup(content)}</span>`;

  const [eyebrow, name, tagline, description, host] = await Promise.all([
    text(span(MUTED, 'CASOON Open Source'), 'JetBrains Mono 26', MONO, 1000),
    text(
      `<span foreground="${HEADING}" weight="600">${escapeMarkup(config.name)}</span>`,
      'Onest 96',
      SANS,
      WIDTH - 2 * X
    ),
    config.tagline && text(span(HEADING, config.tagline), 'Onest 44', SANS, WIDTH - 2 * X),
    text(
      span(TEXT, clip(config.description, config.tagline ? 150 : 140)),
      config.tagline ? 'Onest 30' : 'Onest 40',
      SANS,
      WIDTH - 2 * X
    ),
    text(span(MUTED, address), 'JetBrains Mono 24', MONO, 640),
  ]);
  const size = async (image: Buffer) => sharp(image).metadata();
  const taglineHeight = tagline ? ((await size(tagline)).height ?? 0) + 24 : 0;

  return sharp(background)
    .composite([
      { input: eyebrow, left: X, top: 76 },
      { input: name, left: X, top: 128 },
      ...(tagline ? [{ input: tagline, left: X, top: 268 }] : []),
      { input: description, left: X, top: 268 + taglineHeight },
      { input: logo, left: X, top: HEIGHT - 92 },
      { input: host, left: WIDTH - X - ((await size(host)).width ?? 0), top: HEIGHT - 80 },
    ])
    .png()
    .toBuffer();
}
