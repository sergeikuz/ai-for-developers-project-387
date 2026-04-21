import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OwnerService, GuestService, type CreateBookingRequest, type CreateEventTypeRequest, type UpdateEventTypeRequest } from '../api'

export function useEventTypes() {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: () => GuestService.eventTypesPublicListEventTypes(),
  })
}

export function useAdminEventTypes() {
  return useQuery({
    queryKey: ['admin', 'event-types'],
    queryFn: () => OwnerService.eventTypesAdminListEventTypes(),
  })
}

export function useCreateEventType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEventTypeRequest) => OwnerService.eventTypesAdminCreateEventType(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'event-types'] })
      qc.invalidateQueries({ queryKey: ['event-types'] })
    },
  })
}

export function useUpdateEventType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEventTypeRequest }) =>
      OwnerService.eventTypesAdminUpdateEventType(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'event-types'] })
      qc.invalidateQueries({ queryKey: ['event-types'] })
    },
  })
}

export function useDeleteEventType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => OwnerService.eventTypesAdminDeleteEventType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'event-types'] })
      qc.invalidateQueries({ queryKey: ['event-types'] })
    },
  })
}

export function useBookings() {
  return useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => OwnerService.bookingsAdminListBookings(),
  })
}

export function useSlots(eventTypeId: string) {
  return useQuery({
    queryKey: ['slots', eventTypeId],
    queryFn: () => GuestService.slotsGetAvailableSlots(eventTypeId),
    enabled: !!eventTypeId,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBookingRequest) => GuestService.bookingsPublicCreateBooking(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] })
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    },
  })
}
