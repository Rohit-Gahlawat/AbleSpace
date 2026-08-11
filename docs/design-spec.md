# Pyramid — Design Specification

Source: Figma `Assessment-Task` (file key `obONCFmoTFN27V5H9PHS2X`), page **Page 1**.
Product name shown in the design: **Pyramid**.

The design is assembled from the **shadcn/ui Figma kit** — top-level frames are instances of
`Blocks / Login-01` and `Blocks / Sidebar-02`, and every colour/typography value resolves to a
shadcn token (`base/*`, `text-*`, `font-weight/*`, `shadow/*`). Implementation therefore targets
shadcn/ui + Tailwind so the tokens line up one-to-one.

---

## 1. Canvas inventory (16 top-level frames)

| # | Layer | Screen |
|---|-------|--------|
| 1 | `DropdownMenu / Menu` | Priority filter menu (standalone) |
| 2 | `Blocks / Login-01` | Login |
| 3 | `Blocks / Sidebar-02` | Task detail — Dates / date picker open |
| 4 | `Blocks / Sidebar-02` | Task detail — Priority dropdown open |
| 5 | `Blocks / Sidebar-02` | Tasks — Board (kanban) |
| 6 | `Blocks / Sidebar-02` | Tasks — Board + Fields dropdown |
| 7 | `Blocks / Sidebar-02` | Tasks — List + Fields dropdown |
| 8 | `Blocks / Sidebar-02` | Tasks — List + search active |
| 9 | `Blocks / Sidebar-02` | Settings — Profile |
| 10 | `Blocks / Sidebar-02` | Project detail (`Projects › Design Homepage`) |
| 11 | `DropdownMenu / Menu` | Theme submenu (standalone) |
| 12 | `DropdownMenu / Menu` | Color Mode submenu (standalone) |
| 13 | `Blocks / Sidebar-02` | Projects + user menu → Theme submenu |
| 14 | `Blocks / Sidebar-02` | Projects + user menu → Color Mode submenu |
| 15 | `Blocks / Sidebar-02` | Projects + filter menu (+ Priority submenu) |
| 16 | `Blocks / Sidebar-02` | Tasks — List (default) |

Page **Components** holds a single component: `user card` (the kanban card).

Every frame is drawn in **light theme only**. Dark theme is required by the brief but is not
drawn, so dark values come from the shadcn Neutral dark palette.

---

## 2. Frame geometry

- App frames: **1280 × 900**, `Flow: Horizontal`, fill `base/background` #FFFFFF.
- Login frame: **1280 × 900**, `Flow: Vertical`, padding `spacing/10`, gap `24px`.
- Sidebar child `Sidebar 02.`: **fixed 256px** wide, 900px tall, `border-right: 1px`,
  fill `base/sidebar` **#FAFAFA**.
- Dropdown menus: **fixed 192px** wide (`min-width: w-48`), height hugs content
  (Theme 121px, Color Mode 265px, Priority 229px), fill `base/popover` #FFFFFF,
  1px border, `border-radius/ro…`, shadow.

---

## 3. Tokens (read from the Figma Properties panel)

### Colour — light
| Token | Hex |
|-------|-----|
| `base/background` | #FFFFFF |
| `base/card` | #FFFFFF |
| `base/popover` | #FFFFFF |
| `base/sidebar` | #FAFAFA |
| `base/border` | #E5E5E5 |
| `base/primary` | #171717 |
| `base/primary-foreground` | #FAFAFA |
| `tailwind colors/red/500` | #EF4444 |

These are the shadcn **Neutral** base scale (neutral-50 / neutral-200 / neutral-900).

### Elevation
`shadow/xs` = `0 1px 2px 0 rgba(0,0,0,0.05)` (X 0, Y 1, Blur 2, Spread 0, #000000 @ 5%).

### Typography
Family `font/font-sans`. Sizes/weights observed:

| Role | Token | Value |
|------|-------|-------|
| Page title ("Tasks", "Projects") | `text-base` / `font-weight/semibold` | 16px / 600 / line-height 100% |
| Button label, badges, table text | `text-xs` / `font-weight/medium` | 12px / 500 |
| Letter spacing | — | 0% everywhere |

### Radius / border width
Tokens `border-radius/ro…` and `border-width/bor…` (shadcn `--radius`, default `0.625rem`).

---

## 4. Theme system

Two independent axes, both exposed in the sidebar user menu and in Settings:

1. **Change Theme** → `Light` (default, ticked) · `Dark`
2. **Color Mode** → `Amber` · `Blue` (default, ticked) · `Pink` · `Rose` · `Emerald` · `Black`

Each Color Mode row shows a filled rounded swatch on the left and a check on the right for the
active value. `Black` has no swatch. Menu width 192px; section label ("Theme", "Color Mode") is
muted `text-xs` at the top.

Selection must persist across refreshes.

---

## 5. Screens

### 5.1 Login (`Blocks / Login-01`)
Centred column on white:
- Brand lockup: dark rounded-square mark + wordmark **Pyramid**.
- Card (**384px** wide, 202px tall, hug; `base/card`, 1px `base/border`, `shadow/xs`):
  - Title **"Let's get back on track"** — semibold, centred.
  - Subtitle "Enter your email below to login to your account." — muted, centred.
  - Primary button, full width: **Continue as Guest** (dark fill, white label).
  - Secondary button, full width: **Login with Google** (outline, Google `G` mark).
- Footer, muted, centred: "By clicking continue, you agree to our Terms of Service and
  Privacy Policy." — both phrases underlined links.

### 5.2 App shell (`Blocks / Sidebar-02`)
- **Sidebar (256px, #FAFAFA, 1px right border)**
  - Workspace switcher: avatar + **Dexter** + up/down chevron.
  - Group label **Workspace** with collapse chevron.
  - Nav items: **Tasks** (grid icon), **Projects** (briefcase icon). Active item has a
    subtle filled rounded background.
  - Switcher opens the user menu: avatar, **Dexter**, `Dexter@gmail.com`, then
    **Change Theme ▸**, **Color Mode ▸**, **Settings**.
- **Header**: sidebar-collapse icon button on the left; breadcrumb when nested
  (`Projects › Design Homepage`).
- **Content header**: page title on the left; on the right — search icon, **Fields**
  (columns icon), filter icon, and the primary **+ Add Task** / **+ Add Project** button.

### 5.3 Tasks — List view
Grouped, collapsible sections **To Do**, **Doing**, **Completed**, each rendered as a table:

- Header row: `Task | Priority | Members | Due Date | Actions` (muted, tinted header band).
- Rows: task name, priority badge, member avatars (or initials such as `CN`, or a `+` add
  button), due date (e.g. `12 Sep 2026`), `…` actions button.
- Footer row per section: **+ Add Task**.

Sample rows: Design Homepage / High / 12 Sep 2026 · Develop Login Feature / Low / 15 Sep 2026 ·
Test Payment Gateway / Medium / 18 Sep 2026.

### 5.4 Tasks — Board view
Columns **To Do**, **Doing**, **Completed**, **On Hold**. Column header: drag handle, name,
`+` and `…` buttons. Cards use the `user card` component:
- Task title + `…` button.
- Avatar + author name (`Admin`, `QA Team`, `Designer`, `Security`, …).
- Due-date chip: calendar icon + date in **red on a light red pill** (e.g. `29 Jul`).
- Label chips with tag icon (e.g. `Deployment`, `Testing`, `Passed`, `Audit`, `Scheduled`).
Column footer: **+ Add Task**.

### 5.5 Fields dropdown
Segmented control **List | Board** at the top, then toggle rows with switches:
`Priority`, `Members`, `Due Date`, `Members`, `Labels`, `Status`, `Reporter`.
(In the List frame Priority/Members/Due Date/Members are on; in the Board frame only the two
Members rows are on — the visible column set differs per view.)

### 5.6 Filter menu
Root menu: `Status ▸`, `Priority ▸`, `Members ▸`, `Due Date ▸`, `Teams ▸`, `Labels ▸`,
`Reporter ▸`. The **Priority** submenu lists, with a bar-chart glyph per level and a check on
the active one: `No Priority`, `Urgent` ✓, `High`, `Medium`, `Low`.

Priority colour ramp: Urgent red · High red/orange (`red/500` #EF4444 on the badge inspected) ·
Medium amber · Low muted grey · No Priority muted grey.

### 5.7 Search
Activating search swaps the title area for an input showing the query (`Design Homepage`) with a
`⌘F` hint chip; the list filters down to matching rows and empty groups disappear.

### 5.8 Task detail
- Title **Write API Documentation**; description paragraph beneath.
- Top-right icon row: lock, eye + view count `1`, share, `…`, panel toggle.
- Property rows: **Properties** (assignee chip `Designer`, due chip `31 Jul` in red),
  **Labels** (chips `Research`, `Design`, `Development`, `Testing`, `Deployment`),
  **Resources** (`Add document or link…` placeholder).
- **Subtasks** table: `Task | Priority | Members | Due Date | Actions` with rows
  `Subtask 1/2/3` and an **+ Add Subtasks** footer.
- Comments: thread item (avatar, `Ankit Dutta`, `just now`, body `dsds`, emoji + `…` actions,
  `Leave a reply…` input) and a bottom `Add a comment…` composer with attach and send buttons.
- **Details** side panel (right): header `Details` with `+` and gear icons; rows
  `Status` (`Backlog`, amber dot), `Priority` (`High`), `Members` (`Add members`),
  `Dates` (`Jan 10` → `End`), `Labels`, `Teams`, `Reporter`.
  Opening `Dates` shows a month calendar (`January 2026`, Su–Sa, today ringed).
  Opening `Priority` shows the priority menu.
- **Updates** feed below Details: e.g. "You changed priority from No priority to Urgent",
  "You posted an update · Aug 2026".

### 5.9 Projects
Table with columns `Projects | Priority | Lead | Due Date | Actions`; rows
`Design Homepage` (High), `Develop Login Feature` (Low), `Test Payment Gateway` (Medium);
footer **+ Add Projects**; header button **+ Add Project**.

### 5.10 Project detail
Breadcrumb `Projects › Design Homepage` in the header, then the same grouped task list as 5.3.

### 5.11 Settings
Own shell: sidebar with **← Back to app**, a search input, and nav **Profile**, **Theme**,
**Color** (each with a leading icon; Color shows a solid swatch).

**Profile** page — heading `Profile`, then a card of divided rows:
| Row | Right-hand control |
|-----|--------------------|
| Profile picture | avatar |
| Email | `dexter@gmail.com` + pencil edit button |
| Full name | input, value `Dexter` |
| Title — helper "Your job title or role" | input, value `Designer` |
| Username — helper "One word, like a nickname or first name" | input, value `Dexuser` |

Then section heading **Workspace access** and a card row
"Remove yourself from the workspace" with a destructive **Leave Workspace** button
(red text on a light red fill).

---

## 6. Notes for implementation

- Frames are 1280 wide; the sidebar is a fixed 256px, so the content column is 1024px.
  Responsive behaviour below that width is not drawn — the sidebar collapses to the icon/off
  state via the header toggle, and tables become horizontally scrollable.
- Export is disabled on the Figma file, so no assets could be pulled; icons are Lucide
  (the shadcn default set) and avatars are placeholder images.
- Deviations from the design are listed in the project README.
