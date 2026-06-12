'use strict';

function buildResult({ scanRoot, entrypoints, used, unreferenced, possibleSourcesOfTruth, shadowSources, total, coverage }) {
  return {
    scanRoot,
    entrypoints,
    used,
    unreferenced,
    possibleSourcesOfTruth,
    shadowSources,
    summary: {
      totalFiles: total,
      usedFiles: used.length,
      unreferencedFiles: unreferenced.length,
      possibleSourcesOfTruth: possibleSourcesOfTruth.length,
      shadowSources: shadowSources.length,
      coverage: Number(coverage),
    },
  };
}

function formatText(result) {
  const lines = [];

  lines.push(`scan root  : ${result.scanRoot}`);
  lines.push('entrypoints:');
  for (const e of result.entrypoints) {
    lines.push(`  ${e}`);
  }
  lines.push('');

  lines.push('USED files:');
  for (const f of result.used) {
    lines.push(`  ${f}`);
  }
  lines.push('');

  lines.push('UNREFERENCED files:');
  if (result.unreferenced.length === 0) {
    lines.push('  (none)');
  } else {
    for (const f of result.unreferenced) {
      lines.push(`  ${f}`);
    }
  }
  lines.push('');

  lines.push('POSSIBLE_SOURCE_OF_TRUTH files:');
  if (result.possibleSourcesOfTruth.length === 0) {
    lines.push('  (none)');
  } else {
    for (const { file, fanIn } of result.possibleSourcesOfTruth) {
      lines.push(`  ${file}  (referenced by ${fanIn} files)`);
    }
  }
  lines.push('');

  lines.push('SHADOW_SOURCE files:');
  if (result.shadowSources.length === 0) {
    lines.push('  (none)');
  } else {
    for (const { file, duplicatesFrom, sharedExports } of result.shadowSources) {
      lines.push(`  ${file}`);
      lines.push(`    -> duplicates ${sharedExports.join(', ')} from ${duplicatesFrom}`);
    }
  }
  lines.push('');

  const s = result.summary;
  lines.push('Scan Summary:');
  lines.push(`  Total files scanned        : ${s.totalFiles}`);
  lines.push(`  Used files                 : ${s.usedFiles}`);
  lines.push(`  Unreferenced files         : ${s.unreferencedFiles}`);
  lines.push(`  Possible sources of truth  : ${s.possibleSourcesOfTruth}`);
  lines.push(`  Shadow sources             : ${s.shadowSources}`);
  lines.push(`  Coverage                   : ${s.coverage.toFixed(1)}%`);

  return lines.join('\n');
}

function formatJson(result) {
  return JSON.stringify(result, null, 2);
}

function formatMarkdown(result) {
  const lines = [];
  const s = result.summary;

  lines.push('# Source Truth Detector Report');
  lines.push('');
  lines.push(`- **Scan root**: \`${result.scanRoot}\``);
  lines.push('- **Entrypoints**:');
  for (const e of result.entrypoints) {
    lines.push(`  - \`${e}\``);
  }
  lines.push('');

  lines.push('## Scan Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Total files scanned | ${s.totalFiles} |`);
  lines.push(`| Used files | ${s.usedFiles} |`);
  lines.push(`| Unreferenced files | ${s.unreferencedFiles} |`);
  lines.push(`| Possible sources of truth | ${s.possibleSourcesOfTruth} |`);
  lines.push(`| Shadow sources | ${s.shadowSources} |`);
  lines.push(`| Coverage | ${s.coverage.toFixed(1)}% |`);
  lines.push('');

  lines.push('## UNREFERENCED files');
  lines.push('');
  if (result.unreferenced.length === 0) {
    lines.push('(none)');
  } else {
    for (const f of result.unreferenced) {
      lines.push(`- \`${f}\``);
    }
  }
  lines.push('');

  lines.push('## POSSIBLE_SOURCE_OF_TRUTH files');
  lines.push('');
  if (result.possibleSourcesOfTruth.length === 0) {
    lines.push('(none)');
  } else {
    for (const { file, fanIn } of result.possibleSourcesOfTruth) {
      lines.push(`- \`${file}\` (referenced by ${fanIn} files)`);
    }
  }
  lines.push('');

  lines.push('## SHADOW_SOURCE files');
  lines.push('');
  if (result.shadowSources.length === 0) {
    lines.push('(none)');
  } else {
    for (const { file, duplicatesFrom, sharedExports } of result.shadowSources) {
      lines.push(`- \`${file}\``);
      lines.push(`  - duplicates \`${sharedExports.join(', ')}\` from \`${duplicatesFrom}\``);
    }
  }
  lines.push('');

  lines.push('## USED files');
  lines.push('');
  for (const f of result.used) {
    lines.push(`- \`${f}\``);
  }
  lines.push('');

  return lines.join('\n');
}

module.exports = {
  buildResult,
  formatText,
  formatJson,
  formatMarkdown,
};
