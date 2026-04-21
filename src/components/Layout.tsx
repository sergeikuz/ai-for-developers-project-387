import { Group, Anchor, Box } from '@mantine/core'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { IconCalendarEvent } from '@tabler/icons-react'

export default function Layout() {
  const location = useLocation()

  const navItems = [
    { label: 'Записаться', path: '/book' },
    { label: 'Админка', path: '/admin' },
  ]

  return (
    <>
      <Box style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Group h={60} px="xl" justify="space-between" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Anchor component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Group gap={8}>
              <IconCalendarEvent size={22} color="#f76707" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>Calendar</span>
            </Group>
          </Anchor>
          <Group gap="lg">
            {navItems.map((item) => (
              <Anchor
                key={item.path}
                component={Link}
                to={item.path}
                size="sm"
                c={
                  location.pathname === item.path ||
                  (item.path !== '/book' && location.pathname.startsWith(item.path))
                    ? 'violet'
                    : 'dimmed'
                }
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Anchor>
            ))}
          </Group>
        </Group>
      </Box>
      <Outlet />
    </>
  )
}
