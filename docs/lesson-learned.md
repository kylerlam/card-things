# Lessons learned

Record confirmed, meaningful corrections that can prevent repeated mistakes. Keep entries concise and omit raw chat transcripts and sensitive personal information. Consult relevant entries during planning and before repeating affected work; promote durable, confirmed project decisions into `AGENTS.md`.

## Entry template

- **Context:** What work was being discussed?
- **Mistaken assumption:** What unsupported assumption caused the problem?
- **Confirmed decision:** What did the user confirm?
- **Prevention:** What should future work do differently?

## Separate framework requirements from deployment context

- **Context:** Writing reusable project guidance and defining framework scope.
- **Mistaken assumption:** One deployment's platform and operational context belonged in reusable requirements; framework reuse also implied a broader commercial platform.
- **Confirmed decision:** Keep reusable guidance platform-neutral and separate deployment-specific content and configuration. Prioritize confirmed practical requirements without mandating a collection subject, business model, or coordinator identity.
- **Prevention:** Check whether each proposed rule is a durable project requirement or deployment context. Keep only confirmed reusable decisions in project guidance, and require an explicit scope decision before expanding into a general or commercial platform.

## Commit completed work before review handoff

- **Context:** Reviewing completed authentication changes and adding catalogue cards while remote publication still required owner approval.
- **Mistaken assumption:** Waiting for permission to push also meant postponing local commits.
- **Confirmed decision:** Create a local commit for each completed, coherent change; wait for the owner's request or approval before pushing.
- **Prevention:** Separate local commits from remote publication, stage only the intended files, and record public deployment content separately from runtime databases, secrets, and reusable framework code.

## Keep account guidance focused on user actions

- **Context:** Refining the shared login and registration page from annotated screenshots.
- **Mistaken assumption:** Server, cookie, and role implementation details were useful registration guidance.
- **Confirmed decision:** Remove the technical side panel and redundant login navigation on the login page; keep actionable field guidance such as password length and username uniqueness beside the inputs.
- **Prevention:** Explain what users can do and how to complete the form, and do not advertise account capabilities that have not been implemented.

## Read current annotations before each iteration

- **Context:** Iterating from screenshots and annotations in the current annotation folder.
- **Mistaken assumption:** A request to continue iterating meant the agent should choose additional fixes independently.
- **Confirmed decision:** Re-read the folder for each iteration and use the current annotations to define the work. The owner accepted the earlier mobile administrator layout fix, but that acceptance does not expand future scope.
- **Prevention:** Map each change to a current annotation. List incidental findings separately and wait for an explicit scope decision before implementing them.

## Keep shared card behavior separate from deployment content

- **Context:** Separating personal site content while simplifying development and stable releases.
- **Mistaken assumption:** Keeping site data on dev and removing it for main would be a maintainable long-term workflow.
- **Confirmed decision:** Current framework trees and future code commits contain only the reusable, empty-by-default application. dev is the experimental feature base; main shares that history and aligns with tested dev at release. Real site content and artwork stay in deployment storage and private backups; legacy commits retain previously published deployment files.
- **Prevention:** Keep shared display rules in code and actual card records and images outside Git. Squash focused features into dev, fast-forward approved releases to main, and identify stable commits with tags instead of repeatedly rewriting release history.

## Preserve established history when extracting the framework

- **Context:** Restoring the full development history after reviewing a seven-phase reconstruction.
- **Mistaken assumption:** Extracting the generic framework required replacing established commits with reconstructed milestones.
- **Confirmed decision:** Preserve the original 36 development commits and their IDs, then add the generic framework extraction as a new commit. The seven-phase rewrite is abandoned.
- **Prevention:** Back up history before branch changes, append reviewed changes, and distinguish cleaning the current tree from removing files from historical commits.
