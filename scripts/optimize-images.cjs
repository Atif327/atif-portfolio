const fs = require('fs/promises')
const path = require('path')
const sharp = require('sharp')

const publicDir = path.resolve(__dirname, '..', 'public')

const images = [
  {
    input: 'atif-ayyoub-ai-developer.png',
    output: 'atif-ayyoub-ai-developer',
    resize: { width: 640, height: 640, fit: 'cover', position: 'attention' },
  },
  {
    input: 'atif-ayyoub-profile.png',
    output: 'atif-ayyoub-profile',
    resize: { width: 480, height: 480, fit: 'cover', position: 'attention' },
  },
  {
    input: 'Atif logo.png',
    output: 'atif-logo',
    resize: { width: 320, height: 320, fit: 'cover', position: 'attention' },
  },
  {
    input: 'preview.png',
    output: 'preview',
    resize: { width: 900, withoutEnlargement: true },
  },
  {
    input: 'Wallpaper Hub.png',
    output: 'wallpaper-hub',
    resize: { width: 900, withoutEnlargement: true },
  },
  {
    input: 'Amazone Clone.png',
    output: 'amazone-clone',
    resize: { width: 900, withoutEnlargement: true },
  },
  {
    input: 'Student Evalution System.png',
    output: 'student-evaluation-system',
    resize: { width: 900, withoutEnlargement: true },
  },
  {
    input: 'Dr assistance.jpeg',
    output: 'dr-assistance',
    resize: { width: 900, withoutEnlargement: true },
  },
  {
    input: 'Task Manager.jpeg',
    output: 'task-manager',
    resize: { width: 900, withoutEnlargement: true },
  },
]

async function fileSize(filePath) {
  const stat = await fs.stat(filePath)
  return `${Math.round(stat.size / 1024)} KiB`
}

async function optimizeImage(image) {
  const inputPath = path.join(publicDir, image.input)
  const webpPath = path.join(publicDir, `${image.output}.webp`)
  const avifPath = path.join(publicDir, `${image.output}.avif`)
  const pipeline = sharp(inputPath).rotate().resize(image.resize)

  await pipeline.clone().webp({ quality: 72, effort: 5 }).toFile(webpPath)
  await pipeline.clone().avif({ quality: 44, effort: 4 }).toFile(avifPath)

  return {
    input: image.input,
    webp: `${path.basename(webpPath)} (${await fileSize(webpPath)})`,
    avif: `${path.basename(avifPath)} (${await fileSize(avifPath)})`,
  }
}

async function main() {
  const results = []

  for (const image of images) {
    results.push(await optimizeImage(image))
  }

  console.table(results)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
