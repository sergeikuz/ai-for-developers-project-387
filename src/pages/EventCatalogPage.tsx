import { Title, Text, Card, SimpleGrid, Badge, Box, Group } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useEventTypes } from '../api/hooks'

function HostAvatar() {
  return (
    <Box
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #fdba74 0%, #fdba74 50%, #2dd4bf 50%, #2dd4bf 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#fdba74',
          position: 'absolute',
          top: 8,
        }}
      />
    </Box>
  )
}

export default function EventCatalogPage() {
  const { data: eventTypes, isLoading, error } = useEventTypes()

  if (isLoading) {
    return (
      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <Text c="dimmed">Загрузка...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <Text c="red">Не удалось загрузить типы событий.</Text>
      </Box>
    )
  }

  return (
    <Box style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #fef3e2 40%, #f9fafb 100%)', minHeight: 'calc(100vh - 60px)' }}>
      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Host profile card */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          mb="xl"
          style={{
            background: '#fff',
            borderColor: '#e5e7eb',
          }}
        >
          <Group gap="md" mb="md" align="flex-start">
            <HostAvatar />
            <div>
              <Text fw={700} size="lg" style={{ color: '#0f172a' }}>Tota</Text>
              <Text size="sm" c="dimmed">Host</Text>
            </div>
          </Group>
          <Title order={2} mb={4} style={{ color: '#0f172a' }}>
            Выберите тип события
          </Title>
          <Text size="sm" c="dimmed">
            Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.
          </Text>
        </Card>

        {/* Event type cards */}
        {eventTypes && eventTypes.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {eventTypes.map((et) => (
              <Card
                key={et.id}
                component={Link}
                to={`/book/${et.id}`}
                padding="lg"
                radius="lg"
                withBorder
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  background: '#fff',
                  borderColor: '#e5e7eb',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={700} size="lg" style={{ color: '#0f172a' }}>
                      {et.title}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {et.description}
                    </Text>
                  </div>
                  <Badge
                    variant="light"
                    color="gray"
                    size="sm"
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    {et.duration} мин
                  </Badge>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed">Нет доступных типов событий.</Text>
        )}
      </Box>
    </Box>
  )
}
