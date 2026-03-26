"use client"

import { FileDown, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ANIMAL_STATUS_LABELS,
  TRANSACTION_CATEGORY_LABELS,
} from "@/lib/constants"

interface ExportButtonsProps {
  reportData: {
    herd: { total: number; byStatus: Record<string, number>; byBreed: Record<string, number> }
    milk: { totalMilk: number; monthlySummary: Array<{ month: string; label: string; total: number }> }
    finance: {
      totalIncome: number
      totalExpense: number
      profit: number
      incomeByCategory: Array<{ category: string; total: number }>
      expenseByCategory: Array<{ category: string; total: number }>
    }
    health: { totalRecords: number; vaccinationCompliance: number }
  }
}

export function ExportButtons({ reportData }: ExportButtonsProps) {
  async function handlePdfExport() {
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF()

      // NOTE: jsPDF default fonts (helvetica) do not fully support Turkish special
      // characters (ş, ç, ğ, ı, ö, ü). Some characters may not render correctly.
      doc.setFont("helvetica")

      // Title
      doc.setFontSize(18)
      doc.text("Ciftlik Raporu", 14, 22)
      doc.setFontSize(10)
      doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, 30)

      // Herd summary table
      doc.setFontSize(14)
      doc.text("Suru Ozeti", 14, 42)
      autoTable(doc, {
        startY: 48,
        head: [["Durum", "Sayi"]],
        body: Object.entries(reportData.herd.byStatus).map(([status, count]) => [
          ANIMAL_STATUS_LABELS[status] || status,
          String(count),
        ]),
      })

      // Breed distribution table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afterHerdY = ((doc as any).lastAutoTable?.finalY as number) || 80
      doc.setFontSize(14)
      doc.text("Irk Dagilimi", 14, afterHerdY + 12)
      autoTable(doc, {
        startY: afterHerdY + 18,
        head: [["Irk", "Sayi"]],
        body: Object.entries(reportData.herd.byBreed).map(([breed, count]) => [
          breed,
          String(count),
        ]),
      })

      // Milk production table
      const afterBreedY = ((doc as any).lastAutoTable?.finalY as number) || 130
      doc.setFontSize(14)
      doc.text("Sut Uretimi", 14, afterBreedY + 12)
      autoTable(doc, {
        startY: afterBreedY + 18,
        head: [["Ay", "Toplam (Lt)"]],
        body: reportData.milk.monthlySummary.map((m) => [
          m.label,
          String(m.total),
        ]),
      })

      // Finance summary
      const afterMilkY = ((doc as any).lastAutoTable?.finalY as number) || 180
      if (afterMilkY > 240) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text("Finansal Ozet", 14, 22)
        autoTable(doc, {
          startY: 28,
          head: [["Kalem", "Tutar"]],
          body: [
            ["Toplam Gelir", `${reportData.finance.totalIncome.toLocaleString("tr-TR")} TL`],
            ["Toplam Gider", `${reportData.finance.totalExpense.toLocaleString("tr-TR")} TL`],
            ["Kar / Zarar", `${reportData.finance.profit.toLocaleString("tr-TR")} TL`],
          ],
        })
      } else {
        doc.setFontSize(14)
        doc.text("Finansal Ozet", 14, afterMilkY + 12)
        autoTable(doc, {
          startY: afterMilkY + 18,
          head: [["Kalem", "Tutar"]],
          body: [
            ["Toplam Gelir", `${reportData.finance.totalIncome.toLocaleString("tr-TR")} TL`],
            ["Toplam Gider", `${reportData.finance.totalExpense.toLocaleString("tr-TR")} TL`],
            ["Kar / Zarar", `${reportData.finance.profit.toLocaleString("tr-TR")} TL`],
          ],
        })
      }

      // Income by category
      const afterFinanceY = ((doc as any).lastAutoTable?.finalY as number) || 220
      if (reportData.finance.incomeByCategory.length > 0) {
        if (afterFinanceY > 240) doc.addPage()
        const startY = afterFinanceY > 240 ? 22 : afterFinanceY + 12
        doc.setFontSize(14)
        doc.text("Gelir Dagilimi", 14, startY)
        autoTable(doc, {
          startY: startY + 6,
          head: [["Kategori", "Tutar"]],
          body: reportData.finance.incomeByCategory.map((item) => [
            TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
            `${item.total.toLocaleString("tr-TR")} TL`,
          ]),
        })
      }

      // Expense by category
      const afterIncomeY = ((doc as any).lastAutoTable?.finalY as number) || 250
      if (reportData.finance.expenseByCategory.length > 0) {
        if (afterIncomeY > 240) doc.addPage()
        const startY = afterIncomeY > 240 ? 22 : afterIncomeY + 12
        doc.setFontSize(14)
        doc.text("Gider Dagilimi", 14, startY)
        autoTable(doc, {
          startY: startY + 6,
          head: [["Kategori", "Tutar"]],
          body: reportData.finance.expenseByCategory.map((item) => [
            TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
            `${item.total.toLocaleString("tr-TR")} TL`,
          ]),
        })
      }

      doc.save("ciftlik-raporu.pdf")
      toast.success("PDF raporu indirildi")
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error("PDF oluşturulurken bir hata oluştu")
    }
  }

  async function handleExcelExport() {
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      // Herd sheet
      const herdData = Object.entries(reportData.herd.byStatus).map(([status, count]) => ({
        Durum: ANIMAL_STATUS_LABELS[status] || status,
        Sayı: count,
      }))
      const herdSheet = XLSX.utils.json_to_sheet(herdData)
      XLSX.utils.book_append_sheet(wb, herdSheet, "Sürü Özeti")

      // Breed sheet
      const breedData = Object.entries(reportData.herd.byBreed).map(([breed, count]) => ({
        Irk: breed,
        Sayı: count,
      }))
      const breedSheet = XLSX.utils.json_to_sheet(breedData)
      XLSX.utils.book_append_sheet(wb, breedSheet, "Irk Dağılımı")

      // Milk sheet
      const milkData = reportData.milk.monthlySummary.map((m) => ({
        Ay: m.label,
        "Toplam (Lt)": m.total,
      }))
      const milkSheet = XLSX.utils.json_to_sheet(milkData)
      XLSX.utils.book_append_sheet(wb, milkSheet, "Süt Üretimi")

      // Finance summary sheet
      const financeSummary = [
        { Kalem: "Toplam Gelir", "Tutar (TL)": reportData.finance.totalIncome },
        { Kalem: "Toplam Gider", "Tutar (TL)": reportData.finance.totalExpense },
        { Kalem: "Kar / Zarar", "Tutar (TL)": reportData.finance.profit },
      ]
      const financeSheet = XLSX.utils.json_to_sheet(financeSummary)
      XLSX.utils.book_append_sheet(wb, financeSheet, "Finansal Özet")

      // Income by category sheet
      if (reportData.finance.incomeByCategory.length > 0) {
        const incomeData = reportData.finance.incomeByCategory.map((item) => ({
          Kategori: TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
          "Tutar (TL)": item.total,
        }))
        const incomeSheet = XLSX.utils.json_to_sheet(incomeData)
        XLSX.utils.book_append_sheet(wb, incomeSheet, "Gelir Dağılımı")
      }

      // Expense by category sheet
      if (reportData.finance.expenseByCategory.length > 0) {
        const expenseData = reportData.finance.expenseByCategory.map((item) => ({
          Kategori: TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
          "Tutar (TL)": item.total,
        }))
        const expenseSheet = XLSX.utils.json_to_sheet(expenseData)
        XLSX.utils.book_append_sheet(wb, expenseSheet, "Gider Dağılımı")
      }

      // Health sheet
      const healthData = [
        { Kalem: "Toplam Aşı Kaydı", Değer: reportData.health.totalRecords },
        { Kalem: "Aşı Uyum Oranı (%)", Değer: reportData.health.vaccinationCompliance },
      ]
      const healthSheet = XLSX.utils.json_to_sheet(healthData)
      XLSX.utils.book_append_sheet(wb, healthSheet, "Sağlık")

      XLSX.writeFile(wb, "ciftlik-raporu.xlsx")
      toast.success("Excel raporu indirildi")
    } catch (error) {
      console.error("Excel export error:", error)
      toast.error("Excel oluşturulurken bir hata oluştu")
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePdfExport}>
        <FileDown className="mr-1 size-4" />
        PDF İndir
      </Button>
      <Button variant="outline" onClick={handleExcelExport}>
        <FileSpreadsheet className="mr-1 size-4" />
        Excel İndir
      </Button>
    </div>
  )
}
