-- KinetoFlow — valori multiple pe regiune, obiectiv și echipament
-- Coloanele rămân text: aplicația salvează id-uri despărțite prin virgulă
-- (ex: "cervical,lumbar" / "mobility,strength" / "bands,ball").
-- Valorile vechi cu un singur id rămân valide.

comment on column public.exercise_library.region is
  'Id-uri de regiune anatomică, despărțite prin virgulă (cervical,thoracic,lumbar,pelvis,upper,lower).';

comment on column public.exercise_library.subcategory is
  'Id-uri de obiectiv terapeutic, despărțite prin virgulă (mobility,strength,stability,stretching,posture).';

comment on column public.exercise_library.equipment is
  'Id-uri de echipament, despărțite prin virgulă (none,bands,dumbbells,ball,roller).';
