# Apache Groovy 6.0 — Interactive Developer Portal & Deep-Dive Suite

A zero-build, multi-page static documentation portal and runnable code suite exploring all **7 architectural pillars** and **39 subsections** introduced in [Apache Groovy 6.0](https://groovy-lang.org/releasenotes/groovy-6.0.html), paired with 7 self-contained `.groovy` verification suites and a live Groovy Web Console batch runner.

## Multi-Page Static Website Architecture

Open [`index.html`](index.html) directly in any browser (or serve the root directory via any static HTTP server):

```bash
open index.html
```

### Pages in the Project Root

| Page | Description |
| :--- | :--- |
| [`index.html`](index.html) | **Developer Portal Landing Page** — Interactive Hero Groovy 6.0 Playground (6 presets + live execution), 7 Pillar Bento Grid with deep links to all 39 subsections, Filterable 39-Feature Cheatsheet Matrix, and `⌘K` / `/` instant site-wide search modal. |
| [`01-language-ergonomics.html`](01-language-ergonomics.html) | **Pillar 01: Language Ergonomics & Java 21–25 Parity** (6 runnable sections: `val`, `!instanceof`, Flexible Constructors, `import module`, Array Extensions, Destructuring, and Map/Switch Enhancements) |
| [`02-async-await.html`](02-async-await.html) | **Pillar 02: Native Async/Await, Lazy Generators & Channels** (5 runnable sections: `async`/`await`, `awaitAll`/`awaitAny`, `yield return` generators, `AsyncChannel` + `for await`, and `AsyncScope`) |
| [`03-concurrency-toolkit.html`](03-concurrency-toolkit.html) | **Pillar 03: Integrated Concurrency Toolkit (`groovy.concurrent`)** (5 runnable sections: `DataflowVariable`/`Dataflows`, `Agent<T>`, `@ActiveObject`/`@ActiveMethod`, Parallel Collections, and `BroadcastChannel`/`ChannelSelect`) |
| [`04-contracts-and-checkers.html`](04-contracts-and-checkers.html) | **Pillar 04: Design-by-Contract, Compile-Time Checkers, Monads & Traits** (7 runnable sections: `@Invariant`/`@Requires`/`@Ensures`/`@Modifies`, `@Pure` & `PurityChecker`, Loop/Recursion Variants & `@ThrowsIf`, Flow-Sensitive `NullChecker` & `SafeRegexChecker`, `DO` Monadic Comprehensions, `@Virtual` Trait Statics, and Nested `copyWith`) |
| [`05-gdk-and-ginq.html`](05-gdk-and-ginq.html) | **Pillar 05: GDK Power-Ups, Fat-Free Lambdas, `groovyToString` & GINQ** (9 runnable sections: Collection Power-Ups, `clamp`/`takeIf`/Immutability, Regex `findGroups`/`findBalancedGroups`, Locale Number Formatting, Process & Async NIO, Fat-Free Lambdas & `curryWith`, `groovyToString`, GINQ `groupby ... into`, and GINQ Set Operations) |
| [`06-batteries-included.html`](06-batteries-included.html) | **Pillar 06: Batteries-Included Modules** (4 runnable sections: `groovy-csv`, `groovy-markdown`, `groovy-http-builder`, and Unified Typed Parsing + StAX XML Streaming) |
| [`07-compiler-and-ast.html`](07-compiler-and-ast.html) | **Pillar 07: Compiler Tooling, Fluent `AstQuery`, `@ClassTag` & Diagnostics** (3 runnable sections: Fluent `AstQuery`, `@ClassTag` Type-Token Injection, and `ErrorFormat.SHORT` Diagnostics) |
| [`batch-runner.html`](batch-runner.html) | **Live GWC Batch Verification Suite (46/46)** — Executes all 39 subsection scripts and all 7 standalone `.groovy` files against `https://europe-west1-gwc-experiment.cloudfunctions.net/groovy_6_0`. |

### Shared Web Assets

- [`assets/slides-data.js`](assets/slides-data.js) — Single source of truth (`window.GROOVY6_SITE_DATA`) containing all 7 pillars, 39 subsections, explanatory prose, **Groovy 5 vs Groovy 6** side-by-side comparisons, **Under the Hood** compiler notes, display snippets (`code`), self-contained runnable scripts (`fullCode`), and the 7 standalone `.groovy` suites.
- [`assets/app.js`](assets/app.js) — Shared multi-page documentation controller: persistent Dark/Light theme toggle, `⌘K` / `/` instant `<dialog>` search modal, 3-column scroll-spy Table of Contents, and interactive code playgrounds (`Snippet` / `Full Runnable Script` / `✎ Edit & Tweak`, live `▶ Run` via GWC API, `Copy`, and URL-safe Base64 `Open in GWC ↗` deep links).
- [`assets/styles.css`](assets/styles.css) — Apache Groovy 6.0 portal theme variables (Dark & Light modes), 3-column responsive documentation grid, cross-document `@view-transition`, and Groovy 6 syntax highlighting styles.

## Running the Standalone Groovy 6.0 Scripts Locally

With **Apache Groovy 6.0.0+** installed:

```bash
# Run all 7 standalone scripts and verify every assertion
groovy run_all.groovy

# Or run any individual script directly
groovy 01_language_ergonomics.groovy
groovy 02_async_await.groovy
groovy 03_concurrency_toolkit.groovy
groovy 04_contracts_and_checkers.groovy
groovy 05_gdk_and_ginq.groovy
groovy 06_batteries_included_modules.groovy
groovy 07_tooling_and_compiler.groovy
```
