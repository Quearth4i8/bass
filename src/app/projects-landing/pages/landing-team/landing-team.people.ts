/**
 * The people on the public Team page (landing-team.component.html), so the
 * Crew CVs admin can offer their cards for linking. Keep in sync with the
 * template: the `name` here must match the card's <app-cv-link name>.
 */
export const LANDING_TEAM_PEOPLE: { name: string; role: string; group: string }[] = [
  { name: "Hechmi Missaoui", role: "General Director", group: "directors" },
  { name: "Saloua Sadok", role: "General Director", group: "directors" },
  { name: "Azaza Mohamed Salah", role: "General Director", group: "directors" },
  { name: "Ali Harzallah", role: "Head of Marine Environment Laboratory (LMM)", group: "head of lmm" },
  { name: "Béchir Béjaoui", role: "Project Coordinator", group: "administrators" },
  { name: "Houaïda Bouali", role: "Hydraulic Engineer", group: "administrators" },
  { name: "Hatem Salem", role: "Developer", group: "developers" },
  { name: "Jasser Etoui", role: "Big Data Engineer", group: "developers" },
  { name: "Ala Din Weslati", role: "Data Sciences Engineer", group: "developers" },
  { name: "Mohamed Aziz Bjaoui", role: "Data Science Engineer", group: "developers" },
];
