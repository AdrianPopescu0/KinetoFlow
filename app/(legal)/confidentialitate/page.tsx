import type { Metadata } from "next"
import Link from "next/link"

import { LegalArticle } from "@/components/legal/legal-article"

export const metadata: Metadata = {
  title: "Politica de Confidențialitate | KinetoFlow",
  description:
    "Politica GDPR a KinetoFlow: cabinetul este Operator de date, platforma este Împuternicit. Informații despre prelucrare, securitate și drepturile persoanelor vizate.",
}

export default function ConfidentialitatePage() {
  return (
    <LegalArticle
      title="Politica de Confidențialitate și Prelucrare a Datelor"
      description="Informare conform Regulamentului (UE) 2016/679 (GDPR) și Legii nr. 190/2018, pentru utilizarea KinetoFlow de către cabinete de kinetoterapie."
      updated="2 septembrie 2026"
    >
      <section>
        <h2>1. Cine suntem și ce facem</h2>
        <p>
          KinetoFlow este un serviciu software B2B care ajută cabinetele de kinetoterapie să
          gestioneze programele de recuperare și comunicarea cu pacienții. Nu suntem furnizor de
          îngrijiri medicale. Datele de sănătate din platformă sunt introduse și controlate de
          cabinetul care deține contul.
        </p>
      </section>

      <section>
        <h2>2. Roluri GDPR: Operator și Împuternicit</h2>
        <p>
          <strong>Cabinetul / kinetoterapeutul este Operatorul de date</strong> pentru datele
          pacienților săi (identitate, telefon, diagnostic, program de exerciții, check-in-uri,
          scoruri VAS, note clinice). Cabinetul stabilește scopurile și mijloacele prelucrării în
          relația cu pacientul (tratament, evidență clinică, comunicare).
        </p>
        <p>
          <strong>KinetoFlow este Împuternicit (persoană împuternicită de operator)</strong> în
          sensul art. 28 GDPR: prelucrăm datele pacienților numai la instrucțiunile Cabinetului, în
          scopul furnizării platformei. Nu vindem date de pacienți, nu le folosim pentru publicitate
          profilată și nu luăm decizii clinice pe baza lor.
        </p>
        <p>
          Pentru datele de cont ale terapeutului (email, parolă hash-uită, numele clinicii,
          telefonul de contact al cabinetului), KinetoFlow acționează ca Operator al acestor date de
          client, necesare încheierii și executării contractului de servicii software.
        </p>
      </section>

      <section>
        <h2>3. Categorii de date</h2>
        <ul>
          <li>
            <strong>Date de cont clinică:</strong> email, parolă, numele cabinetului, numele
            terapeutului, telefon/WhatsApp de contact.
          </li>
          <li>
            <strong>Date de pacient (la instrucțiunea Operatorului):</strong> nume, telefon, email
            opțional, diagnostic, note clinice, token de acces, cod de 8 cifre, program de
            exerciții, videoclipuri asignate, check-in-uri (VAS, somn, comentarii).
          </li>
          <li>
            <strong>Date tehnice:</strong> jurnale de autentificare, identificatori de sesiune
            (cookie-uri strict necesare), adrese IP în logurile de infrastructură, în măsura
            necesară securității.
          </li>
        </ul>
        <p>
          Datele de sănătate sunt date din categorii speciale (art. 9 GDPR). Temeiul prelucrării de
          către Operator este, de regulă, art. 9 alin. (2) lit. h) (îngrijiri de sănătate) și/sau
          consimțământul pacientului, după cum decide Cabinetul în propria sa informare. KinetoFlow
          nu colectează consimțământul medical al pacientului în locul Cabinetului.
        </p>
      </section>

      <section>
        <h2>4. Scopuri și temeiuri (date de client KinetoFlow)</h2>
        <p>
          Prelucrăm emailul și datele de cabinet pentru crearea contului, autentificare, onboarding,
          suport și facturare, pe temeiul executării contractului (art. 6 alin. (1) lit. b) GDPR) și,
          unde e cazul, al interesului legitim de a asigura securitatea platformei (lit. f).
        </p>
      </section>

      <section>
        <h2>5. Securitate, izolare și stocare în UE</h2>
        <p>
          Datele sunt stocate prin infrastructura <strong>Supabase</strong>, cu regiune în
          Uniunea Europeană, și sunt transmise criptat (HTTPS). Autentificarea terapeuților folosește
          Supabase Auth. Parolele nu sunt stocate în clar.
        </p>
        <p>
          Aplicăm <strong>izolare între cabinete (multi-tenancy)</strong>: înregistrările de pacienți
          sunt legate de identitatea contului (user_id / auth.uid()). Politicile de tip Row
          Level Security din baza de date limitează accesul unui terapeut autentificat la propriii
          pacienți, la programele și check-in-urile acestora. Un cont nou de clinică nu vede
          pacienții altui cabinet.
        </p>
        <p>
          Accesul pacienților la portal se face cu telefon și cod unic, nu prin impersonarea
          terapeutului. Cheia de serviciu (service role) este folosită doar pe server, pentru
          operațiuni strict necesare (de exemplu, check-in-ul pacientului), nu în browser.
        </p>
      </section>

      <section>
        <h2>6. Destinatari și transferuri</h2>
        <p>
          Putem folosi subprocessori tehnici pentru găzduire, autentificare și livrare de email
          (inclusiv Supabase și, dacă sunt configurați, furnizori de mesagerie). Aceștia prelucrează
          datele în UE sau cu garanții adecvate pentru transferuri. Nu transferăm date de pacienți
          către rețele de publicitate.
        </p>
        <p>
          WhatsApp: dacă terapeutul deschide un link de tip click-to-chat, mesajul este compus în
          KinetoFlow, dar trimiterea se face în aplicația sau web-ul WhatsApp, guvernate de
          politicile Meta. KinetoFlow nu operează un gateway WhatsApp propriu, decât dacă Clientul
          configurează separat un furnizor (ex. Twilio).
        </p>
      </section>

      <section>
        <h2>7. Durata stocării</h2>
        <p>
          Datele de cont se păstrează pe durata contractului și ulterior pe termenele legale
          (contabilitate, apărarea drepturilor). Datele de pacienți se păstrează cât timp Operatorul
          (cabinetul) menține evidența în platformă și conform instrucțiunilor sale; la ștergerea
          pacientului sau a contului, înregistrările asociate sunt eliminate din baza operațională,
          sub rezerva copiilor de rezervă pe un interval tehnic scurt.
        </p>
      </section>

      <section>
        <h2>8. Drepturile persoanelor vizate</h2>
        <p>
          Pacienții își exercită drepturile GDPR (acces, rectificare, ștergere, restricționare,
          opoziție, portabilitate, plângere la ANSPDCP) <strong>față de Cabinetul Operator</strong>,
          care deține relația clinică. KinetoFlow sprijină Cabinetul, ca Împuternicit, să răspundă
          acestor cereri în măsura în care datele se află în platformă.
        </p>
        <p>
          Terapeuții pot cere acces sau ștergerea datelor de cont scriind la datele de contact
          KinetoFlow. Plângerile se pot depune la Autoritatea Națională de Supraveghere a
          Prelucrării Datelor cu Caracter Personal (www.dataprotection.ro).
        </p>
      </section>

      <section>
        <h2>9. Cookie-uri</h2>
        <p>
          Folosim cookie-uri și stocare similară strict necesare pentru sesiunea autenticată
          (terapeut sau pacient) și pentru protecția cererilor. Nu folosim cookie-uri de marketing
          terță parte în fluxurile de autentificare descrise aici.
        </p>
      </section>

      <section>
        <h2>10. Disclaimer medical (confidențialitate și uz clinic)</h2>
        <p>
          Prelucrarea datelor în KinetoFlow nu echivalează cu un act medical. Platforma nu
          interpretează diagnosticul și nu înlocuiește dosarul medical obligatoriu al cabinetului,
          acolo unde legea impune evidențe specifice.
        </p>
      </section>

      <section>
        <h2>11. Actualizări</h2>
        <p>
          Putem actualiza această politică. Data de la începutul paginii indică versiunea în
          vigoare. Continuarea utilizării după publicarea unei versiuni noi, atunci când
          modificările nu sunt esențiale, constituie luarea la cunoștință. Pentru modificări
          esențiale, vom informa prin aplicație sau email, unde este rezonabil.
        </p>
        <p>
          Termenii contractuali generali sunt disponibili la{" "}
          <Link href="/termeni" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
            Termeni și Condiții
          </Link>
          .
        </p>
      </section>
    </LegalArticle>
  )
}
