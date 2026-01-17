EnvBox — Copilot / AI Coding Rules (Strict)
1. Primary Rule (MOST IMPORTANT)

Make the smallest possible change to achieve the requested behavior.

Do NOT refactor unless required

Do NOT touch unrelated files

Do NOT rename variables, files, or folders without necessity

Prefer localized changes over global changes

2. Scope & Feature Control

Implement only what is explicitly requested

Do NOT add “nice-to-have” features

Do NOT add placeholders or TODOs for future work

Do NOT create abstractions “for later use”

3. Typing Rules (MANDATORY)

Use TypeScript everywhere

No any

No implicit any

Prefer explicit interfaces/types for:

API request/response

DB documents

Narrow types instead of broad unions

Do NOT over-generalize types

4. Unused Code Rule (MANDATORY)

Do NOT leave:

Unused variables

Unused functions

Unused imports

Dead code paths

If a helper is used only once, inline it

Delete code that is no longer used

5. File & Folder Rules

Follow Next.js App Router conventions

API logic lives in /app/api

MongoDB connection logic lives in /lib/mongodb

Shared utilities go in /lib

Do NOT create extra layers (services, repositories, adapters)

6. Database Rules

Keep MongoDB schemas flat and explicit

Create indexes only when needed

Encrypt env variable values before persisting

Never expose encrypted values in API responses

7. UI Rules

Prefer simple tables and forms

Mask sensitive values by default

No animations

No custom component libraries unless already present

8. Error Handling

Handle expected errors explicitly

Return clear API error messages

Do NOT swallow errors

No try/catch unless necessary

9. Logging

No console.log

Use existing logger utility if present

If none exists, avoid logging unless debugging is requested

10. Build & Lint Rule (CRITICAL)

After every task:

Ensure the project builds successfully

Fix all TypeScript errors

Fix lint issues caused by the change

Do NOT leave warnings related to unused code

11. Change Explanation

If a change touches more than one file:

Explain why each file was modified

Keep explanations short and factual

12. Stop Condition

Stop immediately when:

Requested change is complete

Code builds and types pass

No unused code exists

Do NOT continue improving or extending beyond the request.