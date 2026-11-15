// Test-only HTTP transport: uses the Windows/system trust store through curl.
const { spawnSync } = require('node:child_process');
function auditFetch(url, options = {}) {
  const args = ['-sS', '--max-time', '90', '-w', '\n%{http_code}', '-X', options.method || 'GET', String(url)];
  for (const [key, value] of Object.entries(options.headers || {})) args.push('-H', `${key}: ${value}`);
  if (options.body !== undefined) args.push('--data-binary', '@-');
  const result = spawnSync('curl.exe', args, { input: options.body, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || 'HTTP transport failed');
  const split = result.stdout.lastIndexOf('\n');
  const status = Number(result.stdout.slice(split + 1));
  return Promise.resolve(new Response(status === 204 ? null : result.stdout.slice(0, split), { status }));
}
module.exports = auditFetch;
if (require.main === module) {
  global.fetch = auditFetch;
  require('./smoke-local');
}
