import { Stack, Title, Text, Tabs } from '@mantine/core'
import { AdminBookingsPage } from './AdminBookingsPage'
import { AdminEventTypesPage } from './AdminEventTypesPage'

export default function AdminPage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Admin Dashboard</Title>
        <Text c="dimmed">Manage your event types and bookings</Text>
      </div>

      <Tabs defaultValue="bookings">
        <Tabs.List>
          <Tabs.Tab value="bookings">Bookings</Tabs.Tab>
          <Tabs.Tab value="event-types">Event Types</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="bookings" pt="md">
          <AdminBookingsPage />
        </Tabs.Panel>

        <Tabs.Panel value="event-types" pt="md">
          <AdminEventTypesPage />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
