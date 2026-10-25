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

- **Context:** Iterating from screenshots and annotations in the owner's `修改方向` folder.
- **Mistaken assumption:** A request to continue iterating meant the agent should choose additional fixes independently.
- **Confirmed decision:** Re-read the folder for each iteration and use the current annotations to define the work. The owner accepted the earlier mobile administrator layout fix, but that acceptance does not expand future scope.
- **Prevention:** Map each change to a current annotation. List incidental findings separately and wait for an explicit scope decision before implementing them.

## Use application artwork for curated icons

- **Context:** Reviewing missing and blurred logos after importing the software catalogue.
- **Mistaken assumption:** A repository avatar or a small website favicon reliably represented the installed application's icon at card size.
- **Confirmed decision:** Prefer clear official application artwork, with a colour variant when available, and preserve the original branding.
- **Prevention:** Save reviewed vectors or high-resolution rasters locally, record their official sources, and serve configured icons before attempting external metadata discovery. Verify actual loaded image dimensions in the browser.
