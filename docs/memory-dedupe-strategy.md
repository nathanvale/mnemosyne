# 🧠 Memory Deduplication Strategy

This document outlines a lightweight deduplication strategy for the relationship memory engine. While exact duplicate memory entries are rare, deduplication helps maintain a clean and meaningful memory table, especially when processing overlapping message batches or rerunning extraction jobs.

---

## 🎯 Goal

Prevent storing identical memory insights more than once.

This improves:

- Prompt relevance and compression
- Memory DB clarity
- Future context generation accuracy

---

## 🧠 What Counts as a Duplicate?

A memory is considered a **semantic duplicate** if it has:

- The same `type` (`trait`, `event`, or `observation`)
- The same `subject` (`Nathan`, `Melanie`, or `relationship`)
- The exact same `summary` string

These three fields define the **identity** of a memory.

---

## 🧮 Deduplication Method

Generate a `memory_id` using a stable hash of the three identity fields:

```ts
memoryId = hash(`${type}:${subject}:${summary}`)
```

> Use any consistent string hash function (e.g. SHA-1, MurmurHash, or crypto.subtle).

This ID can be used to:

- Detect existing entries before insert
- Support optional memory versioning later

---

## 🧱 How It Works (Example)

### Input Memory

```json
{
  "type": "trait",
  "subject": "Nathan",
  "summary": "Nathan often used poetic metaphors in his messages",
  "date": null,
  "source_message_ids": ["101", "108"],
  "confidence": "high",
  "context_tags": ["language", "affection"]
}
```

### ID Generation

```ts
memoryId = hash(
  'trait:Nathan:Nathan often used poetic metaphors in his messages',
)
```

---

## ✅ Recommended Logic

In your memory generator or storage layer:

```ts
const memoryId = generateMemoryId(memory)
if (!existingMemoryMap.has(memoryId)) {
  save(memory)
} else {
  skipOrUpdate(memory) // Optional merge logic
}
```

You may optionally:

- **Merge `source_message_ids`** if re-evidence appears
- **Increase confidence** if a memory is re-supported
- Or simply **skip** if it’s an exact match

---

## 🧠 Why This Matters (Even if Duplicates Are Rare)

- Prevents issues from accidentally reprocessing the same day or batch
- Avoids GPT summarizing the same pattern with different words multiple times
- Keeps memory prompts clean and efficient

---

## 📌 Summary

- Deduping is optional but smart
- Use `(type + subject + summary)` to define identity
- Hash that identity for safe lookup
- Handle duplicates gracefully by skipping or updating

This gives you a fast, safe, and low-friction way to maintain long-term memory hygiene.
