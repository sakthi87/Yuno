export function nowIso() {
  return new Date().toISOString()
}

export function withProvenance(obj, source = 'ingest') {
  return {
    ...obj,
    source,
    collectedAt: obj.collectedAt || nowIso()
  }
}

export function stampProvenance(source = 'ingest') {
  return { source, collectedAt: nowIso() }
}
