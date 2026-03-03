const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')

function readFile(targetPath) {
  return fs.readFileSync(targetPath, 'utf8')
}

function writeFile(targetPath, content) {
  fs.writeFileSync(targetPath, content, 'utf8')
}

function patchMarkstreamVue() {
  const filePath = path.join(rootDir, 'node_modules', 'markstream-vue', 'dist', 'exports.js')
  if (!fs.existsSync(filePath)) {
    return 'skip'
  }

  const source = readFile(filePath)
  const needle = 'void 0!==import.meta&&Boolean(!1)'
  if (!source.includes(needle)) {
    return 'noop'
  }

  writeFile(filePath, source.replace(needle, '!1'))
  return 'patched'
}

function patchStreamMonaco() {
  const filePath = path.join(rootDir, 'node_modules', 'stream-monaco', 'dist', 'index.js')
  if (!fs.existsSync(filePath)) {
    return 'skip'
  }

  const replacement = `import {\n  RevealStrategy,\n  clearHighlighterCache,\n  defaultRevealDebounceMs,\n  detectLanguage,\n  ensureMonacoWorkersLegacy,\n  getOrCreateHighlighter,\n  preloadMonacoWorkers,\n  registerMonacoThemes,\n  useMonaco\n} from "./index.legacy.js";\n\nensureMonacoWorkersLegacy();\n\nexport {\n  RevealStrategy,\n  clearHighlighterCache,\n  defaultRevealDebounceMs,\n  detectLanguage,\n  ensureMonacoWorkersLegacy as ensureMonacoWorkers,\n  getOrCreateHighlighter,\n  preloadMonacoWorkers,\n  registerMonacoThemes,\n  useMonaco\n};\n`

  const current = readFile(filePath)
  if (current === replacement) {
    return 'noop'
  }

  writeFile(filePath, replacement)
  return 'patched'
}

const results = {
  markstreamVue: patchMarkstreamVue(),
  streamMonaco: patchStreamMonaco()
}

console.log('[patch-compat-deps]', results)
