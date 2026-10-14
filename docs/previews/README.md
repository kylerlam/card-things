# Rendered previews

These screenshots show the real application routes rendered from a production build. They use an isolated, non-sensitive preview database containing one public LocalSend card and a dedicated preview administrator. No private planning file, real account, session, password, or upload is included.

Desktop captures use a 1440 × 1000 viewport. Mobile captures use a 412 × 915 viewport. Chrome and Playwright exercised catalogue search, card navigation, administrator login, the authenticated account avatar, and protected route access without console or page errors.

| Surface | Route | Preview |
| --- | --- | --- |
| Public catalogue | `/` | [Desktop](catalogue-desktop.png) · [Mobile](catalogue-mobile.png) |
| Card detail | `/tools/localsend` | [Desktop](card-detail-desktop.png) · [Mobile](card-detail-mobile.png) |
| Account login and registration | `/auth` | [Desktop](auth-desktop.png) |
| Authenticated account | `/user` | [Desktop](user-account-desktop.png) |
| Administrator login | `/admin/login` | [Desktop](admin-login-desktop.png) |
| Administrator overview | `/admin` | [Desktop](admin-overview-desktop.png) |
| User management | `/admin/users` | [Desktop](admin-users-desktop.png) |
| Card management | `/admin/tools` | [Desktop](admin-cards-desktop.png) |
| New card form | `/admin/tools/new` | [Desktop](admin-card-form-desktop.png) |
| Edit card form | `/admin/tools/:id` | [Desktop](admin-card-edit-desktop.png) |
| Category management | `/admin/categories` | [Desktop](admin-categories-desktop.png) |
| Tag management | `/admin/tags` | [Desktop](admin-tags-desktop.png) |
| Administrator profile | `/admin/profile` | [Desktop](admin-profile-desktop.png) |
