/** Fetch every page, including when the server applies a lower row cap than
 * requested. Offset advances by rows received, never by the requested size. */
export async function loadNearbyPages<T extends { id: string }>(
  read: (offset: number) => Promise<{ rows: T[]; total: number | null }>,
  cancelled: () => boolean = () => false,
): Promise<T[]> {
  let offset = 0
  const rows = new Map<string, T>()
  while (!cancelled()) {
    const page = await read(offset)
    if (!page.rows.length) break
    const before = rows.size
    for (const row of page.rows) rows.set(row.id, row)
    offset += page.rows.length
    if (page.total != null && offset >= page.total) break
    if (rows.size === before) throw new Error('Parking pagination stalled. Please retry.')
  }
  return [...rows.values()]
}
