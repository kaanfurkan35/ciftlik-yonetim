"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("[DashboardError]", error.message, error.digest)
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <AlertTriangle className="size-12 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Bir Hata Olu&#351;tu</h1>
            <p className="text-muted-foreground">
              Beklenmeyen bir hata olu&#351;tu. L&#252;tfen tekrar deneyin.
            </p>
          </div>
          <Button onClick={reset}>Tekrar Dene</Button>
        </CardContent>
      </Card>
    </div>
  )
}
