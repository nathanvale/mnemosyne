# Preventing the Underscore Prefix Anti-Pattern

## Problem Statement

The quality check tool was inadvertently encouraging developers to add underscore prefixes to unused variables instead of properly deleting them. This created a code smell where variables like `_autoConfig` were left in the code just to suppress ESLint warnings.

## Root Cause Analysis

### 1. ESLint Limitation

The `@typescript-eslint/no-unused-vars` rule **cannot autofix** unused variable errors. This is a fundamental limitation because:

- Deleting variables requires understanding the entire code context
- The variable might be part of a destructuring pattern where other variables are used
- The variable might be required for function signature compatibility

### 2. Configuration Allows Underscores

Our ESLint configuration explicitly allows underscore prefixes:

```javascript
'@typescript-eslint/no-unused-vars': [
  'error',
  {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
    destructuredArrayIgnorePattern: '^_',
  }
]
```

### 3. Developer Shortcut

When faced with an ESLint error that can't be autofixed, developers took the path of least resistance: adding an underscore prefix to silence the warning.

## Solution Implementation

### Enhanced ESLint Checker

We've enhanced the ESLint checker in the quality check tool to detect and warn about potential misuse of underscore prefixes:

```typescript
// Check for unused variable errors that might be incorrectly "fixed" with underscores
if (result?.messages) {
  const unusedVarErrors = result.messages.filter(
    (msg) => msg.ruleId === '@typescript-eslint/no-unused-vars',
  )

  for (const error of unusedVarErrors) {
    const varName = error.message.match(/'([^']+)'/)?.[1]

    if (varName && !varName.startsWith('_')) {
      // Genuinely unused variable that should be deleted
      warnings.push(
        `Line ${line}: Variable '${varName}' is unused. Consider deleting it instead of adding an underscore prefix.`,
      )
    } else if (varName?.startsWith('_')) {
      // Check if underscore usage is legitimate
      const isDestructuring = /\[.*_.*\]|\{.*_.*\}/.test(codeLine)
      const isCatchBlock = /catch.*\(_/.test(codeLine)
      const isFunctionParam = /function.*\(.*_|=>.*\(.*_/.test(codeLine)

      if (!isDestructuring && !isCatchBlock && !isFunctionParam) {
        warnings.push(
          `Line ${line}: Variable '${varName}' uses underscore prefix but may not be a legitimate case. Consider deletion.`,
        )
      }
    }
  }
}
```

## Guidelines for Proper Underscore Usage

### ✅ Legitimate Uses

1. **Destructuring when only some values are needed:**

   ```typescript
   const [value, _index] = array // Only need value
   const { name, _id } = user // Only need name
   ```

2. **Catch blocks where error isn't used:**

   ```typescript
   try {
     doSomething()
   } catch (_error) {
     // Error details not needed
     console.log('Operation failed')
   }
   ```

3. **Function parameters for signature compatibility:**
   ```typescript
   onChange: (_event: Event, value: string) => {
     // Only need value, but event must be in signature
     updateValue(value)
   }
   ```

### ❌ Anti-Pattern Uses

1. **Variables that should be deleted entirely:**

   ```typescript
   // BAD
   const _autoConfig = await loadAutoConfig()

   // GOOD - Delete the entire line if not needed
   ```

2. **Computed values that are never used:**

   ```typescript
   // BAD
   const _total = items.reduce((sum, item) => sum + item.price, 0)

   // GOOD - Delete the computation if not needed
   ```

3. **Imported but unused:**

   ```typescript
   // BAD
   import { _unusedHelper } from './utils'

   // GOOD - Remove the import entirely
   ```

## Developer Workflow

When you encounter an unused variable ESLint error:

1. **First, ask:** Is this variable truly needed?
   - If NO → Delete the entire variable declaration
   - If YES → Continue to step 2

2. **Is it a legitimate underscore case?**
   - Destructuring where other values are used?
   - Catch block where error details aren't needed?
   - Function parameter needed for signature?
   - If YES → Add underscore prefix
   - If NO → Refactor to actually use the variable or delete it

3. **Run the quality check**
   - The enhanced checker will now warn if underscore usage seems inappropriate
   - Review warnings and fix any anti-pattern uses

## Prevention Strategies

1. **Code Review:** Look for underscore prefixes and question whether they're legitimate
2. **Quality Check Warnings:** The tool now actively warns about suspicious underscore usage
3. **Team Education:** Share these guidelines with the team
4. **Refactoring:** When you see `_variable`, consider if it can be deleted

## Future Improvements

1. **Custom ESLint Rule:** Create a rule that distinguishes between legitimate and anti-pattern underscore usage
2. **AI-Assisted Analysis:** Use AST analysis to determine if a variable can be safely deleted
3. **Interactive Mode:** Prompt developers to choose between deletion and underscore for each unused variable
