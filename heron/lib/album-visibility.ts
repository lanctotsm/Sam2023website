/** Public album lists and pages show published albums. Missing status is the pre-migration shape. */
export function isAlbumPubliclyVisible(album: { status?: string | null }): boolean {
  return (album.status ?? "published") === "published";
}
