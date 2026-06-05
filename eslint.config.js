import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript';

const typeScriptProcessor = {
  meta: {
    name: 'lifehq-typescript-transpile-processor',
    version: '1.0.0',
  },
  preprocess(sourceText, filename) {
    const isTsx = filename.endsWith('.tsx');
    const { outputText } = ts.transpileModule(sourceText, {
      compilerOptions: {
        jsx: isTsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.Preserve,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        isolatedModules: true,
      },
      fileName: filename,
    });

    return [outputText];
  },
  postprocess(messageLists) {
    return messageLists.flat();
  },
  supportsAutofix: false,
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.tsbuildinfo',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'lifehq-typescript': {
        processors: {
          transpile: typeScriptProcessor,
        },
      },
    },
    processor: 'lifehq-typescript/transpile',
  },
];
