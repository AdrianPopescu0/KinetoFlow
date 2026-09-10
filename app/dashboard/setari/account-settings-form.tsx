"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { updateAccountPassword, updateAccountProfile } from "@/app/dashboard/setari/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toaster"
import { evaluateRegisterPassword } from "@/lib/auth/password"

export function AccountSettingsForm({
  email,
  therapistName,
  phone,
  clinicName,
  isAdmin,
}: {
  email: string
  therapistName: string
  phone: string
  clinicName: string
  isAdmin: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileForm
        email={email}
        therapistName={therapistName}
        phone={phone}
        clinicName={clinicName}
        isAdmin={isAdmin}
      />
      <PasswordForm />
    </div>
  )
}

function ProfileForm({
  email,
  therapistName,
  phone,
  clinicName,
  isAdmin,
}: {
  email: string
  therapistName: string
  phone: string
  clinicName: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateAccountProfile(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      toast(result?.message ?? "Datele contului au fost salvate.")
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut salva profilul</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Date personale</h2>
          <p className="mt-1 text-sm text-slate-600">
            Emailul rămâne cel cu care te autentifici. Numele și telefonul apar în echipă și în mesajele către pacienți.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account_email">Email</Label>
          <Input
            id="account_email"
            type="email"
            value={email}
            readOnly
            disabled
            className="h-12 border-slate-300 bg-slate-50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="therapist_full_name">Nume și prenume</Label>
          <Input
            id="therapist_full_name"
            name="therapist_full_name"
            required
            defaultValue={therapistName}
            disabled={isPending}
            autoComplete="name"
            placeholder="Adrian Popescu"
            className="h-12 border-slate-300"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact_phone">Telefon / WhatsApp</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            required
            defaultValue={phone}
            disabled={isPending}
            autoComplete="tel"
            placeholder="07xx xxx xxx"
            className="h-12 border-slate-300"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-slate-200 pt-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Preferințe de profil</h2>
          <p className="mt-1 text-sm text-slate-600">
            Numele de mai sus este afișat pacienților.{" "}
            {isAdmin
              ? "Ca administrator, poți redenumi cabinetul; colegii rămân în aceeași clinică."
              : "Numele cabinetului poate fi schimbat doar de administrator."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="clinic_name">Numele clinicii / cabinetului</Label>
          <Input
            id="clinic_name"
            name="clinic_name"
            required={isAdmin}
            readOnly={!isAdmin}
            disabled={isPending || !isAdmin}
            defaultValue={clinicName}
            className="h-12 border-slate-300"
          />
        </div>
      </section>

      <Button type="submit" disabled={isPending} className="h-12 min-h-[48px] w-full rounded-xl sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se salvează…
          </>
        ) : (
          "Salvează profilul"
        )}
      </Button>
    </form>
  )
}

function PasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const passwordChecks = evaluateRegisterPassword(password)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateAccountPassword(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      toast(result?.message ?? "Parola a fost actualizată.")
      setPassword("")
      setConfirmPassword("")
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 border-t border-slate-200 pt-6" noValidate>
      <div>
        <h2 className="text-base font-semibold text-slate-800">Parolă</h2>
        <p className="mt-1 text-sm text-slate-600">
          Schimbă parola acestui cont. Dacă te-ai înregistrat cu Google, poți seta totuși o parolă pentru email.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Parola nu a putut fi salvată</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Parolă nouă</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            className="h-12 min-h-12 border-slate-300 px-3 pr-11"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center text-slate-500"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <ul className="space-y-1 text-xs text-slate-600">
          {passwordChecks.checks.map((check) => (
            <li key={check.id} className={check.met ? "text-emerald-700" : undefined}>
              {check.met ? "✓" : "○"} {check.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm_password">Confirmă parola</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isPending}
          className="h-12 min-h-12 border-slate-300 px-3"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !passwordChecks.isValid}
        className="h-12 min-h-[48px] w-full rounded-xl sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se salvează…
          </>
        ) : (
          "Actualizează parola"
        )}
      </Button>
    </form>
  )
}
