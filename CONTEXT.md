# starter-react

A starter template repository for producing publishable React npm libraries. Teams clone it to bootstrap a new library so they don't reconfigure build, test, lint, and release infrastructure from scratch.

## Language

**Starter Template**:
The thing this repository IS — a cloneable scaffolding for React npm libraries. Propagates via git (`degit`/`git clone`), not via `npm install`.
_Avoid_: library, package, framework, boilerplate

**Consumer Library**:
A concrete React library that a downstream team produces BY cloning the Starter Template and replacing the example `src/`. This is the thing that ultimately gets published to npm and installed by end users.
_Avoid_: starter, template, app

**End User**:
The developer/project that `npm install`s a Consumer Library as a dependency.
_Avoid_: consumer, customer

**Playground**:
An app that lives inside the Starter Template and exercises the example library source from the **End User's perspective**, validating what the install-and-import experience will feel like once the Consumer Library is published.
_Avoid_: demo, example, sandbox, storybook (different tool)

**Pre-compiled CSS**:
The styling model for the Consumer Library: Tailwind is compiled to a static `dist/style.css` at build time and shipped via `package.json#exports`. End Users import it directly with no Tailwind toolchain of their own.
_Avoid_: runtime CSS-in-JS, consumer-side Tailwind, styled source
