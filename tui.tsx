/** @jsxImportSource @opentui/solid */
// Ghim prompt gần nhất của người dùng ngay trên ô nhập. Click mở menu hành động
// tương đương dialog "Message Actions" của user message.

import { Show, createMemo } from "solid-js"

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim()

// Prompt đang chờ trong hàng đợi (queued/steering) cũng nằm trong message.list,
// nên phải loại theo id để chỉ ghim tin đã thực sự vào mạch hội thoại.
export const committedUser = (context: any, sessionID: string) => {
  const messages = context.data.session.message.list(sessionID)
  if (!Array.isArray(messages)) return undefined
  const pending = context.data.session.pending.list(sessionID)
  const queued = new Set(Array.isArray(pending) ? pending.map((item: any) => item?.id).filter(Boolean) : [])
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.type !== "user" || !message.text?.trim()) continue
    if (queued.has(message.id)) continue
    return message
  }
  return undefined
}

export const openMenu = async (context: any, sessionID: string) => {
  const message = committedUser(context, sessionID)
  if (!message) return
  const picked = await context.ui.dialog.select({
    title: "Prompt đang ghim",
    options: [
      { title: "Jump to", value: "jump", description: "nhảy tới message trong session" },
      { title: "Revert", value: "revert", description: "hoàn tác message và thay đổi file" },
      { title: "Copy", value: "copy", description: "copy nội dung prompt" },
      { title: "Fork", value: "fork", description: "tạo session mới từ message" },
    ],
  })
  if (!picked) return

  if (picked === "jump") {
    context.keymap.dispatch("session.messages_last_user")
    return
  }

  if (picked === "revert") {
    await Promise.resolve(context.client.session.revert.stage({ sessionID, messageID: message.id })).catch((cause: any) =>
      context.ui.toast.show({ message: `Revert: ${cause?.message ?? cause}`, variant: "error" }),
    )
    return
  }

  if (picked === "copy") {
    // OSC52 là đường copy mà plugin nhìn thấy được; bản gốc ghi qua clipboard nội bộ.
    if (context.renderer.copyToClipboardOSC52(message.text))
      context.ui.toast.show({ message: "Đã copy prompt", variant: "success", duration: 2000 })
    else context.ui.toast.show({ message: "Copy: terminal từ chối OSC52", variant: "error" })
    return
  }

  const created = await context.client.session.fork({ sessionID, before: message.id }).catch((cause: any) => {
    context.ui.toast.show({ message: `Fork: ${cause?.message ?? cause}`, variant: "error" })
    return undefined
  })
  if (!created) return
  context.ui.router.navigate({ type: "session", sessionID: created.id })
  context.ui.toast.show({ message: "Đã fork session", variant: "success", duration: 3000 })
}

// Không dùng onMouseOver: đổi style theo hover khiến OpenTUI hit-test lại mỗi frame
// và dòng prompt nhấp nháy liên tục.
// Khung ô chat là box border ["left","right"] với customBorderChars rỗng trừ vertical "┃",
// padding 2. Pin dùng viền trái như ô nhập, thêm đáy mảnh "─" chạy hết chiều ngang
// và nối vào viền trái của ô nhập.
const PIN_BORDER = {
  topLeft: "",
  bottomLeft: "┃",
  vertical: "┃",
  topRight: "",
  bottomRight: "",
  horizontal: "─",
  bottomT: "",
  topT: "",
  cross: "",
  leftT: "",
  rightT: "",
}

function Pin(props: { context: any; sessionID: string }) {
  const message = createMemo(() => committedUser(props.context, props.sessionID))
  const theme = props.context.theme
  // Ô nhập dùng màu viền active là hue.interactive.200 (glowMint trong dusk-aurora).
  const frame = theme.hue.interactive?.[200] ?? theme.border.base

  return (
    <Show when={message()}>
      {(value) => (
        <box
          width="100%"
          flexShrink={0}
          border={["left", "bottom"]}
          customBorderChars={PIN_BORDER}
          borderColor={frame}
          paddingLeft={2}
          paddingRight={2}
          onMouseUp={() => openMenu(props.context, props.sessionID)}
        >
          <text wrapMode="none" truncate fg={theme.text.muted}>
            {oneLine(value().text)}
          </text>
        </box>
      )}
    </Show>
  )
}

export default {
  id: "local.prompt-pin",
  setup(context: any) {
    context.ui.slot({
      append: "session.composer.top",
      // message.list đã là store reactive; giữ memo để không rebuild theo từng token.
      render: (input: { sessionID: string }) => <Pin context={context} sessionID={input.sessionID} />,
    })
  },
}
