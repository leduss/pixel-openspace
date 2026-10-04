import type { CSSProperties } from 'react'

/** Where an agent stands right now. */
export type AgentStatus =
  /** Running at this very moment: it sits at its desk, screen on, typing. */
  | 'working'
  /** Up to date: it wanders off to the coffee machine between runs. */
  | 'ok'
  /** Missed its last run: it dozes at its desk. */
  | 'late'
  /** Its last run failed: its PC smokes and the lead comes to see it. */
  | 'failed'
  /** Not loaded at all: empty chair, a post-it on a dark screen. */
  | 'off'
  /** Never ran yet. */
  | 'never'
  /** Runs only when asked. */
  | 'on-demand'

/** One of your scheduled jobs, workers or AI agents, as the open space shows it. */
export type Agent = {
  /** Stable identifier: it also picks the agent's hair and hoodie colours. */
  id: string
  name: string
  emoji?: string
  /** One line about what it does; it says it when clicked. */
  role?: string
  status: AgentStatus
  /** What it said last time, shown on its card and in its speech bubble when it finishes. */
  lastMessage?: string | null
  /** ISO date of its last run. */
  lastRun?: string | null
  /** ISO date of its next run: its screen counts down the last ten minutes. */
  nextRun?: string | null
  /** Its rhythm, in words: "every 30 min", "daily at 7:30". */
  schedule?: string
  /** Hours without a run after which its plant wilts and dust covers its screen. Default 72. */
  staleAfterHours?: number
  /** Today's runs, oldest first: one dot each on the day timeline under the room. */
  runs?: Array<AgentRun>
}

/** One run of an agent, for the day timeline. */
export type AgentRun = {
  /** ISO date of the run. */
  at: string
  /** False for a failed run: a red dot. Default true. */
  ok?: boolean
  /** Shown when hovering the dot. */
  message?: string
}

/** A tile of the big wall screen. */
export type WallTile = {
  label: string
  value: string | number
  tone?: 'neutral' | 'ok' | 'info' | 'warn' | 'alert'
  /** A gauge under the value, from 0 to 1. */
  progress?: number
}

export type Sky = 'clear' | 'clouds' | 'fog' | 'rain' | 'snow' | 'storm'

/** The weather behind the lead's window. */
export type Weather = {
  temperature: number
  sky: Sky
  /** False at night: moon and stars instead of the sun. */
  day: boolean
  /** Written under the window. */
  place?: string
}

/** The props in the room that can be clicked. */
export type SceneObject = 'workbench' | 'tv' | 'server-rack' | 'vending-machine' | 'fridge' | 'cpu-box' | 'gpu-box' | 'ram-box'

export type Language = 'en' | 'fr'

/** The look of the room: a geek open space today, a corporate office around 1986, or a gym where every job rides an exercise bike. */
export type ThemeName = 'geek' | 'eighties' | 'gym' | 'modern' | 'kitchen'

/** How many desks per row. */
export type Columns = 4 | 5 | 6

export type OpenSpaceProps = {
  /** Up to five per row; rows are added as needed. */
  agents: Array<Agent>
  /**
   * The lead, in the glass office: it does its rounds while working, sits
   * with a failed agent until it recovers, and reports in front of the wall
   * screen. A decorative lead sits there when none is given.
   */
  lead?: Agent
  /** The neon sign on the main room wall. */
  title?: string
  /** Up to four tiles on the big wall screen. Without it, the screen counts your agents: total, running, failed, late. Pass `[]` to leave it dark. */
  wall?: Array<WallTile>
  /** What the lead announces in front of the wall screen after its rounds. */
  announcements?: Array<string>
  weather?: Weather | null
  /** A counter: each time it goes up, a visitor walks in to greet the lead. */
  visitors?: number
  /** A counter: each time it goes up, a courier drops a parcel by the boxes. */
  deliveries?: number
  /** Confetti over the whole room: a birthday, a launch, a record month. */
  celebrate?: boolean
  /** The day timeline under the room, when agents have `runs`. Default true. */
  timeline?: boolean
  language?: Language
  /** The look of the room: furniture, outfits, break corners. Default 'geek'. */
  theme?: ThemeName
  /** How many desks per row: 4, 5 or 6. Default 5. */
  columns?: Columns
  /** Halloween all October, Christmas all December, Easter for the two weeks before Easter Monday. Default true. */
  seasonal?: boolean
  /** From what hour to what hour everybody stays at their desk. Default [22, 6]. */
  nightHours?: [number, number]
  /** The fullscreen button and the settings gear above the scene. Default true. */
  toolbar?: boolean
  /** Where each prop leads when clicked; a prop without a link is not clickable. */
  objectLinks?: Partial<Record<SceneObject, string>>
  /** Called instead of following the link, for client-side routers. */
  onObjectClick?: (object: SceneObject, href: string) => void
  /** Shows a "Run now" button on each agent's card. */
  onRun?: (agent: Agent) => void | Promise<void>
  /** The current time, for server rendering: avoids a hydration mismatch on clocks and countdowns. */
  now?: number
  className?: string
  style?: CSSProperties
}
