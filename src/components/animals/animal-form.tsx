"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
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
import { NativeSelect } from "@/components/ui/native-select"
import { ANIMAL_STATUS_LABELS, ANIMAL_SEX_LABELS } from "@/lib/constants"

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
  earTagNumber: z.string().trim().min(1, "Kulak numarası zorunludur"),
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

interface AnimalFormProps {
  animal?: Animal
  onSubmit: (data: AnimalFormValues) => Promise<void>
  isSubmitting: boolean
}


export function AnimalForm({ animal, onSubmit, isSubmitting }: AnimalFormProps) {
  const {
    register,
    handleSubmit,
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
      dateOfBirth: animal?.dateOfBirth ? animal.dateOfBirth.substring(0, 10) : "",
      status: animal?.status ?? "ACTIVE",
      acquisitionType: (animal?.acquisitionType as "BORN" | "PURCHASED") ?? undefined,
      acquisitionDate: animal?.acquisitionDate ? animal.acquisitionDate.substring(0, 10) : "",
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
            <div className="space-y-2">
              <Label htmlFor="earTagNumber">Kulak Numarası *</Label>
              <Input id="earTagNumber" placeholder="TR-12345678" {...register("earTagNumber")} />
              {errors.earTagNumber && <p className="text-sm text-destructive">{errors.earTagNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">İsim</Label>
              <Input id="name" placeholder="Örnek: Sarıkız" {...register("name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Irk *</Label>
              <NativeSelect id="breed" className="w-full" {...register("breed")}>
                <option value="">Irk seçiniz</option>
                {BREEDS.map((breed) => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </NativeSelect>
              {errors.breed && <p className="text-sm text-destructive">{errors.breed.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Cinsiyet *</Label>
              <NativeSelect id="sex" className="w-full" {...register("sex")}>
                <option value="">Cinsiyet seçiniz</option>
                {Object.entries(ANIMAL_SEX_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </NativeSelect>
              {errors.sex && <p className="text-sm text-destructive">{errors.sex.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Renk</Label>
              <Input id="color" placeholder="Örnek: Siyah-Beyaz" {...register("color")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
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
              <div className="space-y-2">
                <Label htmlFor="status">Durum *</Label>
                <NativeSelect id="status" className="w-full" {...register("status")}>
                  <option value="">Durum seçiniz</option>
                  {Object.entries(ANIMAL_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </NativeSelect>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acquisitionType">Edinme Türü *</Label>
                <NativeSelect id="acquisitionType" className="w-full" {...register("acquisitionType")}>
                  <option value="">Edinme türü seçiniz</option>
                  <option value="BORN">Doğum</option>
                  <option value="PURCHASED">Satın Alma</option>
                </NativeSelect>
                {errors.acquisitionType && <p className="text-sm text-destructive">{errors.acquisitionType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Edinme Tarihi</Label>
                <Input id="acquisitionDate" type="date" {...register("acquisitionDate")} />
              </div>

              {acquisitionType === "PURCHASED" && (
                <div className="space-y-2">
                  <Label htmlFor="acquisitionPrice">Edinme Fiyatı (TL)</Label>
                  <Input id="acquisitionPrice" type="number" step="0.01" min="0" placeholder="0.00" {...register("acquisitionPrice")} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soy Bilgisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motherId">Anne (ID)</Label>
                <Input id="motherId" placeholder="Anne hayvan ID'si" {...register("motherId")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherId">Baba (ID)</Label>
                <Input id="fatherId" placeholder="Baba hayvan ID'si" {...register("fatherId")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea id="notes" placeholder="Hayvan ile ilgili ek notlar..." rows={4} {...register("notes")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" render={<Link href="/hayvanlar" />}>İptal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}
