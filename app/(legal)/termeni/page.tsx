import type { Metadata } from "next"
import Link from "next/link"

import { LegalArticle } from "@/components/legal/legal-article"

export const metadata: Metadata = {
  title: "Termeni și Condiții | KinetoFlow",
  description:
    "Termenii de utilizare a platformei KinetoFlow pentru cabinete de kinetoterapie. Include disclaimerul medical și responsabilitățile terapeutului.",
}

export default function TermeniPage() {
  return (
    <LegalArticle
      title="Termeni și Condiții"
      description="Acești termeni reglementează utilizarea platformei software KinetoFlow de către cabinete, clinici și kinetoterapeuți din România."
      updated="2 septembrie 2026"
    >
      <section>
        <h2>1. Părțile și obiectul contractului</h2>
        <p>
          KinetoFlow este o platformă software de tip SaaS (Software as a Service), destinată
          cabinetelor de kinetoterapie, clinicilor și profesioniștilor autorizați („Clientul”,
          „Cabinetul” sau „Terapeutul”). Prin crearea unui cont, Clientul încheie un contract de
          prestări servicii informatice cu operatorul platformei KinetoFlow.
        </p>
        <p>
          Obiectul serviciului este punerea la dispoziție a unui instrument digital pentru
          organizarea programelor de recuperare, comunicarea cu pacienții și monitorizarea
          check-in-urilor (inclusiv scoruri de durere de tip VAS). KinetoFlow nu este un cabinet
          medical, nu este un dispozitiv medical certificat și nu prestează acte de kinetoterapie.
        </p>
      </section>

      <section>
        <h2>2. Disclaimer medical — responsabilitatea prescrierii</h2>
        <p>
          <strong>
            KinetoFlow oferă exclusiv suport software pentru administrarea și monitorizarea
            planului de recuperare. Nu diagnostichează, nu recomandă și nu prescrie exerciții.
          </strong>
        </p>
        <p>
          Responsabilitatea clinică pentru evaluarea pacientului, alegerea exercițiilor, doza,
          contraindicațiile, progresia și întreruperea programului aparține în totalitate
          kinetoterapeutului sau cabinetului care deține contul. Pacientul primește în aplicație
          doar conținutul încărcat sau asignat de terapeutul său.
        </p>
        <p>
          Platforma nu înlocuiește consultația de specialitate, urgența medicală sau obligațiile
          prevăzute de legislația privind exercitarea profesiilor sanitare în România. Clientul
          declară că are dreptul legal de a trata pacienții pentru care folosește KinetoFlow.
        </p>
      </section>

      <section>
        <h2>3. Contul, accesul și utilizatorii autorizați</h2>
        <p>
          Contul de clinică este destinat personalului autorizat. Clientul este responsabil pentru
          păstrarea confidențialității parolei, pentru acțiunile efectuate din cont și pentru
          revocarea accesului când un angajat părăsește cabinetul.
        </p>
        <p>
          Pacienții accesează portalul cu numărul de telefon și un cod unic de 8 cifre, nu cu
          contul de terapeut. Clientul trebuie să transmită aceste date doar pacientului vizat și
          să nu publice linkuri de acces în spații nesigure.
        </p>
      </section>

      <section>
        <h2>4. Datele încărcate și izolare între cabinete</h2>
        <p>
          Fiecare cabinet vede doar pacienții, check-in-urile și programele asociate contului său.
          Biblioteca de exerciții din aplicație este un catalog de lucru comun, fără date de
          identificare a pacienților. Clientul nu va încerca să acceseze datele altor cabinete și
          nu va folosi platforma în scopuri ilegale sau pentru a eluda obligațiile de
          confidențialitate medicală.
        </p>
      </section>

      <section>
        <h2>5. Disponibilitate, modificări și suport</h2>
        <p>
          Depunem eforturi rezonabile pentru a menține serviciul disponibil, însă nu garantăm
          funcționare neîntreruptă. Putem actualiza funcționalitățile, interfața sau cerințele
          tehnice. Întreruperile planificate sau incidentele de infrastructură (inclusiv ale
          furnizorului de găzduire) nu constituie, prin ele însele, neîndeplinirea esențială a
          contractului, dacă sunt remediate într-un termen rezonabil.
        </p>
      </section>

      <section>
        <h2>6. Răspundere</h2>
        <p>
          În măsura permisă de lege, KinetoFlow nu răspunde pentru decizii clinice, pentru
          conținutul video sau text introdus de terapeut, pentru interpretarea scorurilor VAS de
          către pacient sau pentru daune rezultate din nerespectarea indicațiilor terapeutului.
        </p>
        <p>
          Răspunderea noastră contractuală, atunci când este angajată, este limitată la prejudiciul
          direct și previzibil, cu excluderea profitului nerealizat, în limita valorii abonamentului
          plătit pentru ultimele 12 luni, exceptând cazurile de dol sau culpă gravă.
        </p>
      </section>

      <section>
        <h2>7. Durata, încetare și date după închidere</h2>
        <p>
          Clientul poate înceta utilizarea oricând, prin închiderea contului sau cerere scrisă.
          Putem suspenda sau închide un cont în caz de încălcare gravă a acestor termeni, fraudă
          sau risc de securitate. După încetare, datele se păstrează sau se șterg conform{" "}
          <Link href="/confidentialitate" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
            Politicii de confidențialitate
          </Link>{" "}
          și a instrucțiunilor Operatorului (cabinetul).
        </p>
      </section>

      <section>
        <h2>8. Legea aplicabilă</h2>
        <p>
          Prezentul document se interpretează conform legii române. Litigiile care nu se soluționează
          amiabil sunt de competența instanțelor din România, la sediul furnizorului, fără a aduce
          atingere drepturilor imperative ale consumatorilor, dacă ar fi aplicabile.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Pentru întrebări privind acești termeni, folosiți datele de contact afișate în aplicație
          sau în comunicările de pe domeniul KinetoFlow. Politica de prelucrare a datelor este
          descrisă separat, la pagina de{" "}
          <Link href="/confidentialitate" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
            confidențialitate
          </Link>
          .
        </p>
      </section>
    </LegalArticle>
  )
}
