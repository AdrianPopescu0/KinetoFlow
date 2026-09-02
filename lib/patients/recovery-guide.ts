export const GOLDEN_RULES = [
  {
    title: "Nu forța prin durere ascuțită",
    detail: "Disconfortul de efort e acceptabil. Durerea tăioasă, iradiată sau care crește brusc înseamnă stop.",
  },
  {
    title: "Respiră constant",
    detail: "Nu-ți ține respirația. Expiră pe efort, inspiră pe revenire — mușchii lucrează mai curat.",
  },
  {
    title: "Execută lent și controlat",
    detail: "Calitatea bate cantitatea. Două repetări corecte valorează mai mult decât zece grăbite.",
  },
] as const

export const RECOVERY_ARTICLES = [
  {
    id: "heat-cold",
    title: "Cald sau rece pe durere? Cum alegi corect",
    summary: "Gheața calmează inflamația acută. Căldura destinde mușchiul înțepenit. Nu le amesteca la întâmplare.",
    body: [
      "În primele 48 de ore după o iritare clară (umflătură, căldură locală, durere de debut brusc), aplică rece 10–15 minute, cu un prosop între piele și pungă. Nu adormi cu gheața pe loc.",
      "Dacă zona e rigidă, fără umflătură, și durerea e de „oxidat”, folosește căldură umedă sau un duș cald înainte de exerciții, 10–15 minute.",
      "Nu pune niciodată căldură pe o articulație fierbinte și umflată. Dacă nu ești sigur, întreabă terapeutul înainte de a improviză acasă.",
    ],
  },
  {
    id: "doms",
    title: "Cum gestionezi febra musculară după kineto",
    summary: "Febra musculară la 24–48 de ore e frecventă. Durerea care te trezește noaptea sau te șchiopătează nu e „normală”.",
    body: [
      "DOMS (febra musculară de efort) apare de obicei a doua zi, e difuză și scade la mișcare ușoară. Plimbarea, mobilitatea lentă și somnul ajută mai mult decât antiinflamatoare luate „preventiv”.",
      "Hidratează-te, evită un al doilea antrenament greu în aceeași zi și păstrează doza din program. Dacă a doua zi nu poți merge sau ridica brațul, scrie-i terapeutului — doza se ajustează.",
      "Masajul agresiv și stretchingul forțat pe mușchiul inflamat pot prelungi disconfortul. Rămâi la amplitudine confortabilă.",
    ],
  },
  {
    id: "posture",
    title: "Postura corectă la birou și în somn",
    summary: "Recuperarea se pierde în cele 8 ore de birou sau de somn, nu doar în cele 15 minute de exerciții.",
    body: [
      "La birou: ecranul la nivelul ochilor, picioarele pe sol, umerii coborâți. Ridică-te la 30–40 de minute — chiar și 30 de secunde de mers resetează coloana.",
      "La dormit: un tampon între genunchi (pe o parte) sau sub genunchi (pe spate) reduce torsiunea lombară. Evită să dormi pe burtă dacă cervicala sau umărul sunt în program.",
      "Telefonul jos, nu în poală: capul înainte de ecran e una dintre cele mai frecvente surse de durere de ceafă.",
    ],
  },
] as const

export const EXTRA_HEALTH_TIPS = [
  {
    title: "Apă și sare, fără mituri",
    body: "Mușchiul recuperat are nevoie de lichid. Un pahar de apă înainte de sesiune e mai util decât un energizant. Dacă transpiri mult, un strop de sare în mâncare e suficient — nu îți umple ziua de suplimente.",
  },
  {
    title: "Somnul e parte din program",
    body: "Țesutul se repară noaptea. Dacă VAS-ul e mare, un somn scurt și fragmentat înrăutățește totul a doua zi. Păstrează ora de culcare, evită ecranul în pat, raportează somnul în check-in.",
  },
  {
    title: "Încălzire de 3 minute, nu de 30",
    body: "Înainte de seturile din program: 20–30 de cercuri mici cu articulația vizată, apoi prima serie la jumătate de efort. Nu începe niciodată cu repetarea cea mai grea.",
  },
  {
    title: "Când sari o zi",
    body: "O zi ratată nu se „recuperează” cu dublu a doua zi. Reiei doza obișnuită. Dacă ai sărit trei zile, scrie terapeutului — nu relua tot volumul dintr-odată.",
  },
  {
    title: "Semne că trebuie să te oprești azi",
    body: "Amorțeală nouă, slăbiciune, amețeală, durere care iradiază sub genunchi sau sub cot, sau umflătură care crește. Oprește, notează în check-in și contactează terapeutul.",
  },
] as const

export function whatsappHref(phone: string | null): string {
  const text = encodeURIComponent("Bună! Am o întrebare despre programul meu de recuperare de azi.")
  if (!phone) {
    return `https://wa.me/?text=${text}`
  }
  return `https://wa.me/${phone}?text=${text}`
}
