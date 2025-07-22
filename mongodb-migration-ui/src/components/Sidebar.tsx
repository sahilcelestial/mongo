import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Stack, Text, Group, ThemeIcon } from '@mantine/core';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, exact }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      <Group
        sx={(theme) => ({
          padding: '10px 16px',
          borderRadius: theme.radius.sm,
          color: isActive ? theme.white : theme.colors.dark[0],
          backgroundColor: isActive ? theme.fn.darken(theme.colors.green[9], 0.2) : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? theme.fn.darken(theme.colors.green[9], 0.1) : theme.fn.darken(theme.colors.dark[9], 0.1),
          },
        })}
        spacing="md"
      >
        <ThemeIcon variant={isActive ? 'filled' : 'light'} color="green" size="md">
          {icon}
        </ThemeIcon>
        <Text weight={500} size="sm">{label}</Text>
      </Group>
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.colors.dark[9],
        color: theme.white,
        height: '100vh',
        width: 260,
        padding: theme.spacing.md,
      })}
    >
      <Box py="lg">
        <Text weight={700} size="xl" align="center" color="white" mb="xl">
          MongoDB Migration
        </Text>

        <Stack spacing="xs">
          <NavItem
            to="/"
            label="Dashboard"
            icon={<span>📊</span>}
            exact
          />
          <NavItem
            to="/setup"
            label="Connection Setup"
            icon={<span>🔌</span>}
          />
          <NavItem
            to="/analyze"
            label="Analyze Databases"
            icon={<span>🔍</span>}
          />
          <NavItem
            to="/migrate"
            label="Run Migration"
            icon={<span>🚀</span>}
          />
          <NavItem
            to="/logs"
            label="Migration Logs"
            icon={<span>📋</span>}
          />
          <NavItem
            to="/settings"
            label="Settings"
            icon={<span>⚙️</span>}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default Sidebar;