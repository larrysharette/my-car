import { sendDueReminders } from "~/lib/push/send-reminders"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const result = await sendDueReminders()
    return Response.json(result)
  } catch (error) {
    console.error("Cron reminders failed:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 }
    )
  }
}
