/**
 * Language utilities for identifying content written in Portuguese.
 * Ensures accessibility compliance, screen reader support, and search engine linguistic comprehension.
 */

export const PORTUGUESE_SLUGS = new Set([
  // Poetry & Literary Works
  "entre-sono-sonho-x",
  "alma-de-mar",
  "liberdade-vol-2",
  "entre-sono-sonho-vii",

  // Music Releases (T4P Portuguese lyrics & tracks)
  "tp4-o-fim",
  "t4p-degradacao-ser-humano",
  "t4p-planeta-combustao",
  "t4p-veio-outro-mundo",
  "t4p-odisseia",
  "t4p-camelo",
  "t4p-babanam",
  "t4p-natal-bombastico",
  "t4p-cagar-palco-arte",
  "nome-na-brisa",

  // Press & Interviews
  "artec-27",
  "faz-sentido",
  "metamorfose-ambulante",
  "a-rede-da-radio",

  // Projects / Software with primary Portuguese interfaces/content
  "mover-a-montanha",
  "ciencia-da-trabalho",
  "liberdade-quiz",
  "nespera",
  "xiripiti",
]);

/**
 * Checks if a project, article, album, or press piece is primarily in Portuguese.
 * @param {Object} item
 * @returns {boolean}
 */
export function isPortugueseItem(item) {
  if (!item) return false;
  if (
    item.lang === "pt" ||
    item.lang === "pt-PT" ||
    item.language === "pt" ||
    item.locale === "pt_PT"
  ) {
    return true;
  }
  const slug = (item.slug || "").trim();
  return PORTUGUESE_SLUGS.has(slug);
}
