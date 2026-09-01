import Link from "next/link"

export default function PatientNotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-[0.16em] text-[#005F73] uppercase">KinetoFlow</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#0F4C5C]">
        Linkul programului nu este valid
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Cere terapeutului un nou link personal. Tokenul trebuie să aibă cel puțin 4 caractere.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-[#005F73] underline-offset-4 hover:underline">
        Înapoi acasă
      </Link>
    </main>
  )
}
