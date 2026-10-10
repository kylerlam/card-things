# Design references

The selected direction is a deliberately low-fidelity, monochrome workflow UI. Private planning files are not copied into this repository; this document records only the implementation characteristics required to review the public result.

## Selected direction

- **Target:** public catalogue, tool detail, visitor Demo, and protected administrator workspace
- **Layout:** 1180px maximum content width, thin dark borders, small radii, system type, and generous whitespace
- **Catalogue:** purpose categories on the left; search and multi-select platform filters beside them; three-column cards at wide widths
- **Cards:** compact identity block, purpose and platform metadata, a dedicated detail action, and a separate favourite control
- **Visitor workspace:** independent overview, favourites, private custom tools, and profile views
- **Administrator workspace:** independent user, tool, purpose-category, and tag pages rather than a generic CMS surface
- **Responsive behavior:** side navigation becomes a horizontal scrollable control row and content stacks into one column
- **Motion:** no decorative animation dependency; native focus, hover, and navigation feedback only
- **Status:** Selected and implemented

## Rendered evidence

- [Public catalogue](screenshots/catalogue-desktop.png)
- [Tool detail](screenshots/tool-detail-desktop.png)
- [Safe visitor registration Demo](screenshots/auth-demo-desktop.png)
- [Visitor workspace](screenshots/user-workspace-desktop.png)
- [Visitor workspace on mobile](screenshots/user-workspace-mobile.png)
- [Administrator login](screenshots/admin-login-desktop.png)
