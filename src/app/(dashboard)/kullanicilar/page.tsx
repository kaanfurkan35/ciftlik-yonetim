"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Users,
  Plus,
  UserCircle,
  Mail,
  Phone,
  Shield,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { USER_ROLE_LABELS } from "@/lib/constants"
import { DeleteButton } from "@/components/shared/delete-button"

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  VIEWER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newRole, setNewRole] = useState("VIEWER")

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const result = await response.json()
        setUsers(result.data)
      }
    } catch {
      console.error("Kullanıcılar yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("İsim, e-posta ve şifre zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword.trim(),
          phone: newPhone.trim() || undefined,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Kullanıcı oluşturulurken bir hata oluştu")
      }

      toast.success("Kullanıcı başarıyla oluşturuldu")
      setShowForm(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Kullanıcı oluşturulurken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setNewName("")
    setNewEmail("")
    setNewPassword("")
    setNewPhone("")
    setNewRole("VIEWER")
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Kullanıcılar" description="Çiftlik kullanıcılarını yönetin." />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Kullanıcılar" description="Çiftlik kullanıcılarını yönetin.">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="size-4" />
              Kapat
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Kullanıcı Ekle
            </>
          )}
        </Button>
      </PageHeader>

      {/* Yeni kullanıcı formu */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Kullanıcı Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newName">İsim *</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ad Soyad"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">E-posta *</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Şifre *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhone">Telefon</Label>
                  <Input
                    id="newPhone"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0532 XXX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Henüz kullanıcı bulunmuyor"
          description="Çiftliğinize kullanıcı ekleyerek başlayabilirsiniz."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Kullanıcı Ekle
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="size-5 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="size-3" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="size-3" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                      >
                        <Shield className="size-3" />
                        {USER_ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="secondary" className="text-xs">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeleteButton id={user.id} apiUrl="/api/users" entityName="Kullanıcı" onDeleted={fetchUsers} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
