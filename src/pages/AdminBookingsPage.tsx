import { Table, Text, Loader, Center, Badge, Group } from '@mantine/core'
import dayjs from 'dayjs'
import { useBookings } from '../api/hooks'

export function AdminBookingsPage() {
  const { data: bookings, isLoading, error } = useBookings()

  if (isLoading) {
    return (
      <Center style={{ height: '40vh' }}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (error) {
    return <Text c="red">Failed to load bookings.</Text>
  }

  if (!bookings || bookings.length === 0) {
    return <Text c="dimmed">No bookings yet.</Text>
  }

  const rows = bookings.map((booking) => (
    <Table.Tr key={booking.id}>
      <Table.Td>
        <Text fw={500}>{booking.guestName}</Text>
        <Text size="xs" c="dimmed">{booking.guestEmail}</Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light">{booking.eventTitle}</Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Text size="sm">{dayjs(booking.startAt).format('MMM D, YYYY HH:mm')}</Text>
          <Text c="dimmed">→</Text>
          <Text size="sm">{dayjs(booking.endAt).format('HH:mm')}</Text>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Guest</Table.Th>
          <Table.Th>Event</Table.Th>
          <Table.Th>Time</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  )
}
