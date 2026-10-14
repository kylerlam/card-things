# Design references

The selected direction is an owner-approved visual refresh expressed as explicit design tokens and surface rules. It is not presented as a pixel recreation of an unavailable private reference. Private planning files are not copied into this repository; this document records only the implementation characteristics required to review the public result.

## Selected direction

- **Target:** public catalogue, tool detail, authenticated user account, and protected administrator workspace
- **Palette:** `#F7F8FA` background, `#FFFFFF` cards, `#20242C` primary text, `#667085` secondary text, `#E3E6EC` borders, and `#4F46E5` primary actions
- **Layout:** 1180px maximum content width, comfortable whitespace, thin borders, moderate radii, subtle surface shadows, and system type
- **Catalogue:** purpose categories on the left; text and Tag discovery beside them; three-column cards at wide widths
- **Cards:** compact identity block, purpose and Tag metadata, and a dedicated detail action
- **Visitor workspace:** authenticated account overview and profile security; favourites are deferred
- **Administrator workspace:** independent user, tool, purpose-category, and tag pages rather than a generic CMS surface
- **Responsive behavior:** side navigation becomes a horizontal scrollable control row and content stacks into one column
- **Motion:** no decorative animation dependency; native focus, hover, and navigation feedback only
- **Preservation:** existing palette, sidebars, core information architecture, data behavior, and authorization boundaries remain unchanged
- **Status:** Owner-approved text specification implemented

## Rendered evidence

- [Public catalogue](previews/catalogue-desktop.png)
- [Public catalogue on mobile](previews/catalogue-mobile.png)
- [Card detail](previews/card-detail-desktop.png)
- [Card detail on mobile](previews/card-detail-mobile.png)
- [Authenticated account](previews/user-account-desktop.png)
- [Administrator overview](previews/admin-overview-desktop.png)
- [Complete preview index](previews/README.md)
