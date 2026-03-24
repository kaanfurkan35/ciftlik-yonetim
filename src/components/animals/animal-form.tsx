"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ANIMAL_STATUS_LABELS } from "@/lib/constants"

// ============================================================================
// Form schema - zod validation with Turkish error messages
// ============================================================================

const BREEDS = [
  "Simental",
  "Holstein",
  "Montofon",
  "Brown Swiss",
  "Jersey",
  "Angus",
  "Hereford",
  "Yerli Kara",
  "Boz Irk",
  "Diğer",
] as const

const animalFormSchema = z.object({
  earTagNumber: z
    .string()
    .trim()
    .min(1, "Kulak numarası zorunludur"),
  name: z.string().trim().optional().or(z.literal("")),
  breed: z.string().min(1, "Irk seçimi zorunludur"),
  sex: z.enum(["MALE", "FEMALE"], "Cinsiyet seçimi zorunludur"),
  color: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  status: z.string().min(1, "Durum seçimi zorunludur"),
  acquisitionType: z.enum(["BORN", "PURCHASED"], "Edinme türü seçimi zorunludur"),
  acquisitionDate: z.string().optional().or(z.literal("")),
  acquisitionPrice: z.number().positive().optional(),
  motherId: z.string().trim().optional().or(z.literal("")),
  fatherId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
})

export type AnimalFormValues = z.infer<typeof animalFormSchema>

// ============================================================================
// Animal type for edit mode
// ============================================================================

export interface Animal {
  id: string
  earTagNumber: string
  name?: string | null
  breed?: string | null
  sex: string
  color?: string | null
  dateOfBirth?: string | null
  status: string
  acquisitionType?: string | null
  acquisitionDate?: string | null
  acquisitionPrice?: number | null
  motherId?: string | null
  fatherId?: string | null
  notes?: string | null
}

// ============================================================================
// Props
// ============================================================================

interface AnimalFormProps {
  animal?: Animal
  onSubmit: (data: AnimalFormValues) => Promise<void>
  isSubmitting: boolean
}

// ============================================================================
// Component
// ============================================================================

export function AnimalForm({ animal, onSubmit, isSubmitting }: AnimalFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      earTagNumber: animal?.earTagNumber ?? "",
      name: animal?.name ?? "",
      breed: animal?.breed ?? "",
      sex: (animal?.sex as "MALE" | "FEMALE") ?? undefined,
      color: animal?.color ?? "",
      dateOfBirth: animal?.dateOfBirth
        ? animal.dateOfBirth.substring(0, 10)
        : "",
      status: animal?.status ?? "ACTIVE",
      acquisitionType:
        (animal?.acquisitionType as "BORN" | "PURCHASED") ?? undefined,
      acquisitionDate: animal?.acquisitionDate
        ? animal.acquisitionDate.substring(0, 10)
        : "",
      acquisitionPrice: animal?.acquisitionPrice ?? undefined,
      motherId: animal?.motherId ?? "",
      fatherId: animal?.fatherId ?? "",
      notes: animal?.notes ?? "",
    },
  })

  const acquisitionType = watch("acquisitionType")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Kulak Numarası */}
            <div className="space-y-2">
              <Label htmlFor="earTagNumber">Kulak Numarası *</Label>
              <Input
                id="earTagNumber"
                placeholder="TR-12345678"
                {...register("earTagNumber")}
              />
              {errors.earTagNumber && (
                <p className="text-sm text-destructive">
                  {errors.earTagNumber.message}
                </p>
              )}
            </div>

            {/* İsim */}
            <div className="space-y-2">
              <Label htmlFor="name">İsim</Label>
              <Input
                id="name"
                placeholder="Örnek: Sarıız"
                {...register("name")}
              />
            </div>

            {/* Irk */}
            <div className="space-y-2">
              <Label htmlFor="breed">Irk *</Label>
              <Controller
                name="breed"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Irk seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {BREEDS.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.breed && (
                <p className="text-sm text-destructive">
                  {errors.breed.message}
                </p>
              )}
            </div>

            {/* Cinsiyet */}
            <div className="space-y-2">
              <Label htmlFor="sex">Cinsiyet *</Label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Cinsiyet seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">Dişi</SelectItem>
                      <SelectItem value="MALE">Erkek</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sex && (
                <p className="text-sm text-destructive">
                  {errors.sex.message}
                </p>
              )}
            </div>

            {/* Renk */}
            <div className="space-y-2">
              <Label htmlFor="color">Renk</Label>
              <Input
                id="color"
                placeholder="Örnek: Siyah-Beyaz"
                {...register("color")}
              />
            </div>

            {/* Doğum Tarihi */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Durum & Edinme */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum & Edinme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Durum */}
              <div className="space-y-2">
                <Label htmlFor="status">Durum *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ANIMAL_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* Edinme Türü */}
              <div className="space-y-2">
                <Label htmlFor="acquisitionType">Edinme Türü *</Label>
                <Controller
                  name="acquisitionType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Edinme türü seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BORN">Doğum</SelectItem>
                        <SelectItem value="PURCHASED">Satın Alma</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.acquisitionType && (
                  <p className="text-sm text-destructive">
                    {errors.acquisitionType.message}
                  </p>
                )}
              </div>

              {/* Edinme Tarihi */}
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Edinme Tarihi</Label>
                <Input
                  id="acquisitionDate"
                  type="date"
                  {...register("acquisitionDate")}
                />
              </div>

              {/* Edinme Fiyati - only when PURCHASED */}
              {acquisitionType === "PURCHASED" && (
                <div className="space-y-2">
                  <Label htmlFor="acquisitionPrice">Edinme Fiyatı (TL)</Label>
                  <Input
                    id="acquisitionPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("acquisitionPrice")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Soy Bilgisi */}
          <Card>
            <CardHeader>
              <CardTitle>Soy Bilgisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Anne */}
              <div className="space-y-2">
                <Label htmlFor="motherId">Anne (ID)</Label>
                <Input
                  id="motherId"
                  placeholder="Anne hayvan ID'si"
                  {...register("motherId")}
                />
              </div>

              {/* Baba */}
              <div className="space-y-2">
                <Label htmlFor="fatherId">Baba (ID)</Label>
                <Input
                  id="fatherId"
                  placeholder="Baba hayvan ID'si"
                  {...register("fatherId")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="Hayvan ile ilgili ek notlar..."
                  rows={4}
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" render={<Link href="/hayvanlar" />}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}
