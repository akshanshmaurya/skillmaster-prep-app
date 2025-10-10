import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

export class CodeExecutionService {
  private tempDir: string;

  constructor() {
    this.tempDir = join(tmpdir(), 'preppro-code-execution');
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Execute code in the specified language
   */
  async executeCode(
    code: string,
    language: string,
    testCases?: Array<{ input: string; expectedOutput: string }>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      switch (language.toLowerCase()) {
        case 'javascript':
          return await this.executeJavaScript(code, testCases);
        case 'python':
          return await this.executePython(code, testCases);
        case 'java':
          return await this.executeJava(code, testCases);
        case 'cpp':
        case 'c++':
          return await this.executeCpp(code, testCases);
        case 'csharp':
        case 'c#':
          return await this.executeCSharp(code, testCases);
        case 'go':
          return await this.executeGo(code, testCases);
        case 'rust':
          return await this.executeRust(code, testCases);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        runtime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute JavaScript code using Node.js
   */
  private async executeJavaScript(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}.js`;
    const filePath = join(this.tempDir, fileName);

    try {
      // Wrap code in a function and add test execution
      const wrappedCode = this.wrapJavaScriptCode(code, testCases);
      writeFileSync(filePath, wrappedCode);

      const result = await this.runCommand('node', [filePath]);
      const runtime = Date.now() - startTime;

      if (result.success) {
        const output = result.output.trim();
        const lines = output.split('\n');
        
        // Check if it's test results
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines.slice(1).join('\n'));
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total,
            testDetails: testResults.tests
          };
        }

        return {
          success: true,
          output: result.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: result.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(filePath);
    }
  }

  /**
   * Execute Python code
   */
  private async executePython(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}.py`;
    const filePath = join(this.tempDir, fileName);

    try {
      const wrappedCode = this.wrapPythonCode(code, testCases);
      writeFileSync(filePath, wrappedCode);

      const result = await this.runCommand('python3', [filePath]);
      const runtime = Date.now() - startTime;

      if (result.success) {
        const output = result.output.trim();
        const lines = output.split('\n');
        
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines.slice(1).join('\n'));
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total,
            testDetails: testResults.tests
          };
        }

        return {
          success: true,
          output: result.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: result.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(filePath);
    }
  }

  /**
   * Execute Java code
   */
  private async executeJava(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    // Try to detect the public class name; default to Solution
    const match = code.match(/public\s+class\s+(\w+)/);
    const detectedClass = match?.[1] || 'Solution';
    const fileName = `${detectedClass}.java`;
    const filePath = join(this.tempDir, fileName);

    try {
      writeFileSync(filePath, code);

      // If test cases provided, create a reflection-based runner
      let runnerClass = '';
      let runnerPath = '';
      if (testCases && testCases.length > 0) {
        const escapeJava = (s: string) => s.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"").replace(/\n/g, "\\n");
        const pairs = testCases
          .map(tc => `{"${escapeJava(String(tc.input))}","${escapeJava(String(tc.expectedOutput))}"}`)
          .join(',\n      ');
        runnerClass = `
import java.lang.reflect.*;
public class MainRunner {
  public static void main(String[] args) {
    int passed = 0; StringBuilder out = new StringBuilder();
    String[][] tests = new String[][]{
      ${pairs}
    };
    try {
      Class<?> cls = Class.forName("${detectedClass}");
      Method m = cls.getMethod("solution", String.class);
      for (int i = 0; i < tests.length; i++) {
        String input = tests[i][0];
        String expected = tests[i][1];
        Object res = m.invoke(null, input);
        String actual = String.valueOf(res);
        boolean ok = actual.equals(expected);
        if (ok) passed++;
        out.append("Test ").append(i+1).append(": ").append(ok ? "PASS" : "FAIL").append("\\n");
      }
      System.out.println("TEST_RESULTS");
      System.out.println("{\\"passed\\":"+passed+",\\"total\\":"+tests.length+",\\"output\\":\\""+out.toString().replace("\\\\", "\\\\\\").replace("\\\"", "\\\\\\\"").replace("\n", "\\n")+"\\"}");
    } catch (Throwable t) {
      System.out.println("TEST_RESULTS");
      String msg = t.toString().replace("\\\\", "\\\\\\").replace("\\\"", "\\\\\\\"").replace("\n", "\\n");
      System.out.println("{\\"passed\\":0,\\"total\\":0,\\"output\\":\\""+msg+"\\"}");
    }
  }
}
`;
        runnerPath = join(this.tempDir, 'MainRunner.java');
        writeFileSync(runnerPath, runnerClass);
      }

      // Compile (user file + runner if present)
      const compileArgs = runnerPath ? [filePath, runnerPath] : [filePath];
      const compileResult = await this.runCommand('javac', compileArgs);
      if (!compileResult.success) {
        return { success: false, error: compileResult.error, runtime: Date.now() - startTime };
      }

      // Run runner if present, else run user's main class
      const runClass = runnerPath ? 'MainRunner' : detectedClass;
      const runResult = await this.runCommand('java', ['-cp', this.tempDir, runClass]);
      const runtime = Date.now() - startTime;

      if (runResult.success) {
        const output = runResult.output.trim();
        const lines = output.split('\n');
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines.slice(1).join('\n'));
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total
          };
        }
        return { success: true, output: runResult.output, runtime };
      }
      return { success: false, error: runResult.error, runtime };
    } finally {
      // Best-effort cleanup: .java and potential .class
      this.cleanupFile(filePath);
      this.cleanupFile(join(this.tempDir, `${detectedClass}.class`));
      this.cleanupFile(join(this.tempDir, 'MainRunner.java'));
      this.cleanupFile(join(this.tempDir, 'MainRunner.class'));
    }
  }

  /**
   * Execute C++ code
   */
  private async executeCpp(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}`;
    const cppFile = `${fileName}.cpp`;
    const exeFile = fileName;
    const cppPath = join(this.tempDir, cppFile);
    const exePath = join(this.tempDir, exeFile);

    try {
      const wrappedCode = this.wrapCppCode(code, testCases);
      writeFileSync(cppPath, wrappedCode);

      // Compile C++ code
      const compileResult = await this.runCommand('g++', ['-o', exePath, cppPath]);
      if (!compileResult.success) {
        return {
          success: false,
          error: compileResult.error,
          runtime: Date.now() - startTime
        };
      }

      // Run C++ code
      const runResult = await this.runCommand(exePath, []);
      const runtime = Date.now() - startTime;

      if (runResult.success) {
        const output = runResult.output.trim();
        const lines = output.split('\n');
        
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines[1]);
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total
          };
        }

        return {
          success: true,
          output: runResult.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: runResult.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(cppPath);
      this.cleanupFile(exePath);
    }
  }

  /**
   * Execute C# code
   */
  private async executeCSharp(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}`;
    const csFile = `${fileName}.cs`;
    const exeFile = `${fileName}.exe`;
    const csPath = join(this.tempDir, csFile);
    const exePath = join(this.tempDir, exeFile);

    try {
      const wrappedCode = this.wrapCSharpCode(code, testCases);
      writeFileSync(csPath, wrappedCode);

      // Compile C# code
      const compileResult = await this.runCommand('csc', ['-out', exePath, csPath]);
      if (!compileResult.success) {
        return {
          success: false,
          error: compileResult.error,
          runtime: Date.now() - startTime
        };
      }

      // Run C# code
      const runResult = await this.runCommand(exePath, []);
      const runtime = Date.now() - startTime;

      if (runResult.success) {
        const output = runResult.output.trim();
        const lines = output.split('\n');
        
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines[1]);
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total
          };
        }

        return {
          success: true,
          output: runResult.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: runResult.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(csPath);
      this.cleanupFile(exePath);
    }
  }

  /**
   * Execute Go code
   */
  private async executeGo(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}.go`;
    const filePath = join(this.tempDir, fileName);

    try {
      const wrappedCode = this.wrapGoCode(code, testCases);
      writeFileSync(filePath, wrappedCode);

      const result = await this.runCommand('go', ['run', filePath]);
      const runtime = Date.now() - startTime;

      if (result.success) {
        const output = result.output.trim();
        const lines = output.split('\n');
        
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines[1]);
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total
          };
        }

        return {
          success: true,
          output: result.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: result.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(filePath);
    }
  }

  /**
   * Execute Rust code
   */
  private async executeRust(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `temp_${Date.now()}`;
    const rsFile = `${fileName}.rs`;
    const rsPath = join(this.tempDir, rsFile);

    try {
      const wrappedCode = this.wrapRustCode(code, testCases);
      writeFileSync(rsPath, wrappedCode);

      const result = await this.runCommand('rustc', ['-o', fileName, rsPath]);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          runtime: Date.now() - startTime
        };
      }

      const runResult = await this.runCommand(`./${fileName}`, []);
      const runtime = Date.now() - startTime;

      if (runResult.success) {
        const output = runResult.output.trim();
        const lines = output.split('\n');
        
        if (lines[0] === 'TEST_RESULTS') {
          const testResults = JSON.parse(lines[1]);
          return {
            success: true,
            output: testResults.output,
            runtime,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total
          };
        }

        return {
          success: true,
          output: runResult.output,
          runtime
        };
      } else {
        return {
          success: false,
          error: runResult.error,
          runtime
        };
      }
    } finally {
      this.cleanupFile(rsPath);
      this.cleanupFile(join(this.tempDir, fileName));
    }
  }

  /**
   * Run a command and return the result
   */
  private async runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        cwd: this.tempDir,
        timeout: 10000 // 10 second timeout
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error
        });
      });

      process.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message
        });
      });
    });
  }

  /**
   * Clean up temporary files
   */
  private cleanupFile(filePath: string) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to cleanup file:', filePath, error);
    }
  }

  /**
   * Wrap JavaScript code with test execution
   */
  private wrapJavaScriptCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

// Test execution
const testCases = ${JSON.stringify(testCases)};
let passed = 0;
let output = '';
let tests = [];

try {
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = solution(testCase.input);
    const expected = String(testCase.expectedOutput);
    const actual = String(result);
    const ok = actual === expected;
    if (ok) passed++;
    output += \`Test \${i + 1}: \${ok ? 'PASS' : 'FAIL'}\\n\`;
    tests.push({ index: i + 1, input: String(testCase.input), expected, actual, passed: ok });
  }
  
  console.log('TEST_RESULTS');
  console.log(JSON.stringify({ passed, total: testCases.length, output, tests }));
} catch (error) {
  console.error('Test execution error:', error.message);
  console.log('TEST_RESULTS');
  console.log(JSON.stringify({ passed: 0, total: testCases.length, output: String(error.message), tests: [] }));
}
`;
  }

  /**
   * Wrap Python code with test execution
   */
  private wrapPythonCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

# Test execution
import json
test_cases = ${JSON.stringify(testCases)}
passed = 0
output = ''

try:
    for i, test_case in enumerate(test_cases):
        result = solution(test_case['input'])
        if str(result) == str(test_case['expectedOutput']):
            passed += 1
        output += f"Test {i + 1}: {'PASS' if str(result) == str(test_case['expectedOutput']) else 'FAIL'}\\n"
    
    print('TEST_RESULTS')
    print(json.dumps({'passed': passed, 'total': len(test_cases), 'output': output}))
except Exception as e:
    print('Test execution error:', str(e))
    print('TEST_RESULTS')
    print(json.dumps({'passed': 0, 'total': len(test_cases), 'output': str(e)}))
`;
  }

  /**
   * Wrap Java code with test execution
   */
  private wrapJavaCode(code: string, className: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

public class ${className} {
    public static void main(String[] args) {
        String testCasesJson = ${JSON.stringify(JSON.stringify(testCases))};
        // Test execution logic would go here
        System.out.println("Test execution not implemented for Java yet");
    }
}
`;
  }

  /**
   * Wrap C++ code with test execution
   */
  private wrapCppCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

// Test execution would go here
int main() {
    std::cout << "Test execution not implemented for C++ yet" << std::endl;
    return 0;
}
`;
  }

  /**
   * Wrap C# code with test execution
   */
  private wrapCSharpCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

// Test execution would go here
static void Main() {
    Console.WriteLine("Test execution not implemented for C# yet");
}
`;
  }

  /**
   * Wrap Go code with test execution
   */
  private wrapGoCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

// Test execution would go here
func main() {
    fmt.Println("Test execution not implemented for Go yet")
}
`;
  }

  /**
   * Wrap Rust code with test execution
   */
  private wrapRustCode(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): string {
    if (!testCases || testCases.length === 0) {
      return code;
    }

    return `
${code}

// Test execution would go here
fn main() {
    println!("Test execution not implemented for Rust yet");
}
`;
  }
}
