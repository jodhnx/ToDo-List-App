import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const iconsDir = path.join(publicDir, 'icons')
const splashDir = path.join(publicDir, 'splash')

const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]
const splashSizes = [
  [640, 1136],
  [750, 1334],
  [828, 1792],
  [1125, 2436],
  [1170, 2532],
  [1179, 2556],
  [1242, 2208],
  [1242, 2688],
  [1284, 2778],
  [1290, 2796],
  [1536, 2048],
  [1620, 2160],
  [1668, 2224],
  [1668, 2388],
  [2048, 2732],
]

const sourceIcon = await readFile(path.join(iconsDir, 'icon.svg'), 'utf8')

await mkdir(iconsDir, { recursive: true })
await mkdir(splashDir, { recursive: true })

await Promise.all(
  iconSizes.map((size) =>
    sharp(Buffer.from(sourceIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`)),
  ),
)

function splashSvg(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.22)
  const iconX = Math.round((width - iconSize) / 2)
  const iconY = Math.round(height * 0.38 - iconSize / 2)
  const textY = Math.round(iconY + iconSize + height * 0.07)

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0a0a0b"/>
      <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.18)}" r="${Math.round(width * 0.42)}" fill="#6366f1" opacity="0.14"/>
      <g transform="translate(${iconX} ${iconY})">
        <rect width="${iconSize}" height="${iconSize}" rx="${Math.round(iconSize * 0.25)}" fill="#6366f1"/>
        <path d="M${iconSize * 0.28} ${iconSize * 0.52}l${iconSize * 0.16} ${iconSize * 0.16}L${iconSize * 0.74} ${iconSize * 0.34}" stroke="white" stroke-width="${Math.max(12, iconSize * 0.08)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      <text x="50%" y="${textY}" fill="#fafafa" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${Math.round(width * 0.09)}" font-weight="700">Focus</text>
      <text x="50%" y="${textY + Math.round(width * 0.07)}" fill="#a1a1aa" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${Math.round(width * 0.035)}" font-weight="500">Aufgaben. Familie. Einkauf.</text>
    </svg>
  `
}

await Promise.all(
  splashSizes.map(([width, height]) =>
    sharp(Buffer.from(splashSvg(width, height)))
      .png()
      .toFile(path.join(splashDir, `apple-splash-${width}-${height}.png`)),
  ),
)

console.log(`Generated ${iconSizes.length} icons and ${splashSizes.length} splash screens.`)
