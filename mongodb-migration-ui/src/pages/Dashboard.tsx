import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Grid, 
  Card, 
  Group, 
  Button,
  Stack,
  Paper, 
  ThemeIcon,
  SimpleGrid,
  useMantineTheme
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { MigrationStats } from '../types';

const Dashboard: React.FC = () => {
  const theme = useMantineTheme();
  const [recentMigrations, setRecentMigrations] = useState<MigrationStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);

  // For demo purposes, we'll mock some recent migrations
  useEffect(() => {
    const mockMigrations = [
      {
        startTime: new Date(Date.now() - 86400000), // 1 day ago
        endTime: new Date(Date.now() - 86395000),
        totalDatabases: 2,
        totalCollections: 15,
        totalDocuments: 125000,
        migratedDocuments: 125000,
        failedDocuments: 0,
        errors: [],
        elapsedTimeMs: 5000
      },
      {
        startTime: new Date(Date.now() - 172800000), // 2 days ago
        endTime: new Date(Date.now() - 172780000),
        totalDatabases: 1,
        totalCollections: 8,
        totalDocuments: 50000,
        migratedDocuments: 49980,
        failedDocuments: 20,
        errors: ['Failed to migrate 20 documents in collection users'],
        elapsedTimeMs: 20000
      }
    ] as MigrationStats[];
    
    setRecentMigrations(mockMigrations);
    
    // Try to load config to see if setup is complete
    apiService.loadConfig()
      .then(config => setHasConfig(!!config))
      .catch(() => setHasConfig(false))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <>
      <Title order={1} mb="md">Dashboard</Title>
      
      <SimpleGrid cols={3} spacing="lg" mb="xl">
        <Paper p="md" shadow="xs" sx={{ backgroundColor: theme.colors.blue[0] }}>
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Total Migrations
              </Text>
              <Text weight={700} size="xl">
                {recentMigrations.length}
              </Text>
            </div>
            <ThemeIcon color="blue" variant="light" size={40} radius="md">
              <span role="img" aria-label="database">🗃️</span>
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" shadow="xs" sx={{ backgroundColor: theme.colors.green[0] }}>
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Documents Migrated
              </Text>
              <Text weight={700} size="xl">
                {recentMigrations.reduce((acc, mig) => acc + mig.migratedDocuments, 0).toLocaleString()}
              </Text>
            </div>
            <ThemeIcon color="green" variant="light" size={40} radius="md">
              <span role="img" aria-label="document">📄</span>
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" shadow="xs" sx={{ backgroundColor: theme.colors.yellow[0] }}>
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Collections
              </Text>
              <Text weight={700} size="xl">
                {recentMigrations.reduce((acc, mig) => acc + mig.totalCollections, 0).toLocaleString()}
              </Text>
            </div>
            <ThemeIcon color="yellow" variant="light" size={40} radius="md">
              <span role="img" aria-label="folder">📂</span>
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>
      
      <Grid>
        <Grid.Col span={7}>
          <Paper p="md" shadow="xs">
            <Title order={3} mb="md">Recent Migrations</Title>
            
            {recentMigrations.length > 0 ? (
              <Stack spacing="md">
                {recentMigrations.map((migration, index) => (
                  <Card key={index} p="sm" withBorder>
                    <Group position="apart">
                      <div>
                        <Text weight={500}>
                          Migration {index + 1}
                        </Text>
                        <Text size="xs" color="dimmed">
                          {formatDate(migration.startTime)}
                        </Text>
                      </div>
                      <div>
                        <Text align="right">
                          {migration.migratedDocuments.toLocaleString()} documents
                        </Text>
                        <Text size="xs" color={migration.failedDocuments > 0 ? 'red' : 'green'} align="right">
                          {migration.failedDocuments > 0 ? 
                            `${migration.failedDocuments} failed` : 
                            'Completed successfully'}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text color="dimmed" italic>No migrations have been run yet.</Text>
            )}
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={5}>
          <Paper p="md" shadow="xs" mb="md">
            <Title order={3} mb="md">Quick Actions</Title>
            
            <Stack spacing="md">
              <Button 
                component={Link} 
                to="/setup"
                variant="outline"
                fullWidth
                leftIcon={<span>🔌</span>}
              >
                {hasConfig ? 'Edit Connection Settings' : 'Set Up Connections'}
              </Button>
              
              <Button 
                component={Link} 
                to="/analyze"
                variant="outline"
                fullWidth
                leftIcon={<span>🔍</span>}
                disabled={!hasConfig}
              >
                Analyze Source Database
              </Button>
              
              <Button 
                component={Link} 
                to="/migrate"
                color="green"
                fullWidth
                leftIcon={<span>🚀</span>}
                disabled={!hasConfig}
              >
                Start New Migration
              </Button>
            </Stack>
          </Paper>
          
          <Paper p="md" shadow="xs">
            <Title order={3} mb="md">Help & Resources</Title>
            
            <Stack spacing="md">
              <Text size="sm">
                <strong>Documentation:</strong> Refer to the README.md file for full documentation on using the MongoDB Migration Tool.
              </Text>
              
              <Text size="sm">
                <strong>Support:</strong> For issues or questions, please create an issue in the project repository.
              </Text>
              
              <Text size="sm">
                <strong>Best Practices:</strong> Always analyze your source database first and perform a dry run before executing a production migration.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </>
  );
};

export default Dashboard;