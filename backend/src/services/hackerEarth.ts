import axios from 'axios';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  runtime?: number;
  memory?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  testDetails?: Array<{ index: number; input: string; expected: string; actual: string; passed: boolean }>;
}

type TestCase = { input: string; expectedOutput: string };

function mapLanguageToHackerEarth(lang: string): string {
  const key = lang.toLowerCase();
  switch (key) {
    case 'js':
    case 'javascript':
    case 'node':
      return process.env.HE_LANG_JS || 'JAVASCRIPT_NODE';
    case 'py':
    case 'python':
      return process.env.HE_LANG_PY || 'PYTHON3';
    case 'java':
      return process.env.HE_LANG_JAVA || 'JAVA';
    case 'c++':
    case 'cpp':
      return process.env.HE_LANG_CPP || 'CPP17';
    case 'c':
      return process.env.HE_LANG_C || 'C';
    case 'c#':
    case 'csharp':
      return process.env.HE_LANG_CSHARP || 'CSHARP';
    case 'go':
      return process.env.HE_LANG_GO || 'GO';
    case 'rust':
      return process.env.HE_LANG_RUST || 'RUST';
    case 'php':
      return 'PHP';
    case 'ruby':
      return 'RUBY';
    default:
      return process.env.HE_DEFAULT_LANG || 'PYTHON3';
  }
}

function wrapUserCode(language: string, src: string): string {
  const lang = language.toLowerCase();
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    return `${src}
  // Auto-generated harness for HackerEarth
const fs = require('fs');
(async () => {
  try {
    const input = fs.readFileSync(0, 'utf8').toString().trim();
    if (typeof solution === 'function') {
      const result = await Promise.resolve(solution(input));
      if (typeof result !== 'undefined') {
        console.log(String(result));
      }
    }
  } catch (e) {
    console.error(e && e.message ? e.message : String(e));
  }
})();
`;
  }
  if (lang === 'python' || lang === 'py') {
    return `${src}
# Auto-generated harness for PrepPro
import sys
def __run():
    try:
        data = sys.stdin.read().strip()
        if 'solution' in globals():
            res = solution(data)
            if res is not None:
                sys.stdout.write(str(res))
    except Exception as e:
        sys.stderr.write(str(e))

if __name__ == '__main__':
    __run()
`;
  }
  return src;
}

async function runOnHackerEarth(params: {
  source: string;
  language: string;
  input?: string;
}): Promise<{ ok: boolean; output?: string; error?: string; timeMs?: number; memoryKb?: number }> {
  const apiUrl = process.env.HE_API_URL || 'https://api.hackerearth.com/v3/code/run/';
  const clientId = process.env.HE_CLIENT_ID;
  const clientSecret = process.env.HE_CLIENT_SECRET;
  const timeLimit = parseInt(process.env.HE_TIME_LIMIT_SECONDS || '5', 10);
  const memoryLimit = parseInt(process.env.HE_MEMORY_LIMIT_KB || '262144', 10); // 256MB

  if (!clientSecret) {
    return { ok: false, error: 'HackerEarth client secret not configured (HE_CLIENT_SECRET)' };
  }

  // v3 API accepts x-www-form-urlencoded
  const body = new URLSearchParams();
  if (clientId) body.append('client_id', clientId);
  body.append('client_secret', clientSecret);
  body.append('source', wrapUserCode(params.language, params.source));
  body.append('lang', mapLanguageToHackerEarth(params.language));
  body.append('time_limit', String(timeLimit));
  body.append('memory_limit', String(memoryLimit));
  body.append('input', params.input ?? '');

  try {
    const timeoutMs = parseInt(process.env.HE_TIMEOUT_MS || '15000', 10);
    const resp = await axios.post(apiUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: timeoutMs
    });

    const data = resp.data || {};
    const run = data.run_status || data;
    const status = (run.status || data.status || '').toString().toLowerCase();
    const compileStatus = (data.compile_status || '').toString();

    if (compileStatus && compileStatus !== 'OK' && compileStatus.toLowerCase() !== 'success') {
      return { ok: false, error: compileStatus };
    }

    // Common fields in HE response
    const output: string = (run.output || run.output_details || data.output || '').toString();
    const stderr: string = (run.stderr || data.stderr || '').toString();
    const statusDetail: string = (run.status_detail || data.status_detail || '').toString();
    const timeUsed = Number(run.time_used || run.time || data.time || 0);
  const memoryUsed = Number(run.memory_used || run.memory || data.memory || 0);

    if (status.includes('ac') || status.includes('accepted') || status.includes('ok')) {
      return { ok: true, output, timeMs: Math.round(timeUsed * 1000), memoryKb: memoryUsed };
    }

    // If there is output and no hard error, still return output but mark as ok
    if (output && !stderr && !statusDetail) {
      return { ok: true, output, timeMs: Math.round(timeUsed * 1000), memoryKb: memoryUsed };
    }

    const errMsg = [statusDetail, stderr].filter(Boolean).join('\n').trim() || 'Execution failed';
    return { ok: false, error: errMsg, timeMs: Math.round(timeUsed * 1000), memoryKb: memoryUsed };
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'HackerEarth API error';
    return { ok: false, error: String(msg) };
  }
}

export class HackerEarthExecutionService {
  async executeCode(code: string, language: string, testCases?: TestCase[]): Promise<ExecutionResult> {
    // If test cases provided, run them individually to compute pass/fail
    if (testCases && testCases.length > 0) {
      let passed = 0;
      let totalRuntime = 0;
      let peakMemory = 0;
      const details: ExecutionResult['testDetails'] = [];

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const r = await runOnHackerEarth({ source: code, language, input: String(tc.input ?? '') });
        totalRuntime += r.timeMs || 0;
        peakMemory = Math.max(peakMemory, r.memoryKb || 0);
        const actual = (r.output ?? r.error ?? '').toString().trim();
        const expected = String(tc.expectedOutput ?? '').trim();
        const ok = r.ok && actual === expected;
        if (ok) passed++;
        details!.push({ index: i + 1, input: String(tc.input ?? ''), expected, actual, passed: ok });
      }

      const summary = details!.map(d => `Test ${d.index}: ${d.passed ? 'PASS' : 'FAIL'}`).join('\n');
      return {
        success: true,
        output: summary,
        runtime: totalRuntime,
        memory: peakMemory,
        testCasesPassed: passed,
        totalTestCases: testCases.length,
        testDetails: details!,
      };
    }

    // Single execution without tests
    const r = await runOnHackerEarth({ source: code, language });
    if (r.ok) {
      return {
        success: true,
        output: r.output || '',
        runtime: r.timeMs,
        memory: r.memoryKb,
      };
    }
    return { success: false, error: r.error || 'Execution failed' };
  }
}
