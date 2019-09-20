# expangine-runtime-live

A runtime implementation for processing expressions live.

```typescript
const cmd = LiveRuntime.getCommand(expression);
const result = cmd({
  value: 2,
  list: ['a', 'b', 'c']
});
```