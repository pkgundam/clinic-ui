import { redirect } from "next/navigation"

// The chat page sends you to /login if you are not signed in.
export default function Home() {
  redirect("/chat")
}
