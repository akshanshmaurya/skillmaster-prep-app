"use client";

import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CodeEditorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onRunCode: (code: string, language: string) => void;
  initialCode?: string;
  isRunning?: boolean;
  executionResult?: {
    success: boolean;
    output?: string;
    error?: string;
    runtime?: number;
    memory?: number;
    testCasesPassed?: number;
    totalTestCases?: number;
  };
}

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }
];

const defaultCode = {
  javascript: `// Write your solution here
function solution() {
    // Your code goes here
    return;
}`,
  python: `# Write your solution here
def solution():
    # Your code goes here
    pass`,
  java: `// Write your solution here
public class Solution {
    public static void main(String[] args) {
        // Your code goes here
    }
}`,
  cpp: `// Write your solution here
#include <iostream>
using namespace std;

int main() {
    // Your code goes here
    return 0;
}`,
  csharp: `// Write your solution here
using System;

class Solution {
    static void Main() {
        // Your code goes here
    }
}`,
  go: `// Write your solution here
package main

import "fmt"

func main() {
    // Your code goes here
}`,
  rust: `// Write your solution here
fn main() {
    // Your code goes here
}`
};

export default function CodeEditor({
  language,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  initialCode,
  isRunning = false,
  executionResult
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || defaultCode[language as keyof typeof defaultCode] || '');
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange(newCode);
  };

  const handleRun = () => {
    onRunCode(code, language);
  };

  const handleReset = () => {
    const defaultCodeForLanguage = defaultCode[language as keyof typeof defaultCode] || '';
    setCode(defaultCodeForLanguage);
    onCodeChange(defaultCodeForLanguage);
  };

  const handleLanguageChange = (newLanguage: string) => {
    onLanguageChange(newLanguage);
    const defaultCodeForLanguage = defaultCode[newLanguage as keyof typeof defaultCode] || '';
    setCode(defaultCodeForLanguage);
    onCodeChange(defaultCodeForLanguage);
  };

  const getLanguageIcon = (lang: string) => {
    const icons: { [key: string]: string } = {
      javascript: '🟨',
      python: '🐍',
      java: '☕',
      cpp: '⚡',
      csharp: '🔷',
      go: '🐹',
      rust: '🦀'
    };
    return icons[lang] || '📝';
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{getLanguageIcon(option.value)}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <Card className="overflow-hidden">
        <Editor
          height="320px"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            cursorBlinking: 'blink',
            cursorStyle: 'line',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }}
        />
      </Card>

      {/* Execution Result */}
      {executionResult && (
        <Card className="p-4 max-h-64 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Execution Result</h4>
            <Badge 
              variant={executionResult.success ? "default" : "destructive"}
              className="text-xs"
            >
              {executionResult.success ? 'Success' : 'Error'}
            </Badge>
          </div>
          
          {executionResult.success ? (
            <div className="space-y-2">
              {executionResult.output && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Output:</p>
                  <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
                    {executionResult.output}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-4 text-xs text-muted-foreground">
                {executionResult.runtime && (
                  <span>Runtime: {executionResult.runtime}ms</span>
                )}
                {executionResult.memory && (
                  <span>Memory: {executionResult.memory}MB</span>
                )}
                {executionResult.testCasesPassed !== undefined && (
                  <span>
                    Test Cases: {executionResult.testCasesPassed}/{executionResult.totalTestCases}
                  </span>
                )}
              </div>

              {Array.isArray((executionResult as any).testDetails) && (executionResult as any).testDetails.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Per-test results:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-muted-foreground">
                        <tr>
                          <th className="text-left p-1">#</th>
                          <th className="text-left p-1">Input</th>
                          <th className="text-left p-1">Expected</th>
                          <th className="text-left p-1">Actual</th>
                          <th className="text-left p-1">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(executionResult as any).testDetails.map((t: any) => (
                          <tr key={t.index} className="border-t">
                            <td className="p-1">{t.index}</td>
                            <td className="p-1 font-mono">{t.input}</td>
                            <td className="p-1 font-mono">{t.expected}</td>
                            <td className="p-1 font-mono">{t.actual}</td>
                            <td className="p-1">
                              <Badge variant={t.passed ? 'default' : 'destructive'} className="text-[10px]">
                                {t.passed ? 'PASS' : 'FAIL'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Error:</p>
              <pre className="bg-red-50 p-3 rounded text-sm font-mono text-red-800 overflow-x-auto">
                {executionResult.error}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
