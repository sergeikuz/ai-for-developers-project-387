import fs from 'fs'
import { execSync } from 'child_process'

const THRESHOLDS = {
  performance: 0.70,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90,
}

const PAGES = [
  { name: 'Главная (/)', file: 'lighthouse-reports/home.report.json' },
  { name: 'Каталог (/book)', file: 'lighthouse-reports/catalog.report.json' },
  { name: 'Бронирование (/book/meeting-15)', file: 'lighthouse-reports/booking.report.json' },
]

const CATEGORY_LABELS = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
}

function readReport(file) {
  if (!fs.existsSync(file)) {
    console.error(`Report not found: ${file}`)
    return null
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function checkThresholds() {
  const results = []
  const problems = []

  for (const page of PAGES) {
    const report = readReport(page.file)
    if (!report) continue

    const pageResult = { page: page.name, scores: {}, url: report.finalDisplayedUrl || 'unknown' }

    for (const [key, threshold] of Object.entries(THRESHOLDS)) {
      const category = report.categories[key]
      if (!category) continue

      const score = category.score ?? 0
      pageResult.scores[key] = score

      if (score < threshold) {
        problems.push({
          page: page.name,
          category: CATEGORY_LABELS[key],
          score,
          threshold,
        })
      }
    }

    results.push(pageResult)
  }

  return { results, problems }
}

function scoreDisplay(score) {
  if (score >= 0.9) return `\`${(score * 100).toFixed(0)}\` ✅`
  if (score >= 0.7) return `\`${(score * 100).toFixed(0)}\` ⚠️`
  return `\`${(score * 100).toFixed(0)}\` ❌`
}

function buildIssueBody({ results, problems }) {
  const date = new Date().toISOString().split('T')[0]
  const runUrl = process.env.RUN_URL || 'unknown'
  let body = `## Lighthouse Nightly Audit — ${date}\n\n`

  if (problems.length > 0) {
    body += `### 🚨 Обнаружены проблемы\n\n`
    body += `| Страница | Категория | Score | Порог |\n`
    body += `|---|---|---|---|\n`
    for (const p of problems) {
      body += `| ${p.page} | ${p.category} | ${(p.score * 100).toFixed(0)} | ${(p.threshold * 100).toFixed(0)} |\n`
    }
    body += `\n`
  }

  body += `### Все результаты\n\n`
  body += `| Страница | Perf | A11y | Best Practices | SEO |\n`
  body += `|---|---|---|---|---|\n`
  for (const r of results) {
    const perf = r.scores.performance !== undefined ? scoreDisplay(r.scores.performance) : '—'
    const a11y = r.scores.accessibility !== undefined ? scoreDisplay(r.scores.accessibility) : '—'
    const bp = r.scores['best-practices'] !== undefined ? scoreDisplay(r.scores['best-practices']) : '—'
    const seo = r.scores.seo !== undefined ? scoreDisplay(r.scores.seo) : '—'
    body += `| ${r.page} | ${perf} | ${a11y} | ${bp} | ${seo} |\n`
  }

  body += `\n**Run:** [GitHub Actions](${runUrl})\n`
  body += `**Отчёты:** [скачать HTML-отчёты](${runUrl}#artifacts)\n`

  return body
}

function checkDuplicateIssue() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const output = execSync(
      `gh issue list --label "lighthouse-audit" --state open --json title,createdAt --limit 10`,
      { encoding: 'utf8' }
    )
    const issues = JSON.parse(output || '[]')
    return issues.some((issue) => issue.createdAt && issue.createdAt.startsWith(today))
  } catch {
    return false
  }
}

function createIssue(body) {
  const date = new Date().toISOString().split('T')[0]
  const title = `Lighthouse Audit — ${date} — есть проблемы`

  execSync(
    `gh issue create --title "${title}" --body "${body}" --label "lighthouse-audit"`,
    { encoding: 'utf8', stdio: 'inherit' }
  )
  console.log(`Issue created: ${title}`)
}

function main() {
  console.log('Checking Lighthouse results...')
  const { results, problems } = checkThresholds()

  if (results.length === 0) {
    console.error('No reports found — Lighthouse audit may have failed')
    process.exit(1)
  }

  if (problems.length === 0) {
    console.log('All thresholds passed — no issue needed')
    process.exit(0)
  }

  console.log(`Found ${problems.length} problem(s):`)
  for (const p of problems) {
    console.log(`  ${p.page} — ${p.category}: ${(p.score * 100).toFixed(0)} < ${(p.threshold * 100).toFixed(0)}`)
  }

  if (checkDuplicateIssue()) {
    console.log('Issue for today already exists — skipping')
    process.exit(0)
  }

  const body = buildIssueBody({ results, problems })
  createIssue(body)
}

main()
