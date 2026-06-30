import { supabase } from './supabase'
import { buildLegacyTeamValue } from './reservationRecord'

function isMissingModernReservationContract(error) {
  const message = String(error?.message || '').toLowerCase()

  return (
    message.includes('create_reservation_v3') ||
    message.includes('create_reservation_v2') ||
    message.includes('phone_number') ||
    message.includes('maximum_delivery_date') ||
    message.includes('position') ||
    message.includes('size') ||
    message.includes('schema cache')
  )
}

function toReservationError(error) {
  const message = String(error?.message || '')

  if (message.toLowerCase().includes('insufficient stock')) {
    return new Error('The requested quantity is no longer available.')
  }

  return new Error(message || 'Unable to submit your order right now.')
}

async function submitModernReservation(payload) {
  const { error } = await supabase.rpc('create_reservation_v3', {
    p_item_id: payload.itemId,
    p_full_name: payload.name,
    p_position: payload.position,
    p_size: payload.size || null,
    p_quantity: payload.quantity,
    p_phone_number: payload.phoneNumber,
    p_maximum_delivery_date: payload.maximumDeliveryDate,
  })

  if (error) {
    throw error
  }

  return { mode: 'modern' }
}

async function submitLegacyReservation(payload) {
  const { error } = await supabase.rpc('create_reservation', {
    p_item_id: payload.itemId,
    p_full_name: payload.name,
    p_email: payload.phoneNumber,
    p_team: buildLegacyTeamValue(payload.position, payload.maximumDeliveryDate, payload.size),
    p_quantity: payload.quantity,
  })

  if (error) {
    throw error
  }

  return { mode: 'legacy' }
}

async function submitModernReservationV2(payload) {
  const { error } = await supabase.rpc('create_reservation_v2', {
    p_item_id: payload.itemId,
    p_full_name: payload.name,
    p_position: payload.position,
    p_quantity: payload.quantity,
    p_phone_number: payload.phoneNumber,
    p_maximum_delivery_date: payload.maximumDeliveryDate,
  })

  if (error) {
    throw error
  }

  return { mode: 'modern-v2' }
}

export async function submitReservation(payload) {
  if (!supabase) {
    throw new Error('Database connection is not configured.')
  }

  try {
    return await submitModernReservation(payload)
  } catch (error) {
    if (!isMissingModernReservationContract(error)) {
      throw toReservationError(error)
    }
  }

  try {
    return await submitLegacyReservation(payload)
  } catch (error) {
    if (!isMissingModernReservationContract(error)) {
      throw toReservationError(error)
    }
  }

  try {
    return await submitModernReservationV2(payload)
  } catch (error) {
    throw toReservationError(error)
  }
}
