import { Group, Anchor, Box, ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { IconCalendarEvent, IconSun, IconMoon } from '@tabler/icons-react'

export default function Layout() {
  const location = useLocation()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

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
              <IconCalendarEvent size={22} color="var(--app-accent-icon)" />
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
                    ? 'orange'
                    : 'dimmed'
                }
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Anchor>
            ))}
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              aria-label="Переключить тему"
            >
              {computedColorScheme === 'dark' ? (
                <IconSun size={20} color="var(--app-text-primary)" />
              ) : (
                <IconMoon size={20} color="var(--app-text-primary)" />
              )}
            </ActionIcon>
          </Group>
        </Group>
      </Box>
      <Outlet />
    </>
  )
}
