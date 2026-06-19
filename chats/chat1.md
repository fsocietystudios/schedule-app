# AI Shift Schedule Generator wireframes

_Started 2026-06-18 15:50 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Untitled"
The project currently has no files except possibly dotfiles — a `list_files` on the project root would return nothing else.
Current date is now June 18, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty, you must ASK the user what visual aesthetic they want. Use the questions_v2 tool to ask about preferred vibe, audience, colors, type, mood, etc. Do NOT just pick your own visual aesthetic without getting the user's aesthetic input -- this is how you get slop!

Once answered, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic_system_instructions>

<pasted_text name="Pasted text (20 lines)">

App Name: ShiftMind
Build an AI-driven workforce management mobile (android + iOS) platform called ShiftMind. No chat or messaging feature of any kind exists in this mobile app.
Authentication &amp; Onboarding
Users create a personal account. After signing in, they choose to join an existing workplace via invite code or create a new one. The workplace owner has full admin control.
Roles &amp; Hierarchy
Three role levels: Owner, Manager, and Employee. The owner can add unlimited managers and employees. The owner assigns each employee to a specific manager. Managers only see and manage their assigned employees.
Task Management
Managers create, assign, edit, and close tasks for their employees. Tasks have a title, description, priority, due date, and status (open / in progress / done). AI suggests task prioritization and flags overdue or blocked tasks. Employees can update task status and add progress notes.
Shift Management
Managers build and publish shift schedules. Employees can request absences with a reason, and request shift swaps with another employee. AI evaluates coverage impact before approving absence requests, validates swap eligibility, and suggests alternatives. AI auto-detects scheduling conflicts and coverage gaps.
AI Shift Schedule Generator
On the schedule page there is a prominent "Generate Next Month's Schedule" button available to managers and owners. When clicked, the AI generates a full shift schedule for all assigned employees for the upcoming month, based on each employee's role and availability, minimum required coverage per shift, existing approved absences, and fair distribution of shifts.
The generated schedule opens in a Draft/Preview mode, invisible to employees. The manager can view the full schedule in a calendar or table layout, edit any individual shift, manually swap two employees within the draft, or regenerate a specific day or the whole month. A "Publish Schedule" button makes it live and triggers push notifications to all affected employees. A "Discard Draft" option cancels without saving. Draft shifts appear in a distinct color or with a "Draft" badge. AI flags conflicts such as understaffed days or double-assigned employees.
Mock Shift Demo Mode
There is a dedicated "Mock Shift Demo" button on the schedule page, available to owners and managers. When clicked, it opens a demo setup screen where the user can choose any number of mock employees (with auto-generated names and roles) to populate a simulated shift schedule. The mock schedule behaves exactly like a real generated schedule — it can be previewed in calendar or table view, edited, shifts can be swapped, individual days can be regenerated, and AI conflict flags are shown. The mock data is completely separate from real workplace data and does not affect or notify any real employees. A clear "Exit Demo" button discards all mock data and returns to the real schedule view.
AI Layer
AI works silently in the background. It recommends task assignments based on workload and role, approves or flags absence and swap requests based on schedule logic, and alerts managers to understaffed shifts or overloaded employees. AI decisions appear as suggestions or status labels only.
Push Notifications
Users are notified for: new task assigned, task status changed, shift published or updated, absence or swap request approved or denied, and role changes.
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design Components">
This project uses Design Components: every design is a single streaming `Name.dc.html` file. The full authoring spec is in your system prompt under "Writing code — Design Components" — follow it. Author and edit `.dc.html` content with the `dc_write`, `dc_html_str_replace`, `dc_js_str_replace`, and `dc_set_props` tools (not `write_file`; `str_replace_edit` works but won't stream); template edits stream into the live preview as you type.
</attached-skill>

<attached-skill name="Wireframe">
Help the user explore design ideas quickly. Interview them, then generate multiple rough wireframes to map out the design space before committing to a direction. Prioritize breadth over polish: show 3-5 distinctly different approaches for each idea. Use simple shapes, placeholder text, and minimal color to keep the focus on structure and flow. Use a sketchy vibe -- handwritten but readable fonts; b&w with some color; low-fi and simple. Provide simple tweaks; show options side-by-side if small or using a tab control if large.
</attached-skill>

<attached-skill name="Frontend design">
Use this guidance when designing frontend/UI work that is NOT governed by an existing brand or design system. Create distinctive HTML with exceptional attention to aesthetic details and creative choices.

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

### Aesthetics Guidelines

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive, characterful choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, grain overlays.

Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on the same choices across generations.

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate animations and effects. Minimalist designs need restraint, precision, and careful attention to spacing and subtle details.
</attached-skill>

<attached-skill name="Interactive prototype">
Create a fully interactive prototype with realistic state management and transitions. Use React useState/useEffect for dynamic behavior. Include hover states, click interactions, form validation, animated transitions, and multi-step navigation flows. It should feel like a real working app, not a static mockup.
</attached-skill>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

This is a meaty spec. Before I build, let me lock down scope and direction with a few focused questions.

_[tool: questions_v2]_

## User

Questions answered:
- fidelity: Low-fi wireframes — explore structure & flow, sketchy b&w
- scope: The AI Shift Schedule Generator (draft/preview/publish flow)
- role: Owner (full admin)
- platform: iOS
- aesthetic: Dark mode / data-dense — power-user feel
- variations: No — one strong direction

## Assistant

Got it — low-fi wireframe storyboard, Owner view, iOS, focused on the AI Shift Schedule Generator (generate → draft → edit → publish). Building one cohesive flow.

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: show_html]_

_[tool: show_html]_

Looks right. Let me verify the table (nested grid) renders correctly.

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: eval_js]_

Table grid renders correctly (48 cells = header + 5×8 rows). Everything's working.

_[tool: update_todos]_

_[tool: set_project_title]_

_[tool: ready_for_verification]_

Built a low-fi wireframe storyboard for the **AI Shift Schedule Generator** — Owner view, iOS, laid out as a scrollable 9-frame flow in three phases:

1. **Generate** — schedule home (Generate + Mock Demo buttons, Owner-only) → AI generating state showing the constraints it applies silently
2. **Review & edit draft** — draft calendar (DRAFT badge, conflict flags) → draft table → edit-shift sheet → swap-two-employees
3. **Resolve & publish** — AI conflict list with one-tap fixes → publish confirmation → published + push preview

Sketchy hand-drawn style, b&w with meaningful color: amber = draft, red = AI conflict flag, blue = designer notes. Two tweaks in the panel: toggle the **designer notes** and the **AI suggestions** on/off.

Note: you'd picked "dark mode / data-dense" — that was the hi-fi aesthetic question, so I kept these light for low-fi readability. When you're ready to commit to a direction, I can do a dark, polished, interactive hi-fi pass on the chosen screens.

## User

design the rest of the app

## Assistant

On it. The rest of the app spans onboarding, team/roles, tasks, shift requests/approvals, mock demo, and notifications. I'll build them as companion wireframe storyboards in the exact same style — grouped into three files so each stays editable.

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: update_todos]_

Let me spot-check each new file renders correctly.

_[tool: show_html]_

Renders well. Both other files use the same proven structure. Handing off to verification.

_[tool: ready_for_verification]_

_[tool: update_todos]_

Done. The rest of ShiftMind is now wireframed across three companion storyboards, all in the same low-fi style with the annotations / AI-suggestions tweaks:

- **Onboarding & Team** — welcome → create account → join/create workplace → invite code → create workplace; then Owner team list, add member (with manager assignment), member detail, and the scoped Manager view.
- **Task Management** — manager task list (grouped by status, AI flags), create task, task detail with progress-note log, AI prioritization; then employee task list, status update, done state.
- **Requests, Demo & Notifications** — employee schedule with absence/swap requests (AI coverage preview), manager approvals inbox + approval detail with AI coverage analysis, Mock Shift Demo setup + demo schedule with Exit Demo, and the notification center covering all push triggers.

That covers every area of the spec except the generator (already built). No chat/messaging anywhere, per the brief.

Two things worth a next pass when you're ready: a dark, polished hi-fi version of the priority screens, and the **Me/profile + settings** surface (notification preferences, sign out) — I left it out since it wasn't in the spec, but say the word and I'll add it.

## User

every manager and above will be able to add to their employees only (not every manager manages every employee - only owner manages them all) some discharges from shifts (even future ones) - like when they are off work / in another mission outside the workplace / called in sick / can't do night shifts AT ALL because of medical issues and more.

also, make the app in Hebrew, and we in Israel view calender Sun-Sat (and not M-S)

## Assistant

Good, important clarifications. Two structural changes (Hebrew + RTL, Sun–Sat week) plus a new feature — **manager-set availability constraints/exemptions** (sick, off, external mission, permanent "no night shifts" medical blocks, including future-dated), scoped so each manager only manages their own employees and only the owner manages everyone.

This touches all four files. I'll rework them to Hebrew RTL with a Sun–Sat calendar, swap to Hebrew-capable fonts (Amatic SC for the sketch display, Rubik for UI), and add the exemptions flow to the Team file.

_[tool: update_todos]_

_[tool: dc_write]_

## Assistant

