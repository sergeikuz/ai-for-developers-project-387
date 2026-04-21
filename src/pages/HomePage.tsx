import { Stack, Title, Text, Button, Card, Badge, Group, Box } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconArrowRight } from '@tabler/icons-react'

export default function HomePage() {
  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, var(--app-gradient-start) 0%, var(--app-gradient-mid) 40%, var(--app-gradient-end) 100%)',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <Box style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <Group align="flex-start" gap={80} wrap="nowrap" visibleFrom="sm">
          <Stack gap="xl" style={{ flex: 1 }}>
            <Badge
              variant="light"
              color="orange"
              size="md"
              style={{ borderRadius: 20, alignSelf: 'flex-start' }}
            >
              БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
            </Badge>
            <Title order={1} size="h1" style={{ fontSize: 48, fontWeight: 800 }}>
              Calendar
            </Title>
            <Text size="lg" c="dimmed" style={{ maxWidth: 480 }}>
              Забронируйте встречу за минуту: выберите тип события и удобное время.
            </Text>
            <Button
              component={Link}
              to="/book"
              size="lg"
              color="orange"
              radius="md"
              rightSection={<IconArrowRight size={18} />}
              style={{ alignSelf: 'flex-start', fontWeight: 600 }}
            >
              Записаться
            </Button>
          </Stack>

          <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            withBorder
            style={{ flex: 1, maxWidth: 520, background: 'var(--app-card-overlay)' }}
          >
            <Title order={3} mb="md">
              Возможности
            </Title>
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                • Выбор типа события и удобного времени для встречи.
              </Text>
              <Text size="sm" c="dimmed">
                • Быстрое бронирование с подтверждением и дополнительными заметками.
              </Text>
              <Text size="sm" c="dimmed">
                • Управление типами встреч и просмотр предстоящих записей в админке.
              </Text>
            </Stack>
          </Card>
        </Group>

        <Stack gap="xl" hiddenFrom="sm" style={{ marginTop: 32 }}>
          <Badge variant="light" color="orange" size="md" style={{ borderRadius: 20, alignSelf: 'flex-start' }}>
            БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
          </Badge>
          <Title order={1} size="h1">Calendar</Title>
          <Text c="dimmed">Забронируйте встречу за минуту: выберите тип события и удобное время.</Text>
          <Button component={Link} to="/book" size="lg" color="orange" radius="md" rightSection={<IconArrowRight size={18} />} fullWidth>
            Записаться
          </Button>
          <Card shadow="sm" padding="xl" radius="lg" withBorder>
            <Title order={3} mb="md">Возможности</Title>
            <Stack gap="sm">
              <Text size="sm" c="dimmed">• Выбор типа события и удобного времени для встречи.</Text>
              <Text size="sm" c="dimmed">• Быстрое бронирование с подтверждением и дополнительными заметками.</Text>
              <Text size="sm" c="dimmed">• Управление типами встреч и просмотр предстоящих записей в админке.</Text>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
