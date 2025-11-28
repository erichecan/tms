// 测试报告生成脚本
// 创建时间: 2025-11-24T18:20:00Z
// 目的: 汇总所有测试结果，生成完整的测试报告

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshot?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

interface FullTestReport {
  timestamp: string;
  suites: TestSuite[];
  overall: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  issues: {
    critical: string[];
    warnings: string[];
    suggestions: string[];
  };
}

/**
 * 生成完整的测试报告
 */
export function generateTestReport(testResultsDir: string = './test-results'): FullTestReport {
  const report: FullTestReport = {
    timestamp: new Date().toISOString(),
    suites: [],
    overall: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0
    },
    issues: {
      critical: [],
      warnings: [],
      suggestions: []
    }
  };

  // 读取 Playwright 测试结果
  const playwrightResultsFile = path.join(testResultsDir, 'test-results.json');
  if (fs.existsSync(playwrightResultsFile)) {
    try {
      const playwrightData = JSON.parse(fs.readFileSync(playwrightResultsFile, 'utf-8'));
      const suite: TestSuite = {
        name: 'Playwright E2E Tests',
        results: [],
        summary: {
          total: playwrightData.stats?.expected || 0,
          passed: (playwrightData.stats?.expected || 0) - (playwrightData.stats?.unexpected || 0),
          failed: playwrightData.stats?.unexpected || 0,
          skipped: playwrightData.stats?.skipped || 0
        }
      };

      if (playwrightData.suites) {
        for (const testSuite of playwrightData.suites) {
          if (testSuite.specs) {
            for (const spec of testSuite.specs) {
              if (spec.tests) {
                for (const test of spec.tests) {
                  suite.results.push({
                    name: `${spec.title} - ${test.title}`,
                    status: test.results?.[0]?.status === 'passed' ? 'passed' : 'failed',
                    duration: test.results?.[0]?.duration,
                    error: test.results?.[0]?.error?.message
                  });
                }
              }
            }
          }
        }
      }

      report.suites.push(suite);
    } catch (error) {
      report.issues.warnings.push(`无法解析 Playwright 测试结果: ${error}`);
    }
  }

  // 读取 MCP 测试结果
  const mcpResultsFiles = fs.readdirSync(testResultsDir)
    .filter(f => f.startsWith('mcp-test-report-') && f.endsWith('.json'));
  
  if (mcpResultsFiles.length > 0) {
    const latestMcpFile = mcpResultsFiles.sort().reverse()[0];
    try {
      const mcpData = JSON.parse(fs.readFileSync(path.join(testResultsDir, latestMcpFile), 'utf-8'));
      const suite: TestSuite = {
        name: 'Chrome DevTools MCP Tests',
        results: mcpData.results || [],
        summary: mcpData.summary || {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        }
      };
      report.suites.push(suite);
    } catch (error) {
      report.issues.warnings.push(`无法解析 MCP 测试结果: ${error}`);
    }
  }

  // 计算总体统计
  for (const suite of report.suites) {
    report.overall.total += suite.summary.total;
    report.overall.passed += suite.summary.passed;
    report.overall.failed += suite.summary.failed;
    report.overall.skipped += suite.summary.skipped;
  }

  if (report.overall.total > 0) {
    report.overall.passRate = (report.overall.passed / report.overall.total) * 100;
  }

  // 识别问题
  if (report.overall.failed > 0) {
    report.issues.critical.push(`${report.overall.failed} 个测试失败`);
  }

  if (report.overall.passRate < 80) {
    report.issues.warnings.push(`测试通过率较低: ${report.overall.passRate.toFixed(1)}%`);
  }

  if (report.overall.skipped > 0) {
    report.issues.suggestions.push(`${report.overall.skipped} 个测试被跳过，建议完成这些测试`);
  }

  return report;
}

/**
 * 生成 Markdown 格式的报告
 */
export function generateMarkdownReport(report: FullTestReport): string {
  let md = `# 完整测试报告\n\n`;
  md += `**生成时间**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  md += `## 测试摘要\n\n`;
  md += `| 指标 | 数值 |\n`;
  md += `|------|------|\n`;
  md += `| 总测试数 | ${report.overall.total} |\n`;
  md += `| 通过 | ${report.overall.passed} ✅ |\n`;
  md += `| 失败 | ${report.overall.failed} ❌ |\n`;
  md += `| 跳过 | ${report.overall.skipped} ⏭️ |\n`;
  md += `| 通过率 | ${report.overall.passRate.toFixed(1)}% |\n\n`;

  md += `## 测试套件详情\n\n`;
  for (const suite of report.suites) {
    md += `### ${suite.name}\n\n`;
    md += `- 总数: ${suite.summary.total}\n`;
    md += `- 通过: ${suite.summary.passed}\n`;
    md += `- 失败: ${suite.summary.failed}\n`;
    md += `- 跳过: ${suite.summary.skipped}\n\n`;

    if (suite.results.length > 0) {
      md += `#### 测试结果\n\n`;
      for (const result of suite.results) {
        const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
        md += `- ${status} **${result.name}**`;
        if (result.duration) {
          md += ` (${result.duration}ms)`;
        }
        if (result.error) {
          md += `\n  - 错误: ${result.error}`;
        }
        md += `\n`;
      }
      md += `\n`;
    }
  }

  if (report.issues.critical.length > 0 || report.issues.warnings.length > 0 || report.issues.suggestions.length > 0) {
    md += `## 问题与建议\n\n`;
    
    if (report.issues.critical.length > 0) {
      md += `### 🔴 关键问题\n\n`;
      for (const issue of report.issues.critical) {
        md += `- ${issue}\n`;
      }
      md += `\n`;
    }

    if (report.issues.warnings.length > 0) {
      md += `### ⚠️ 警告\n\n`;
      for (const warning of report.issues.warnings) {
        md += `- ${warning}\n`;
      }
      md += `\n`;
    }

    if (report.issues.suggestions.length > 0) {
      md += `### 💡 建议\n\n`;
      for (const suggestion of report.issues.suggestions) {
        md += `- ${suggestion}\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;
  md += `**报告生成时间**: ${new Date().toLocaleString()}\n`;

  return md;
}

// 如果直接运行此脚本
if (require.main === module) {
  const testResultsDir = process.argv[2] || './test-results';
  
  if (!fs.existsSync(testResultsDir)) {
    console.error(`测试结果目录不存在: ${testResultsDir}`);
    process.exit(1);
  }

  const report = generateTestReport(testResultsDir);
  const mdReport = generateMarkdownReport(report);

  // 保存报告
  const reportDir = path.join(testResultsDir, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = path.join(reportDir, `test-report-${timestamp}.json`);
  const mdFile = path.join(reportDir, `test-report-${timestamp}.md`);

  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdFile, mdReport);

  console.log('✅ 测试报告生成完成！');
  console.log(`📄 JSON 报告: ${jsonFile}`);
  console.log(`📄 Markdown 报告: ${mdFile}`);
  console.log(`\n总体通过率: ${report.overall.passRate.toFixed(1)}%`);
}

export { generateMarkdownReport };

