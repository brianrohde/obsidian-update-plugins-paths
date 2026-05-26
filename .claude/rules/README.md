# .claude/rules — Project Rules & Patterns

This directory contains learned rules and patterns specific to the **Obsidian Update Plugins Paths** plugin project.

## Rule Categories

### ESLint & Code Quality

- **[OBSIDIAN_PLUGIN_ESLINT_VIOLATIONS.md](OBSIDIAN_PLUGIN_ESLINT_VIOLATIONS.md)** `OPE-001`
  - ESLint rules specific to Obsidian plugins
  - Common violations: inline styles, console statements, UI text case, unused imports
  - How to fix each violation
  - Severity: **HIGH**

### UI & Modal Design

- **[OBSIDIAN_MODAL_STRUCTURE.md](OBSIDIAN_MODAL_STRUCTURE.md)** `OMS-001`
  - How to properly structure Obsidian modals
  - Never use inline styles — always use CSS classes
  - Use CSS variables for theme-aware colors
  - Modal rendering patterns and best practices
  - Severity: **HIGH**

## How to Use These Rules

### Before Writing Code
1. Skim the relevant rule files
2. Review examples of ✅ Good code vs ❌ Bad code
3. Keep patterns in mind as you code

### During Code Review
1. Check lint output: `npm run lint`
2. Compare against rule violations
3. Fix systematically using provided patterns

### Debugging Issues
If you encounter an error:
1. Search this directory for the error/concept
2. Read the rule's "Prevention" section
3. Apply the recommended pattern

## Rule Template

Each rule file includes:

```markdown
# RULE_NAME

## Rule ID
`ID-001` — Human-readable title

## Severity
**HIGH** — Brief impact description

## Description
What this rule is about and why it matters

## Common Violations & Fixes
Specific examples with ❌ Bad and ✅ Good code

## Prevention Rules
Specific actions to follow in this project

## Testing
How to verify compliance

## Related Files
Files that depend on this rule

## When to Apply
When should developers reference this rule
```

## Project-Specific Rules

This project builds an **Obsidian Community Plugin**, so it must follow:

1. **ESLint rules** from `eslint-plugin-obsidianmd` (OPE-001)
2. **Modal/UI patterns** from Obsidian design system (OMS-001)
3. **TypeScript strict mode** (tsconfig.json: `strict: true`)
4. **No external dependencies** (only Obsidian API)

## Priority Rules

Apply these rules in order of priority:

| Priority | Rule | Impact |
|----------|------|--------|
| 1 | OPE-001: ESLint Violations | Build fails without this |
| 2 | OMS-001: Modal Structure | Plugin won't look/feel right |
| 3 | TS Strict Mode | Type safety and correctness |

## Linking Rules in CLAUDE.md

When documenting patterns in CLAUDE.md, reference these rules:

```markdown
# Modal Development

See [[OBSIDIAN_MODAL_STRUCTURE]] for styling patterns and CSS variable usage.
```

## Contributing to Rules

When you discover a new pattern or anti-pattern:

1. Create a new rule file with the template above
2. Document the problem with before/after examples
3. List specific files affected
4. Add an entry to this README
5. Commit with message: `docs(rules): add RULE_NAME for X`

## Severity Levels

| Level | Behavior | Example |
|-------|----------|---------|
| **CRITICAL** | Stops build/breaks plugin | ESLint violation (OPE-001) |
| **HIGH** | Causes user-facing issues | Modal styling (OMS-001) |
| **MEDIUM** | Reduces code quality | Unused imports, unclear logic |
| **LOW** | Style/consistency only | Naming conventions, comments |

---

**Last Updated:** 2026-05-26  
**Source:** Session MVP development — ESLint and modal structure violations during initial plugin build
