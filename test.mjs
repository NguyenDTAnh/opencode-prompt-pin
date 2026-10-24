import { committedUser } from "./tui.tsx"

const ctx = (messages, pending = []) => ({
  data: { session: { message: { list: () => messages }, pending: { list: () => pending } } },
})
const user = (id, text) => ({ id, type: "user", text })

const cases = [
  ["bỏ qua assistant và user rỗng", [user("a", "một"), { id: "b", type: "assistant" }, user("c", "  "), user("d", "hai")], [], "d"],
  ["bỏ qua prompt còn trong hàng đợi", [user("a", "một"), user("z", "chờ gửi")], [{ id: "z", type: "user" }], "a"],
  ["chỉ có prompt trong hàng đợi", [user("z", "chờ gửi")], [{ id: "z", type: "user" }], undefined],
  ["không có user", [{ id: "a", type: "assistant" }], [], undefined],
  ["danh sách rỗng", [], [], undefined],
  ["client trả undefined", undefined, [], undefined],
]

let failed = 0
for (const [name, messages, pending, expected] of cases) {
  const actual = committedUser(ctx(messages, pending), "s")?.id
  const pass = actual === expected
  if (!pass) failed++
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${pass ? "" : ` got=${actual} want=${expected}`}`)
}
process.exitCode = failed ? 1 : 0
