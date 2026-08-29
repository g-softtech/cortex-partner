# Phase 13: Resources

## Overview
Phase 13 introduces the Partner Resources center. It provides partners with access to static resources such as the Partner Guide, Sales Kit, and White-label Guidelines. Since these are standard informational assets, this phase is built entirely using frontend React Server Components inside the existing authenticated `(dashboard)` layout.

## Key Features
1. **Resources Hub**: 
   - `/resources` landing page with cards linking to specific resource categories.
2. **Partner Guide**:
   - `/resources/partner-guide` providing an overview of the program, kickoff workflow, and support channels.
3. **Sales Kit**:
   - `/resources/sales-kit` offering pitch decks, case studies, and email templates for partner sales teams.
4. **White-label Guidelines**:
   - `/resources/white-label` outlining brand protection policies, allowed actions, and restrictions when white-labeling Cortex products.

## Security Controls
- **Authentication**: All resources are placed under the `(dashboard)` Next.js route group.
- **Middleware Enforced**: Access to these pages is protected by the global Next.js middleware, which intercepts unauthenticated requests and redirects them to `/login`. It also ensures only users with `UserRole.PARTNER` can access the partner dashboard route group.
- **No Schema Changes**: Phase 13 requires no new database tables or fields, strictly adhering to the frozen schema policy.

## Verification
Phase 13 components passed standard lint and build tests. No dynamic APIs were added, thus preserving existing security boundaries perfectly. The `test-phase13-security.ts` script verified that the middleware boundaries remain intact.
