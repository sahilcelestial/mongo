import React, { ReactNode } from 'react';
import { AppShell, Header, Text, Box, Group } from '@mantine/core';
import Sidebar from '../components/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <AppShell
      padding="md"
      navbar={<Sidebar />}
      header={
        <Header height={60} p="xs" sx={(theme) => ({
          backgroundColor: theme.white,
          borderBottom: `1px solid ${theme.colors.gray[2]}`,
        })}>
          <Group position="apart" sx={{ height: '100%' }}>
            <Group>
              <Text size="lg" weight={700} color="green">MongoDB Migration Tool</Text>
            </Group>
          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colors.gray[0],
        },
      })}
    >
      <Box sx={{ padding: '16px' }}>
        {children}
      </Box>
    </AppShell>
  );
};

export default MainLayout;