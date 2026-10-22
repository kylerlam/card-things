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
