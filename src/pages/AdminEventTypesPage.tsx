import { useState } from 'react'
import { Stack, Table, Text, Loader, Center, Group, Button, Modal, TextInput, NumberInput, ActionIcon } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useAdminEventTypes, useCreateEventType, useUpdateEventType, useDeleteEventType } from '../api/hooks'

export function AdminEventTypesPage() {
  const { data: eventTypes, isLoading, error } = useAdminEventTypes()
  const createEventType = useCreateEventType()
  const updateEventType = useUpdateEventType()
  const deleteEventType = useDeleteEventType()
  const [modalOpened, setModalOpened] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm({
    initialValues: {
      id: '',
      title: '',
      description: '',
      duration: 30,
    },
    validate: {
      id: (val) => (val.length > 0 ? null : 'ID is required'),
      title: (val) => (val.length > 0 ? null : 'Title is required'),
      duration: (val) => (val > 0 ? null : 'Duration must be positive'),
    },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset()
    form.setFieldValue('id', `event-${Date.now()}`)
    setModalOpened(true)
  }

  const openEdit = (et: { id: string; title: string; description: string; duration: number }) => {
    setEditingId(et.id)
    form.setValues({ id: et.id, title: et.title, description: et.description, duration: et.duration })
    setModalOpened(true)
  }

  const handleSubmit = form.onSubmit((values) => {
    if (editingId) {
      updateEventType.mutate(
        { id: editingId, body: { title: values.title, description: values.description, duration: values.duration } },
        {
          onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Event type updated' })
            setModalOpened(false)
          },
          onError: () => notifications.show({ title: 'Error', message: 'Failed to update', color: 'red' }),
        },
      )
    } else {
      createEventType.mutate(values, {
        onSuccess: () => {
          notifications.show({ title: 'Success', message: 'Event type created' })
          setModalOpened(false)
        },
        onError: () => notifications.show({ title: 'Error', message: 'Failed to create', color: 'red' }),
      })
    }
  })

  const handleDelete = (id: string) => {
    deleteEventType.mutate(id, {
      onSuccess: () => notifications.show({ title: 'Success', message: 'Event type deleted' }),
      onError: () => notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' }),
    })
  }

  if (isLoading) {
    return (
      <Center style={{ height: '40vh' }}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (error) {
    return <Text c="red">Failed to load event types.</Text>
  }

  const rows = eventTypes?.map((et) => (
    <Table.Tr key={et.id}>
      <Table.Td>
        <Text fw={500}>{et.title}</Text>
        <Text size="xs" c="dimmed">{et.id}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{et.description}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{et.duration} min</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(et)}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(et.id)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Event Types ({eventTypes?.length || 0})</Text>
        <Button onClick={openCreate}>Add Event Type</Button>
      </Group>

      {eventTypes && eventTypes.length > 0 ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed">No event types yet. Create one to get started.</Text>
      )}

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={editingId ? 'Edit Event Type' : 'Create Event Type'}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="ID" placeholder="meeting-30min" {...form.getInputProps('id')} disabled={!!editingId} />
            <TextInput label="Title" placeholder="30-min Meeting" {...form.getInputProps('title')} />
            <TextInput label="Description" placeholder="A quick sync meeting" {...form.getInputProps('description')} />
            <NumberInput label="Duration (min)" min={1} {...form.getInputProps('duration')} />
            <Button type="submit" loading={createEventType.isPending || updateEventType.isPending} fullWidth>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  )
}
