# 🧭 Basecamp-Style Project Management Guide

This guide shows you how to use Mnemosyne's documentation system to run your MVP project using calm, async-friendly Basecamp principles.

## 🎯 Your Role as Project Manager

As the PM, you're responsible for:

- Defining clear intent and goals
- Breaking the project into shippable phases
- Writing good pitch and design docs
- Creating space for focus (not task-churn) — [see Focus vs. Churn guide](guides/focus-vs-churn.md)
- Reviewing what's done, not tracking what's not

## 🧱 Key Concepts

| Concept          | What It Means                                            |
| ---------------- | -------------------------------------------------------- |
| **Pitch**        | A shaped idea — what to build, why, and in what appetite |
| **Cycle**        | A block of focused time (1–6 weeks) to build something   |
| **Appetite**     | The time you're willing to spend on a problem            |
| **Hill Chart**   | Visual of progress: figuring it out → building it out    |
| **Done List**    | Finished work, not to-dos                                |
| **No Deadlines** | Use scope to hit time, not time to hit scope             |

## 📁 How to Use This Documentation System

### 1. Start with Intent

Every feature begins with `docs/features/[name]/intent.md`:

```bash
cp docs/template/intent.md docs/features/my-feature/intent.md
```

Fill out:

- **Purpose**: Why this feature exists
- **Goals**: What success looks like
- **Scope**: What's in and what's out

### 2. Design the Solution

Once intent is clear, create `docs/features/[name]/design.md`:

```bash
cp docs/template/design.md docs/features/my-feature/design.md
```

Include:

- **Architecture**: How it fits the system
- **API Design**: Key interfaces
- **Database Changes**: Schema modifications
- **Testing Approach**: How to verify it works

### 3. Pitch for a Cycle

When ready to build, create `docs/features/[name]/pitch.md`:

```bash
cp docs/template/pitch.md docs/features/my-feature/pitch.md
```

Define:

- **Problem**: Specific issue to solve
- **Appetite**: Time/energy you're willing to spend
- **Solution**: What you'll build
- **Scope**: What's in this cycle vs. future

**Real Example:** [Logger API Unification Pitch](features/logger-api-unification/pitch.md) shows complete cycle planning with implementation phases and success metrics.

### 4. Track Progress with Done Lists

Update `docs/README.md` with completed work:

```markdown
## ✅ What We've Shipped This Cycle

- Feature X: Core functionality complete
- Feature Y: Basic UI implemented
- Bug fixes: 3 critical issues resolved
```

## 🪧 Planning Your MVP Phases

### Phase Structure

Break your product into shippable phases:

1. **Phase 1**: Core foundation (usually 4-6 weeks)
2. **Phase 2**: Key user features (3-4 weeks)
3. **Phase 3**: Polish and integration (2-3 weeks)
4. **Phase 4**: Launch preparation (1-2 weeks)

### Document in `docs/architecture/phase-plan.md`

```markdown
# Phase Plan

## Phase 1: Message Import ✅

- CSV file processing
- Content deduplication
- Basic error handling

## Phase 2: Memory Extraction 🔄

- Content analysis
- Memory creation
- Storage optimization

## Phase 3: Query System 📋

- Natural language queries
- Memory retrieval
- Response generation
```

## 🎨 Creating Features

### Step-by-Step Process

1. **Copy Templates**

   ```bash
   cp -R docs/template docs/features/your-feature
   ```

2. **Write Intent** (Why this matters)
   - Define the problem
   - Set success criteria
   - Determine scope boundaries

3. **Create Design** (How it works)
   - Technical architecture
   - Package changes needed
   - API interfaces

4. **Write Pitch** (What to build this cycle)
   - Set appetite (time willing to spend)
   - Define deliverables
   - Plan implementation phases

5. **Build and Ship**
   - Focus on core functionality
   - Test thoroughly
   - Update done list

## 🔄 Weekly Ritual

| Day           | Activity                             |
| ------------- | ------------------------------------ |
| **Monday**    | Review what's shipping this cycle    |
| **Wednesday** | Clarify unknowns and unblock issues  |
| **Friday**    | Update done list and plan next cycle |

## 📊 Hill Chart Tracking

Track feature progress visually:

```
Figuring it out ←→ Building it out ←→ Done
🔴 (Problem unclear)  🟡 (Solution known)  🟢 (Shipped)
```

Add to feature docs:

```markdown
## Progress

Current status: 🟡 Building it out

- [x] Problem definition complete
- [x] Technical approach decided
- [ ] Core implementation
- [ ] Testing and polish
```

## 🛠️ Tools Integration

### With Your Monorepo

- **Turborepo**: Features map to package changes
- **Storybook**: UI features get visual documentation
- **Prisma**: Database changes documented in design docs
- **Vitest**: Testing strategy defined in pitch docs

### With GitHub

- Link pitch docs to issues for traceability
- Use PR descriptions to reference design docs
- Tag completed features in release notes

**See detailed guide**: [GitHub Integration](github-integration.md) - Complete workflow for linking documentation to GitHub features

## ✅ Success Patterns

### Good Cycle Planning

- **Small appetite**: 1-2 weeks for most features
- **Clear scope**: Specific deliverables
- **Known unknowns**: Identify risks upfront
- **Circuit breaker**: When to stop and reassess

### Good Documentation

- **Intent first**: Always start with why
- **Design before build**: Technical approach documented
- **Pitch for focus**: Clear scope and timeline
- **Done list updates**: Celebrate completed work

## 🚨 Common Pitfalls

### Avoid These Mistakes

- **Vague intent**: "Make it better" isn't actionable
- **Scope creep**: Adding features mid-cycle
- **No appetite**: Working without time boundaries
- **Task tracking**: Focusing on todos vs. shipped features

### Circuit Breakers

Stop and reassess when:

- Technical unknowns take more than 2 days
- Scope expands beyond appetite
- Dependencies aren't ready

## 📝 Template Quick Reference

### Starting a New Feature

```bash
# Create feature folder
mkdir docs/features/my-feature

# Copy all templates
cp docs/template/* docs/features/my-feature/

# Edit in order:
# 1. intent.md (why)
# 2. design.md (how)
# 3. pitch.md (what this cycle)
```

**Example Features:**
- See [Logger API Unification](features/logger-api-unification/) for complete feature documentation
- See [Dual Logging System](features/dual-logging/) for architecture-focused feature

### Architecture Documentation

```bash
# System-level docs
docs/architecture/system-overview.md
docs/architecture/data-flow.md
docs/architecture/glossary.md

# Package-specific docs
docs/packages/[package-name]/
```

### Decision Records

```bash
# Create new ADR
cp docs/template/adr.md docs/decisions/NNN-decision-name.md
```

## 🎯 Success Metrics

Your documentation system is working when:

- [ ] Developers understand features without asking questions
- [ ] Features ship within their appetite
- [ ] Scope stays focused during cycles
- [ ] Done lists show steady progress
- [ ] Team works calmly without task churn

---

> "We don't track tasks. We shape work, do it, and mark it done."

## 🔗 Quick Links

### Templates
- [Intent Template](template/intent.md)
- [Design Template](template/design.md)
- [Pitch Template](template/pitch.md)

### Guides
- [Focus vs. Task Churn](guides/focus-vs-churn.md)
- [GitHub Integration Guide](github-integration.md)
- [Architecture Overview](architecture/system-overview.md)

### Features
- [Current Features](features/)
- [Dual Logging System](features/dual-logging/)
- [Logger API Unification](features/logger-api-unification/)

### Project Status
- [Done List](README.md#what-weve-shipped)
