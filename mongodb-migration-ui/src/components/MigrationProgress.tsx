import React from 'react';
import {
  Paper,
  Text,
  Progress,
  Group,
  Badge,
  Stack,
  Box,
  Alert,
  Divider
} from '@mantine/core';
import { MigrationProgress, MigrationStats } from '../types';

interface MigrationProgressProps {
  progress: MigrationProgress;
  stats: MigrationStats;
  isRunning: boolean;
}

const MigrationProgressComponent: React.FC<MigrationProgressProps> = ({
  progress,
  stats,
  isRunning
}) => {
  // Calculate overall progress
  const overallProgress = stats.totalDocuments > 0
    ? (stats.migratedDocuments / stats.totalDocuments) * 100
    : 0;

  // Format elapsed time
  const formatElapsedTime = () => {
    if (!stats.elapsedTimeMs) return '00:00:00';
    
    const totalSeconds = Math.floor(stats.elapsedTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <Paper p="md" shadow="xs">
      <Group position="apart" mb="md">
        <Text weight={500} size="lg">Migration Progress</Text>
        <Badge 
          color={isRunning ? 'green' : stats.endTime ? 'blue' : 'yellow'}
          variant="filled"
          size="lg"
        >
          {isRunning ? 'RUNNING' : stats.endTime ? 'COMPLETED' : 'PENDING'}
        </Badge>
      </Group>

      <Stack spacing="md">
        <Box>
          <Group position="apart" mb={5}>
            <Text size="sm">Overall Progress</Text>
            <Text size="sm" weight={500}>{overallProgress.toFixed(1)}%</Text>
          </Group>
          <Progress 
            value={overallProgress} 
            color="green" 
            size="xl" 
            radius="sm" 
            animate={isRunning}
          />
        </Box>
        
        {isRunning && progress && (
          <>
            <Divider />
            <Text weight={500} size="sm">Current Operation</Text>
            
            <Group position="apart" mb={0} spacing="xs">
              <Text size="sm">
                {progress.database}.{progress.collection}
              </Text>
              <Text size="sm" weight={500}>
                {progress.processedDocuments.toLocaleString()} / {progress.totalDocuments.toLocaleString()} documents 
                ({progress.percentage.toFixed(1)}%)
              </Text>
            </Group>
            <Progress 
              value={progress.percentage} 
              color="blue" 
              size="md" 
              radius="sm" 
              animate
            />
          </>
        )}
        
        <Divider />
        
        <Group grow>
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Databases</Text>
            <Text weight={500}>{stats.totalDatabases}</Text>
          </Paper>
          
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Collections</Text>
            <Text weight={500}>{stats.totalCollections}</Text>
          </Paper>
          
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Total Documents</Text>
            <Text weight={500}>{stats.totalDocuments.toLocaleString()}</Text>
          </Paper>
        </Group>
        
        <Group grow>
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Migrated</Text>
            <Text weight={500} color="green">{stats.migratedDocuments.toLocaleString()}</Text>
          </Paper>
          
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Failed</Text>
            <Text weight={500} color="red">{stats.failedDocuments.toLocaleString()}</Text>
          </Paper>
          
          <Paper withBorder p="xs">
            <Text size="xs" color="dimmed">Elapsed Time</Text>
            <Text weight={500}>{formatElapsedTime()}</Text>
          </Paper>
        </Group>
        
        {stats.errors.length > 0 && (
          <Alert color="red" title="Migration Errors">
            <Box sx={{ maxHeight: '150px', overflow: 'auto' }}>
              {stats.errors.map((error, index) => (
                <Text size="xs" key={index} mb={5}>• {error}</Text>
              ))}
            </Box>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default MigrationProgressComponent;