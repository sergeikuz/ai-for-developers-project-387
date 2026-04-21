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
        background: 'linear-gradient(180deg, var(--app-avatar-orange) 0%, var(--app-avatar-orange) 50%, var(--app-avatar-teal) 50%, var(--app-avatar-teal) 100%)',
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
          background: 'var(--app-avatar-orange)',
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
    <Box style={{ background: 'linear-gradient(135deg, var(--app-gradient-start) 0%, var(--app-gradient-mid) 40%, var(--app-gradient-end) 100%)', minHeight: 'calc(100vh - 60px)' }}>
      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Host profile card */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          mb="xl"
          style={{
            background: 'var(--app-card-bg)',
            borderColor: 'var(--app-card-border)',
          }}
        >
          <Group gap="md" mb="md" align="flex-start">
            <HostAvatar />
            <div>
              <Text fw={700} size="lg" style={{ color: 'var(--app-text-primary)' }}>Tota</Text>
              <Text size="sm" c="dimmed">Host</Text>
            </div>
          </Group>
          <Title order={2} mb={4} style={{ color: 'var(--app-text-primary)' }}>
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
                  background: 'var(--app-card-bg)',
                  borderColor: 'var(--app-card-border)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--app-card-border-hover)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--app-card-border)'
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={700} size="lg" style={{ color: 'var(--app-text-primary)' }}>
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
                    background: 'var(--app-surface-muted)',
                    color: 'var(--app-text-secondary)',
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
