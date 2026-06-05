import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = fileURLToPath(new URL('../dist', import.meta.url))
let removed = 0

function removeDSStoreFiles(dir) {
  if (!existsSync(dir)) return

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      removeDSStoreFiles(filePath)
    } else if (entry.name === '.DS_Store') {
      rmSync(filePath, { force: true })
      removed += 1
    }
  }
}

removeDSStoreFiles(distDir)

if (removed > 0) {
  console.log(`Removed ${removed} .DS_Store file${removed === 1 ? '' : 's'} from dist.`)
}
