# 🚀 Bun + React Expense Tracker POC

> A full-stack proof of concept demonstrating core **Bun** concepts with a modern React frontend.

[![Bun](https://img.shields.io/badge/Bun-v1.0+-purple?style=flat-square)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square)](https://www.typescriptlang.org)

---

## 📖 Table of Contents

- [⚡ Quick Start](#-quick-start)
- [🚀 Why Bun?](#-why-bun)
- [📚 Bun Concepts](#-bun-concepts)
- [✨ Features](#-features)
- [🔄 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [📝 Scripts](#-scripts)

---

## ⚡ Quick Start

### Prerequisites

- **Bun** v1.0+ ([Install here](https://bun.sh))

### Setup

```bash
# Clone and navigate
cd /home/anjali/Desktop/Projects/bun-practical

# Install with Bun (faster than npm)
bun install

# Run with hot reload
bun run dev

# Open http://localhost:3000
```

---

## 🚀 Why Bun?

This POC demonstrates why **Bun** is revolutionary for JavaScript development:

| Feature                 | Benefit                             |
| ----------------------- | ----------------------------------- |
| **⚡ 3x Faster**        | Built on Zig for performance        |
| **📦 Zero Config**      | Native TypeScript, JSX, CSS support |
| **🔥 Hot Reload**       | `bun --hot` for instant feedback    |
| **🎯 No Build Step**    | Run `.ts` files directly            |
| **🧪 Built-in Testing** | `bun test` without Jest             |
| **📁 File APIs**        | `Bun.file()` for efficient I/O      |
| **🗄️ SQLite**           | Native embedded database            |
| **🌍 Web Standards**    | ES modules, Fetch API, Web APIs     |

---

## 📚 Bun Concepts

### 1. **Bun.serve() - HTTP Server**

**Location**: `src/index.ts`

Run a production-grade HTTP server **without Express**:

```typescript
serve({
  fetch(request) {
    // Handle routing here
    if (request.pathname === "/api/expenses") {
      return Response.json(expenses);
    }
  },
  error(error) {
    // Error handling
    return Response.json({ error: error.message }, { status: 500 });
  },
});
```

**No external dependencies needed** - just Bun's native API.

### 2. **Native TypeScript Execution**

- Run `.ts` files directly: `bun src/index.ts`
- No compilation step with `tsc`
- Full type safety throughout
- React JSX works natively

**Files**: All `src/**/*.ts` and `src/**/*.tsx` run without build tools.

### 3. **Hot Module Reloading**

```bash
bun --hot src/index.ts
```

Perfect development experience:

- Save file → instant reload
- No manual restart
- Server stays running
- Middleware state preserved

### 4. **Built-in Testing**

**Location**: `src/tests/`

Run tests without Jest configuration:

```bash
bun test                              # Run all
bun test --watch                     # Watch mode
bun test --coverage                  # Coverage report
bun test src/tests/mongoService.test.ts  # Specific file
```

Test file example:

```typescript
import { describe, it, expect } from "bun:test";

describe("Expenses", () => {
  it("should add expense", () => {
    expect(amount).toBeGreaterThan(0);
  });
});
```

### 5. **File Operations with Bun.file()**

**Location**: `src/services/fileService.ts`

Efficient file handling:

```typescript
// Read file
const file = Bun.file("path/to/file");
const text = await file.text();

// Write file
const writer = Bun.file("output.txt").writer();
writer.write("content");
await writer.flush();
```

Used for:

- Transaction logging
- CSV/JSON exports
- Database backups

### 6. **SQLite Integration**

**Location**: `src/services/authService.ts`

Built into Bun - no external database server:

```typescript
const db = Bun.sqlite("auth.db");
db.run("CREATE TABLE users (id INTEGER, name TEXT)");
```

Benefits:

- Embedded database (single file)
- No setup needed
- Perfect for small-to-medium data
- Fast and reliable

### 7. **Package Manager**

Bun replaces npm:

```bash
bun install       # Like npm install (3x faster)
bun add package   # Like npm install package
bun remove pkg    # Like npm uninstall
```

Lock file: `bun.lock` - faster than `package-lock.json`

### 8. **Environment & Process**

Access system features:

```typescript
process.env.NODE_ENV; // Environment variables
Bun.env; // Bun-specific env
process.argv; // CLI arguments
Bun.sleep(ms); // Sleep for ms
Bun.spawn(command); // Run subprocess
```

---

## ✨ Features

### Bun-Powered Features

- ⚡ Hot reload during development
- 🔥 Zero configuration needed
- 🎯 Full TypeScript support
- 📦 Single runtime (no Node.js)
- 🧪 Tests included

### Application Features

- 💰 **Expense Tracking** - Create, read, update, delete
- 📊 **Analytics Dashboard** - Charts and statistics
- 🏷️ **Categories** - Organize expenses
- 🔍 **Search & Filter** - Find expenses easily
- 📱 **Responsive UI** - Mobile, tablet, desktop
- 🔐 **Authentication** - Login/register
- 📤 **Data Export** - CSV & JSON

---

## 🔄 API Endpoints

### Authentication

```http
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/verify
```

### Expenses

```http
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

### Data

```http
GET    /api/expenses/by-category
GET    /api/stats
GET    /api/export/csv
GET    /api/export/json
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage

# Specific file
bun test src/tests/authService.test.ts
```

### Test Coverage

Tests demonstrate:

- ✅ CRUD operations with mocks
- ✅ Validation logic
- ✅ Error handling
- ✅ Data aggregation
- ✅ Service layer testing

**No Jest configuration needed** - Bun test works out of the box.

---

## 📚 Technology Stack

| Layer           | Technology            | Why                                     |
| --------------- | --------------------- | --------------------------------------- |
| **Runtime**     | [Bun](https://bun.sh) | ⭐ Fast, zero-config JavaScript runtime |
| **Server**      | Bun.serve()           | No Express needed                       |
| **Frontend**    | React 19              | UI library                              |
| **Language**    | TypeScript            | Type safety                             |
| **Styling**     | Tailwind CSS 4        | Utility CSS                             |
| **Charts**      | Recharts              | Data visualization                      |
| **Auth DB**     | SQLite                | Built-in Bun support                    |
| **Expenses DB** | MongoDB               | Document storage                        |
| **Router**      | React Router 7        | Client routing                          |
| **Testing**     | Bun Test              | Built-in test runner                    |

---

## 📝 Scripts

```bash
# Development
bun run dev              # Start with hot reload (port 3000)
bun run build            # Build production bundle
bun run start            # Run production build

# Testing
bun test                 # Run all tests
bun test --watch         # Watch mode
bun test --coverage      # Coverage report

# Utilities
bun install              # Install dependencies
bun add package-name     # Add dependency
bun remove package-name  # Remove dependency
bun upgrade              # Update Bun
```

---

## 🔑 Key Takeaways

This POC demonstrates:

✅ **Bun is production-ready** - Real HTTP server, databases, tests
✅ **Zero configuration** - TypeScript, JSX, CSS all work natively
✅ **Performance matters** - 3x faster than Node.js
✅ **Modern tooling** - All-in-one runtime with built-in utilities
✅ **Web standards** - Uses standard APIs (Fetch, Web Crypto, etc.)
✅ **Perfect for learning** - Clear code, well-tested, documented

---

## 📞 Next Steps

1. **Run the app**: `bun run dev`
2. **Run tests**: `bun test --watch`
3. **Explore code**: Check `src/` files with comments
4. **Modify & experiment**: Change code and see hot reload
5. **Learn more**: Visit [bun.sh](https://bun.sh)

---

## 📄 License

MIT License - Free to use and modify

---

**Happy Learning!** 🎉

Built with ❤️ using **Bun** - A modern JavaScript runtime.
