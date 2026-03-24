"use client"

import { FileDown, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ExportButtons() {
  function handlePdfExport() {
    toast.info("PDF indirme ozelligi yaklasimda eklenecektir.")
  }

  function handleExcelExport() {
    toast.info("Excel indirme ozelligi yaklasimda eklenecektir.")
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePdfExport}>
        <FileDown className="mr-1 size-4" />
        PDF Indir
      </Button>
      <Button variant="outline" onClick={handleExcelExport}>
        <FileSpreadsheet className="mr-1 size-4" />
        Excel Indir
      </Button>
    </div>
  )
}
