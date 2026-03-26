"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface DeleteButtonProps {
  id: string
  apiUrl: string
  entityName: string
  confirmTitle?: string
  confirmDescription?: string
  onDeleted?: () => void
}

export function DeleteButton({ id, apiUrl, entityName, confirmTitle, confirmDescription, onDeleted }: DeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || "Silme işlemi başarısız")
      }
      toast.success(`${entityName} başarıyla silindi`)
      setShowConfirm(false)
      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={confirmTitle || `${entityName} Sil`}
        description={confirmDescription || `Bu ${entityName.toLowerCase()} kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText={isDeleting ? "Siliniyor..." : "Sil"}
      />
    </>
  )
}
