import assert from "node:assert/strict"
import { test } from "node:test"

import { LANDING_FAQ } from "./faq.ts"

test("landing-ul are cele 10 întrebări și răspunsuri FAQ exacte", () => {
  assert.equal(LANDING_FAQ.length, 10)
  assert.deepEqual(
    LANDING_FAQ.map((item) => item.question),
    [
      "Ce este KinetoFlow?",
      "Cum funcționează accesul pentru pacienți?",
      "Trebuie să instalez o aplicație din App Store sau Google Play?",
      "Pot folosi aplicația dacă lucrez în mai mulți terapeuți?",
      "Sunt datele medicale ale pacienților în siguranță?",
      "Cum își bifează pacientul exercițiile?",
      "Pot lăsa mesaje sau sfaturi personalizate pentru pacienți?",
      "Pe ce dispozitive rulează platforma?",
      "Cum mă pot înregistra cu clinica mea?",
      "Pot personaliza exercițiile sau adăuga conținut nou?",
    ],
  )
  assert.equal(
    LANDING_FAQ[0].answer,
    "Este o platformă digitală dedicată clinicilor de kinetoterapie și terapeuților independenți pentru gestionarea pacienților și prescrierea exercițiilor de recuperare.",
  )
  assert.equal(
    LANDING_FAQ[9].answer,
    "Da, platforma este construită astfel încât terapeuții să poată adăuga și organiza cu ușurință exercițiile și programele de recuperare în funcție de nevoile specifice ale fiecărui pacient.",
  )
})
