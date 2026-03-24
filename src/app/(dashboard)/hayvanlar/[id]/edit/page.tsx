"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import {
  AnimalForm,
  type Animal,
  type AnimalFormValues,
} from "@/components/animals/animal-form"

export default function HayvanDuzenlePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [animal, setAnimal] = useState<Animal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchAnimal() {
      try {
        const response = await fetch(`/api/animals/${id}`)
        if (!response.ok) {
          throw new Error("Hayvan bilgileri yüklenemedi")
        }
        const data = await response.json()
        setAnimal(data)
      } catch (error) {
        toast.error("Hayvan bilgileri yüklenirken bir hata oluştu")
        router.push("/hayvanlar")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnimal()
  }, [id, router])

  async function handleSubmit(data: AnimalFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.message || "Hayvan güncellenirken bir hata oluştu"
        )
      }

      toast.success("Hayvan başarıyla güncellendi")
      router.push(`/hayvanlar/${id}`)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Hayvan güncellenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!animal) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Hayvan Düzenle"
        description={`${animal.earTagNumber}${animal.name ? ` - ${animal.name}` : ""} bilgilerini düzenleyin.`}
      />
      <AnimalForm
        animal={animal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
