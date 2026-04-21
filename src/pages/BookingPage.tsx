import { useState } from 'react'
import {
  Stack, Title, Text, Card, Group, Button, Loader, Center, TextInput,
  Badge, Box, SimpleGrid, Divider, Modal,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { notifications } from '@mantine/notifications'
import { useSlots, useCreateBooking, useEventTypes } from '../api/hooks'

dayjs.locale('ru')

const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function HostAvatar() {
  return (
    <Box style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #fdba74 0%, #fdba74 50%, #2dd4bf 50%, #2dd4bf 100%)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fdba74',
        }}
      />
    </Box>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <Box style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px' }}>
      <Text size="xs" c="dimmed" mb={2}>{label}</Text>
      <Text size="sm" fw={500} style={{ color: '#0f172a' }}>{value}</Text>
    </Box>
  )
}

function CalendarGrid({
  currentDate,
  selectedDate,
  slotsByDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  currentDate: dayjs.Dayjs
  selectedDate: string | null
  slotsByDate: Record<string, { total: number; available: number }>
  onSelectDate: (d: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  const startOfMonth = currentDate.startOf('month')
  const endOfMonth = currentDate.endOf('month')
  const startDay = (startOfMonth.day() + 6) % 7
  const daysInMonth = endOfMonth.date()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Card padding="lg" radius="lg" withBorder style={{ flex: 1, minWidth: 280, background: '#fff', borderColor: '#e5e7eb' }}>
      <Group justify="space-between" mb="md">
        <Title order={4} style={{ color: '#0f172a' }}>Календарь</Title>
        <Group gap={4}>
          <Button variant="outline" size="xs" radius="sm" onClick={onPrevMonth} style={{ borderColor: '#e5e7eb', color: '#374151' }}>←</Button>
          <Button variant="outline" size="xs" radius="sm" onClick={onNextMonth} style={{ borderColor: '#e5e7eb', color: '#374151' }}>→</Button>
        </Group>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        {MONTHS_RU[currentDate.month()]} {currentDate.year()} г.
      </Text>
      <SimpleGrid cols={7} spacing={4} verticalSpacing={4}>
        {DAYS_RU.map((d) => (
          <Text key={d} ta="center" size="xs" fw={600} c="dimmed" py={4}>
            {d}
          </Text>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <Box key={idx} />
          const dateStr = currentDate.date(day).format('YYYY-MM-DD')
          const info = slotsByDate[dateStr]
          const isSelected = selectedDate === dateStr
          return (
            <Box
              key={idx}
              data-testid={`calendar-day-${dateStr}`}
              onClick={() => onSelectDate(dateStr)}
              style={{
                borderRadius: 8,
                padding: '6px 2px',
                minHeight: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: isSelected ? '#fff7ed' : '#f1f5f9',
                border: isSelected ? '2px solid #f97316' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              <Text size="sm" fw={isSelected ? 700 : 500} c={isSelected ? 'orange' : 'dark'}>
                {day}
              </Text>
              {info && (
                <Text size="xs" c={isSelected ? 'orange' : 'dimmed'} style={{ opacity: 0.7 }}>
                  {info.available} св.
                </Text>
              )}
            </Box>
          )
        })}
      </SimpleGrid>
    </Card>
  )
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ startAt: string; endAt: string } | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(dayjs())
  const [formOpened, setFormOpened] = useState(false)

  const { data: eventTypes } = useEventTypes()
  const eventType = eventTypes?.find((et) => et.id === id)
  const { data: slots, isLoading: slotsLoading } = useSlots(id || '')
  const createBooking = useCreateBooking()

  const form = useForm({
    initialValues: { guestName: '', guestEmail: '' },
    validate: {
      guestName: (val) => (val.length > 0 ? null : 'Имя обязательно'),
      guestEmail: (val) => (/^\S+@\S+$/.test(val) ? null : 'Некорректный email'),
    },
  })

  if (!eventType) {
    return slotsLoading ? (
      <Center style={{ height: '60vh' }}><Loader size="lg" /></Center>
    ) : (
      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <Text c="red">Тип события не найден.</Text>
      </Box>
    )
  }

  const slotsByDate = slots?.reduce<Record<string, { total: number; available: number }>>((acc, slot) => {
    const dateKey = dayjs(slot.startAt).format('YYYY-MM-DD')
    if (!acc[dateKey]) acc[dateKey] = { total: 0, available: 0 }
    acc[dateKey].total++
    if (slot.isAvailable) acc[dateKey].available++
    return acc
  }, {}) || {}

  const availableSlots = selectedDate
    ? slots?.filter((s) => dayjs(s.startAt).format('YYYY-MM-DD') === selectedDate && s.isAvailable) || []
    : []

  const bookedSlots = selectedDate
    ? slots?.filter((s) => dayjs(s.startAt).format('YYYY-MM-DD') === selectedDate && !s.isAvailable) || []
    : []

  const allSlotsForDate = [...bookedSlots, ...availableSlots].sort(
    (a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
  )

  const selectedDateFormatted = selectedDate
    ? dayjs(selectedDate).format('dddd, D MMMM').replace(/^./, (c) => c.toUpperCase())
    : ''

  const handleSubmit = form.onSubmit((values) => {
    if (!selectedSlot || !id) return
    createBooking.mutate(
      { eventTypeId: id, startAt: selectedSlot.startAt, guestName: values.guestName, guestEmail: values.guestEmail },
      {
        onSuccess: () => {
          notifications.show({ title: 'Успех', message: 'Встреча забронирована!' })
          navigate('/book')
        },
        onError: () => notifications.show({ title: 'Ошибка', message: 'Не удалось забронировать', color: 'red' }),
      },
    )
  })

  return (
    <Box style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #fef3e2 40%, #f9fafb 100%)', minHeight: 'calc(100vh - 60px)' }}>
      <Box style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <Title order={2} mb="xl" style={{ color: '#0f172a' }}>{eventType.title}</Title>

        {slotsLoading ? (
          <Center style={{ height: '40vh' }}><Loader size="lg" /></Center>
        ) : (
          <Group align="flex-start" gap="md" wrap="nowrap" visibleFrom="sm">
            {/* Left column: info */}
            <Card padding="lg" radius="lg" withBorder style={{ width: 280, flexShrink: 0, background: '#fff', borderColor: '#e5e7eb' }}>
              <Group gap="md" mb="md">
                <HostAvatar />
                <div>
                  <Text fw={700} style={{ color: '#0f172a' }}>Tota</Text>
                  <Text size="xs" c="dimmed">Host</Text>
                </div>
              </Group>
              <Group gap="xs" mb="sm">
                <Text fw={700} style={{ color: '#0f172a' }}>{eventType.title}</Text>
                <Badge variant="light" color="gray" size="sm" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  {eventType.duration} мин
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mb="md">{eventType.description}</Text>
              <InfoBox label="Выбранная дата" value={selectedDateFormatted || '—'} />
              <Box mt="sm" />
              <InfoBox label="Выбранное время" value={
                selectedSlot
                  ? `${dayjs(selectedSlot.startAt).format('HH:mm')} – ${dayjs(selectedSlot.endAt).format('HH:mm')}`
                  : 'Время не выбрано'
              } />
            </Card>

            {/* Middle column: calendar */}
            <CalendarGrid
              currentDate={calendarMonth}
              selectedDate={selectedDate}
              slotsByDate={slotsByDate}
              onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null) }}
              onPrevMonth={() => setCalendarMonth((m) => m.subtract(1, 'month'))}
              onNextMonth={() => setCalendarMonth((m) => m.add(1, 'month'))}
            />

            {/* Right column: slots */}
            <Card padding="lg" radius="lg" withBorder style={{ width: 280, flexShrink: 0, background: '#fff', borderColor: '#e5e7eb' }}>
              <Title order={4} mb="md" style={{ color: '#0f172a' }}>Статус слотов</Title>
              <Stack gap="xs">
                {allSlotsForDate.length > 0 ? (
                  allSlotsForDate.map((slot) => {
                    const isSelected = selectedSlot?.startAt === slot.startAt
                    return (
                      <Box
                        key={slot.startAt}
                        data-testid={`slot-${slot.startAt}`}
                        data-available={slot.isAvailable}
                        onClick={() => slot.isAvailable && setSelectedSlot({ startAt: slot.startAt, endAt: slot.endAt })}
                        style={{
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: isSelected ? '#fff7ed' : '#f1f5f9',
                          border: isSelected ? '2px solid #f97316' : '1px solid #e5e7eb',
                          cursor: slot.isAvailable ? 'pointer' : 'default',
                          opacity: slot.isAvailable ? 1 : 0.6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.1s',
                        }}
                      >
                        <Text size="sm" fw={500} c={slot.isAvailable ? 'dark' : 'dimmed'}>
                          {dayjs(slot.startAt).format('HH:mm')} - {dayjs(slot.endAt).format('HH:mm')}
                        </Text>
                        <Text size="xs" fw={600} c={slot.isAvailable ? 'dark' : 'dimmed'} data-testid={slot.isAvailable ? 'slot-available' : 'slot-booked'}>
                          {slot.isAvailable ? 'Свободно' : 'Занято'}
                        </Text>
                      </Box>
                    )
                  })
                ) : (
                  <Text c="dimmed" size="sm">Выберите дату</Text>
                )}
              </Stack>
              <Divider my="md" />
              <Group grow>
                <Button variant="outline" radius="md" onClick={() => navigate('/book')} style={{ borderColor: '#e5e7eb', color: '#0f172a', fontWeight: 600 }}>
                  Назад
                </Button>
                <Button
                  color="orange"
                  radius="md"
                  disabled={!selectedSlot}
                  onClick={() => setFormOpened(true)}
                  style={{ fontWeight: 600 }}
                >
                  Продолжить
                </Button>
              </Group>
            </Card>
          </Group>
        )}

        {/* Mobile layout */}
        <Stack gap="md" hiddenFrom="sm">
          <Card padding="lg" radius="lg" withBorder style={{ background: '#fff', borderColor: '#e5e7eb' }}>
            <Group gap="md" mb="md">
              <HostAvatar />
              <div><Text fw={700} style={{ color: '#0f172a' }}>Tota</Text><Text size="xs" c="dimmed">Host</Text></div>
            </Group>
            <Group gap="xs"><Text fw={700} style={{ color: '#0f172a' }}>{eventType.title}</Text><Badge variant="light" color="gray" size="sm" style={{ background: '#f1f5f9', color: '#64748b' }}>{eventType.duration} мин</Badge></Group>
          </Card>
          <CalendarGrid
            currentDate={calendarMonth}
            selectedDate={selectedDate}
            slotsByDate={slotsByDate}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null) }}
            onPrevMonth={() => setCalendarMonth((m) => m.subtract(1, 'month'))}
            onNextMonth={() => setCalendarMonth((m) => m.add(1, 'month'))}
          />
          <Card padding="lg" radius="lg" withBorder style={{ background: '#fff', borderColor: '#e5e7eb' }}>
            <Title order={4} mb="md" style={{ color: '#0f172a' }}>Статус слотов</Title>
            <Stack gap="xs">
              {allSlotsForDate.length > 0 ? allSlotsForDate.map((slot) => {
                const isSelected = selectedSlot?.startAt === slot.startAt
                return (
                  <Box key={slot.startAt} data-testid={`slot-${slot.startAt}`} data-available={slot.isAvailable} onClick={() => slot.isAvailable && setSelectedSlot({ startAt: slot.startAt, endAt: slot.endAt })} style={{ borderRadius: 8, padding: '8px 12px', background: isSelected ? '#fff7ed' : '#f1f5f9', border: isSelected ? '2px solid #f97316' : '1px solid #e5e7eb', cursor: slot.isAvailable ? 'pointer' : 'default', opacity: slot.isAvailable ? 1 : 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="sm" fw={500} c={slot.isAvailable ? 'dark' : 'dimmed'}>{dayjs(slot.startAt).format('HH:mm')} - {dayjs(slot.endAt).format('HH:mm')}</Text>
                    <Text size="xs" fw={600} c={slot.isAvailable ? 'dark' : 'dimmed'} data-testid={slot.isAvailable ? 'slot-available' : 'slot-booked'}>{slot.isAvailable ? 'Свободно' : 'Занято'}</Text>
                  </Box>
                )
              }) : <Text c="dimmed" size="sm">Выберите дату</Text>}
            </Stack>
            <Divider my="md" />
            <Group grow>
              <Button variant="outline" radius="md" onClick={() => navigate('/book')} style={{ borderColor: '#e5e7eb', color: '#0f172a', fontWeight: 600 }}>Назад</Button>
              <Button color="orange" radius="md" disabled={!selectedSlot} onClick={() => setFormOpened(true)} style={{ fontWeight: 600 }}>Продолжить</Button>
            </Group>
          </Card>
        </Stack>

        {/* Booking form modal */}
        <Modal opened={formOpened} onClose={() => setFormOpened(false)} title="Данные для записи" size="sm">
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput label="Имя" placeholder="Ваше имя" {...form.getInputProps('guestName')} />
              <TextInput label="Email" placeholder="email@example.com" {...form.getInputProps('guestEmail')} />
              <Button type="submit" color="orange" loading={createBooking.isPending} fullWidth style={{ fontWeight: 600 }}>
                Забронировать
              </Button>
            </Stack>
          </form>
        </Modal>
      </Box>
    </Box>
  )
}
