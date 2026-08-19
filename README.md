# Pyramid

A task management system built from the provided Figma design — a task list and kanban board,
task detail with subtasks and comments, projects, settings, guest login, and a theme system
that survives a refresh.

**Live demo:** _add URL after deploying_

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, `class-validator` |
| Database | PostgreSQL via Prisma |

The Figma file is put together from the shadcn/ui kit — its layers are named `Blocks/Login-01`
and `Blocks/Sidebar-02`. That is why shadcn was chosen: the design's colour and spacing
variables map straight onto shadcn's own token names, so the build follows the source instead of
being copied by eye.

## Layout

```
apps/
  web/    Next.js frontend
  api/    NestJS backend + Prisma schema
docs/
  design-spec.md   Everything read off the Figma file: frames, tokens, per-screen breakdown
```

## Running locally

Needs Node 20+ and a PostgreSQL database.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run prisma:migrate --workspace apps/api
npm run dev
```

Point `DATABASE_URL` at your database first. If you don't have Postgres running:

```bash
docker run --name pyramid-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pyramid -p 5432:5432 -d postgres:16
```

The web app runs on `http://localhost:3000`, the API on `http://localhost:4000/api`.

There is no seed script. Pressing **Continue as Guest** creates a fresh workspace and fills it
with the sample projects, tasks, labels and comments from the design, so every guest gets their
own copy and two people trying the demo never see each other's data.

## Beyond the design

The Figma shows what the screens look like, not how they behave. These are the behaviours added
to make it work like a real tool.

### The app guesses what you meant

**Add Task remembers where you clicked.** Press `+` on the *Doing* column and the new-task form
opens with the status already set to Doing. Do it inside a project and the project is filled in
too. Press **Add Task** in the top-right corner instead and you get a blank form, because that
button isn't attached to any column — you choose everything yourself.

**Creating a task returns you where you started.** Start from a project's board and you land back
on that project after saving. Start from All Tasks and you land back on All Tasks.

**Tagging a task with a project files it there.** Give an existing task a project and it shows up
on that project's board straight away. Remove it and it disappears again. The project board is
just the same board filtered by project, so the two always agree.

### Drag and drop

**Move a card anywhere.** Drag a task to another column to change its status, or drop it between
two cards to change its order. A gap opens where the card will land so you can see the result
before you let go.

**Reorder the columns themselves.** Grab a column by its header and slide it left or right. The
other columns move out of the way. Your order is remembered.

**Slide the board sideways** three ways: drag any empty space, scroll with the mouse wheel, or
drag a column near the edge and the board scrolls to follow you.

**Nothing is lost if the network fails.** Every move updates the screen instantly and saves in
the background. If the save fails, the card returns to where it was and a message explains why.
The same applies to deleting, editing subtasks and changing members.

### Motion

The movement is simulated rather than a fixed animation. A small spring engine
(`apps/web/src/lib/spring.ts`) works out each frame from the real forces, so a column that has
further to travel takes longer, and everything settles smoothly instead of snapping. Menus,
drawers and collapsing sections were tuned to match.

### Things I added that the design only hints at

- **Subtasks** can be added while creating a task, with their own priority, members and due date.
  On an existing task you can add, edit and delete them inline.
- **Members** can be added or removed on a task at any time, not only while creating it. Cards
  show every member as stacked avatars, not just the first one.
- **Edit and Delete** live in the `…` menu on every row — task cards, list rows, subtasks and
  projects.
- **Choose your columns.** The Fields menu turns Priority, Members, Due Date, Labels, Status and
  Reporter on and off, and remembers a separate choice for list view and board view.
- **Filter and search** by status, priority, members, labels, reporter or due date. `⌘F` opens
  search.
- **Two themes at once.** Light/Dark and six accent colours are independent, so any accent works
  in either theme. Both are stored and applied before the first paint, so there is no flash of
  the wrong theme when the page loads.

## Tests

```bash
npm test --workspace apps/api
```

Twelve unit tests, aimed at the places where a mistake would be silent rather than obvious: how
task queries are built and filtered, that dropping a card with no position puts it at the end of
the column, and that the session guard accepts a cookie or a bearer token and rejects everything
else.

## Deployment

Built to run with the web app on Vercel and the API on Render, against a hosted Postgres.

**API (Render)** — `render.yaml` describes the service, so pointing Render at this repo picks up
the build and start commands. Migrations run on boot via `prisma migrate deploy`. Two variables
are set by hand:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | connection string of the hosted Postgres |
| `CORS_ORIGINS` | the deployed web origin, e.g. `https://pyramid.vercel.app` |

**Web (Vercel)** — import the repo with the project root left at the repository root;
`vercel.json` handles the workspace build. One variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | the deployed API origin plus `/api` |

The API sets an httpOnly session cookie, but the two apps sit on different hosts and browsers
increasingly refuse third-party cookies, so the token is also sent as a bearer header. The API
accepts either, and the demo keeps working when the cookie is blocked.

Render's free tier sleeps an idle service, so the first request after a quiet spell takes around
thirty seconds while it wakes up.

## Deviations from the design

Each of these is a place where the Figma didn't give an answer, or contradicted itself.

**Dark theme was never drawn.** Every frame in the file is light. Dark values come from the
shadcn Neutral dark scale — the same system the rest of the design is built on.

**A Backlog column was added.** The board frames show four columns and no Backlog, but the task
detail frame shows a task whose status *is* Backlog. Following the file literally meant any task
set to Backlog vanished from the app completely — and the top-right Add Task button defaults new
tasks to exactly that status. The board now has five columns so nothing can disappear.

**Assets could not be exported.** Exporting is switched off in the file, so icon names were read
from the layer tree instead. Almost everything is Lucide, the set the shadcn kit uses. The one
exception is the Tasks icon in the sidebar, which is a Hugeicon — it is redrawn by hand as a
small SVG rather than pulling in a second icon library for one 16px glyph. Avatars are
placeholders.

**Responsive behaviour is not drawn.** Every frame is a single 1280×900 desktop size, so the
breakpoints are an interpretation:

- **Large screens** — as drawn: sidebar pinned at 256px, tables in full.
- **Below 1024px** — the sidebar becomes a slide-out panel. 1024 rather than the usual 768
  because the design pairs a 256px sidebar with a 1024px content column, and keeping it pinned on
  a tablet clips the toolbar.
- **Below 768px** — table rows become stacked cards. Five columns in 375px would mean horizontal
  scrolling inside every table, which is worse than stacking. The board keeps its columns and
  scrolls sideways, which is the normal kanban gesture.

**Google sign-in is disabled.** The button is drawn and built, but wiring up an OAuth provider is
outside what the brief asks for, so it is visibly inert rather than pretending to work.

Smaller calls: the default accent is Black, because although the Color menu ticks *Blue*, every
screen in the file renders the neutral near-black primary. The Fields menu lists "Members" twice
in the design, which reads as a slip, so the duplicate is dropped. Teams appears in the filter
menu but has no table behind it yet, so it lists nothing.
