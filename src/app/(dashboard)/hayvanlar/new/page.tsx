"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { AnimalForm, type AnimalFormValues } from "@/components/animals/animal-form"

export default function YeniHayvanPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(data: AnimalFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Hayvan eklenirken bir hata oluştu")
      }

      toast.success("Hayvan başarıyla eklendi")
      router.push("/hayvanlar")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Hayvan eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Hayvan Ekle"
        description="Çiftliğe yeni bir hayvan kaydı oluşturun."
      />
      <AnimalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
