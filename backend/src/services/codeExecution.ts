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
   * Execute Java code
   */
  private async executeJava(code: string, testCases?: Array<{ input: string; expectedOutput: string }>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const className = `Solution_${Date.now()}`;
    const fileName = `${className}.java`;
    const filePath = join(this.tempDir, fileName);

    try {
      const wrappedCode = this.wrapJavaCode(code, className, testCases);
      writeFileSync(filePath, wrappedCode);

      // Compile Java code
      const compileResult = await this.runCommand('javac', [filePath]);
      if (!compileResult.success) {
        return {
          success: false,
          error: compileResult.error,
          runtime: Date.now() - startTime
        };
      }

      // Run Java code
      const runResult = await this.runCommand('java', ['-cp', this.tempDir, className]);
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
      this.cleanupFile(filePath);
      this.cleanupFile(join(this.tempDir, `${className}.class`));
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

try {
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = solution(testCase.input);
    if (result === testCase.expectedOutput) {
      passed++;
    }
    output += \`Test \${i + 1}: \${result === testCase.expectedOutput ? 'PASS' : 'FAIL'}\\n\`;
  }
  
  console.log('TEST_RESULTS');
  console.log(JSON.stringify({ passed, total: testCases.length, output }));
} catch (error) {
  console.error('Test execution error:', error.message);
  console.log('TEST_RESULTS');
  console.log(JSON.stringify({ passed: 0, total: testCases.length, output: error.message }));
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
