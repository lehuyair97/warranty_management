<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Design System & Color Rules (STRICT MANDATORY)

1. **NO HARDCODED HEX CODES IN TSX/TS FILES**:
   - Arbitrary hex colors such as `#[0-9a-fA-F]{3,8}`, `border-[#...]`, `bg-[#...]`, `text-[#...]`, `color="#..."`, or inline `style={{ color: "#..." }}` are **STRICTLY PROHIBITED** in all `.tsx` and `.ts` files.
   - All colors must be:
     a. Defined centrally in `@/common/constants` (`src/common/constants/colors.ts`).
     b. Mapped to Tailwind CSS theme tokens configured in `src/app/globals.css` (e.g. `bg-sand-50`, `border-sand-200`, `text-bronze-600`, `bg-bronze-600`, `hover:bg-sand-100`).
2. **VERIFICATION**:
   - Run `pnpm run lint:colors` before completing any frontend task to ensure 0 violations.
