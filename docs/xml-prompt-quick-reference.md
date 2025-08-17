# XML Prompt Engineering Quick Reference

> **Purpose**: Quick reference for XML-structured prompt patterns  
> **Full Guide**: [Enterprise Prompt Engineering Guide](./enterprise-prompt-engineering-guide.md)

## Essential Structure

```xml
<ai_meta>
  <parsing_rules>...</parsing_rules>
</ai_meta>

<constraints>
  <forbidden_tools>...</forbidden_tools>
  <required_tools>...</required_tools>
</constraints>

<process_flow>
  <step number="1" name="name">
    <step_metadata>...</step_metadata>
    <instructions>
      ACTION: ...
      VALIDATE: ...
      BLOCK: ...
    </instructions>
  </step>
</process_flow>
```

## Key Patterns

### 1. Instruction Pattern

```xml
<instructions>
  ACTION: What to do
  VALIDATE: What to check
  BLOCK: When not to proceed
  PROCEED: When to continue
</instructions>
```

### 2. Constraint Pattern

```xml
<constraints>
  <forbidden_tools>
    - Never use X
    - Never do Y
  </forbidden_tools>
  <required_tools>
    - Only use A
    - Must use B
  </required_tools>
  <enforcement>STRICT</enforcement>
</constraints>
```

### 3. Validation Pattern

```xml
<validation_rules>
  - Condition 1 must be true
  - Output must match schema
  - No errors allowed
</validation_rules>

<validation_checklist>
  - [ ] Check A completed
  - [ ] Check B passed
  - [ ] Output verified
</validation_checklist>
```

### 4. Error Handling Pattern

```xml
<error_protocols>
  <error_type>
    <action>What to do</action>
    <report>User message</report>
    <forbidden>Never do X as fallback</forbidden>
  </error_type>
</error_protocols>
```

### 5. Decision Tree Pattern

```xml
<decision_tree>
  <if_condition>
    ACTION: Do this
    NEXT: Go to step X
  </if_condition>
  <else>
    ACTION: Do that
    NEXT: Go to step Y
  </else>
</decision_tree>
```

## Quick Tips

### DO's ✅

- Process XML blocks first
- Use semantic tag names
- Validate at each step
- Be explicit about forbidden behaviors
- Use templates for consistency

### DON'Ts ❌

- Don't allow fallback behaviors
- Don't skip validation
- Don't mix instructions with examples
- Don't use ambiguous language
- Don't forget error handling

## Common Tags

| Tag                 | Purpose        | Example              |
| ------------------- | -------------- | -------------------- |
| `<ai_meta>`         | Parsing rules  | First processed      |
| `<purpose>`         | Define scope   | Clear boundaries     |
| `<constraints>`     | Set limits     | Forbidden/required   |
| `<step>`            | Process step   | Sequential flow      |
| `<instructions>`    | Step actions   | ACTION/VALIDATE      |
| `<validation>`      | Check points   | Required/optional    |
| `<error_protocols>` | Error handling | Recovery steps       |
| `<output_template>` | Format output  | Consistent structure |
| `<final_checklist>` | End validation | Verify compliance    |

## Example: Minimal Agent

```xml
---
name: minimal-agent
description: Simplest working example
---

# Minimal Agent

<ai_meta>
  <parsing_rules>
    - Process XML first
    - Follow instructions exactly
  </parsing_rules>
</ai_meta>

<constraints>
  <forbidden_tools>
    - Any destructive operations
  </forbidden_tools>
  <required_tools>
    - Read operations only
  </required_tools>
</constraints>

<process_flow>
  <step number="1" name="execute">
    <instructions>
      ACTION: Perform the task
      VALIDATE: Check output
      BLOCK: If validation fails
    </instructions>
  </step>
</process_flow>
```

## Testing Checklist

- [ ] Test with valid inputs
- [ ] Test with invalid inputs
- [ ] Test forbidden behaviors are blocked
- [ ] Test required behaviors are enforced
- [ ] Test error handling works
- [ ] Test output consistency

## Resources

- [Anthropic XML Tags Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
- [Claude Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Full Enterprise Guide](./enterprise-prompt-engineering-guide.md)

---

_For complete documentation, see the [Enterprise Prompt Engineering Guide](./enterprise-prompt-engineering-guide.md)_
