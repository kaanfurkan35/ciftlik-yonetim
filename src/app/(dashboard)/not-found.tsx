import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <FileQuestion className="size-12 text-muted-foreground" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sayfa Bulunamad&#305;</h1>
            <p className="text-muted-foreground">
              Arad&#305;&#287;&#305;n&#305;z sayfa mevcut de&#287;il veya ta&#351;&#305;nm&#305;&#351; olabilir.
            </p>
          </div>
          <Button render={<Link href="/" />}>Ana Sayfaya D&#246;n</Button>
        </CardContent>
      </Card>
    </div>
  )
}
