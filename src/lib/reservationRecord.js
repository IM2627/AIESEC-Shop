export function buildLegacyTeamValue(position, maximumDeliveryDate, size = '') {
  return JSON.stringify({
    position: position.trim(),
    maximumDeliveryDate,
    size,
  })
}

function parseLegacyTeamValue(teamValue) {
  if (!teamValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(teamValue)
    return typeof parsedValue === 'object' && parsedValue !== null ? parsedValue : {}
  } catch {
    return { position: teamValue }
  }
}

export function normalizeReservationRecord(reservation) {
  const legacyMeta = parseLegacyTeamValue(reservation.team)

  return {
    ...reservation,
    position: reservation.position || legacyMeta.position || '',
    size: reservation.size || legacyMeta.size || '',
    phone_number: reservation.phone_number || reservation.email || '',
    maximum_delivery_date:
      reservation.maximum_delivery_date || legacyMeta.maximumDeliveryDate || '',
  }
}
