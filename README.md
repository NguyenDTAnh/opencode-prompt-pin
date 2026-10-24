# opencode-prompt-pin

Pin the latest user prompt to the top of the OpenCode composer, and click it to open the same action menu you get when clicking a user message.

## Why this exists

An agent turn can run for minutes. You start a task, switch to another window, answer a message, come back — and the screen is full of tool calls, diffs, and streamed reasoning. The conversation header is long gone, so the first thing you have to do is scroll up to remember what you actually asked for.

This plugin keeps that one line in view. The last prompt you sent stays pinned above the input, so when you return to the terminal you can tell at a glance which problem the agent has been answering, without scrolling back through the transcript.

```
┃  Refactor the auth middleware please
┃────────────────────────────────────────────
┃
┃  <your prompt input>            Build auto · ...
```

## What it does

- Shows the newest real user message (prompts still queued or being steered are skipped) as one muted, truncated line above the input.
- Reuses the composer's own border character and colour so the two boxes read as one frame.
- Click opens a four-item menu matching the built-in "Message Actions" dialog:
  - **Jump to** — scroll to the pinned message
  - **Revert** — stage a revert of that message and its file changes
  - **Copy** — copy the prompt text (OSC52)
  - **Fork** — create a new session before that message

## Install

Add the plugin to the `plugins` array in `~/.config/opencode/cli.json`:

```json
{
  "plugins": ["NguyenDTAnh/opencode-prompt-pin"]
}
```

Or pin a local checkout:

```json
{
  "plugins": ["/absolute/path/to/opencode-prompt-pin"]
}
```

The package exposes `./tui`, so OpenCode loads it as a CLI plugin. No restart is needed; `cli.json` is watched.

## Requirements

- OpenCode V2 with CLI plugin support
- A terminal that honours OSC52 for the Copy action

## Layout notes

The plugin renders into the `session.composer.top` slot. Because that slot sits outside the composer's own border box, it draws its own left border with the same `customBorderChars` the composer uses (`vertical: "┃"`, everything else empty) plus a `─` bottom edge, which is what makes the two frames join without a gap.

Hover styling is deliberately not used: changing styles on `onMouseOver` makes OpenTUI re-run hit testing every frame, which flickers the truncated text.

## Test

```sh
bun run test.mjs
```

## License

MIT
