import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Paper, 
  Select, 
  Code,
  Stack,
  Group,
  Button,
  TextInput,
  Accordion,
  Divider
} from '@mantine/core';

const Logs: React.FC = () => {
  const [selectedLogType, setSelectedLogType] = useState<string>('migration');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Generate mock logs for demonstration
  useEffect(() => {
    const mockLogs = [
      `[${selectedDate}T09:15:23.456Z] [INFO] Migration started - Source: mongodb://localhost:27017/products`,
      `[${selectedDate}T09:15:24.123Z] [INFO] Connected to source database: products`,
      `[${selectedDate}T09:15:25.789Z] [INFO] Connected to target database: mongodb://target-server:27017/products`,
      `[${selectedDate}T09:15:26.321Z] [INFO] Analyzing collection: items (10000 documents)`,
      `[${selectedDate}T09:15:30.654Z] [INFO] Migrating collection: items - Batch 1/10`,
      `[${selectedDate}T09:15:35.987Z] [INFO] Migrated 1000/10000 documents (10%)`,
      `[${selectedDate}T09:15:40.123Z] [INFO] Migrating collection: items - Batch 2/10`,
      `[${selectedDate}T09:15:45.456Z] [INFO] Migrated 2000/10000 documents (20%)`,
      `[${selectedDate}T09:15:50.789Z] [INFO] Migrating collection: items - Batch 3/10`,
      `[${selectedDate}T09:15:55.321Z] [INFO] Migrated 3000/10000 documents (30%)`,
      `[${selectedDate}T09:16:00.654Z] [INFO] Migrating collection: items - Batch 4/10`,
      `[${selectedDate}T09:16:05.987Z] [INFO] Migrated 4000/10000 documents (40%)`,
      `[${selectedDate}T09:16:10.123Z] [INFO] Migrating collection: items - Batch 5/10`,
      `[${selectedDate}T09:16:15.456Z] [INFO] Migrated 5000/10000 documents (50%)`,
      `[${selectedDate}T09:16:20.789Z] [INFO] Migrating collection: items - Batch 6/10`,
      `[${selectedDate}T09:16:25.321Z] [INFO] Migrated 6000/10000 documents (60%)`,
      `[${selectedDate}T09:16:30.654Z] [INFO] Migrating collection: items - Batch 7/10`,
      `[${selectedDate}T09:16:35.987Z] [INFO] Migrated 7000/10000 documents (70%)`,
      `[${selectedDate}T09:16:40.123Z] [INFO] Migrating collection: items - Batch 8/10`,
      `[${selectedDate}T09:16:45.456Z] [INFO] Migrated 8000/10000 documents (80%)`,
      `[${selectedDate}T09:16:50.789Z] [INFO] Migrating collection: items - Batch 9/10`,
      `[${selectedDate}T09:16:55.321Z] [INFO] Migrated 9000/10000 documents (90%)`,
      `[${selectedDate}T09:17:00.654Z] [INFO] Migrating collection: items - Batch 10/10`,
      `[${selectedDate}T09:17:05.987Z] [INFO] Migrated 10000/10000 documents (100%)`,
      `[${selectedDate}T09:17:06.123Z] [INFO] Migration of collection items completed successfully`,
      `[${selectedDate}T09:17:06.456Z] [INFO] Verifying migration integrity...`,
      `[${selectedDate}T09:17:08.789Z] [INFO] Migration completed successfully!`
    ];
    
    const errorLogs = [
      `[${selectedDate}T14:25:30.123Z] [ERROR] Failed to connect to source database: mongodb://bad-server:27017/products`,
      `[${selectedDate}T14:25:30.456Z] [ERROR] MongoNetworkError: connection timed out`,
      `[${selectedDate}T15:42:15.789Z] [ERROR] Failed to migrate document with _id: 612f4a1b3c87d2001f9c7a3e`,
      `[${selectedDate}T15:42:16.321Z] [ERROR] Document validation failed: field 'price' must be a number`
    ];
    
    const allLogs = selectedLogType === 'migration' ? mockLogs : 
                    selectedLogType === 'error' ? errorLogs :
                    [...mockLogs, ...errorLogs];
                    
    // Apply search filter if needed
    const filteredLogs = searchQuery 
      ? allLogs.filter(log => log.toLowerCase().includes(searchQuery.toLowerCase()))
      : allLogs;
      
    setLogs(filteredLogs);
  }, [selectedLogType, selectedDate, searchQuery]);

  const handleExportLogs = () => {
    // In a real app, this would trigger a download of log files
    alert('In a real application, this would download the log files.');
  };

  return (
    <>
      <Title order={1} mb="md">Migration Logs</Title>
      <Text mb="xl" color="dimmed">
        View and search logs from migration operations.
      </Text>
      
      <Paper p="md" shadow="xs" mb="xl">
        <Group align="end" position="apart">
          <Group grow>
            <Select
              label="Log Type"
              value={selectedLogType}
              onChange={(value) => setSelectedLogType(value || 'all')}
              data={[
                { value: 'all', label: 'All Logs' },
                { value: 'migration', label: 'Migration Logs' },
                { value: 'error', label: 'Error Logs' }
              ]}
            />
            
            <TextInput
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.currentTarget.value)}
            />
          </Group>
          
          <Group>
            <Button variant="outline" onClick={handleExportLogs}>
              Export Logs
            </Button>
          </Group>
        </Group>
        
        <TextInput
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          mt="md"
          icon={<span>🔍</span>}
        />
      </Paper>
      
      <Accordion defaultValue="recentLogs">
        <Accordion.Item value="recentLogs">
          <Accordion.Control>
            <Group position="apart">
              <Text weight={500}>Logs ({logs.length})</Text>
              <Text size="sm" color="dimmed">{selectedDate}</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Paper
              p="xs"
              sx={(theme) => ({
                backgroundColor: theme.colors.dark[9],
                color: theme.colors.gray[0],
                fontFamily: 'monospace',
                maxHeight: '600px',
                overflow: 'auto',
              })}
            >
              <Stack spacing={0}>
                {logs.map((log, index) => {
                  let color = 'inherit';
                  if (log.includes('[INFO]')) color = '#a3e635';
                  if (log.includes('[WARN]')) color = '#facc15';
                  if (log.includes('[ERROR]')) color = '#ef4444';
                  
                  return (
                    <Text 
                      key={index} 
                      sx={{ color, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                      size="sm"
                    >
                      {log}
                    </Text>
                  );
                })}
                
                {logs.length === 0 && (
                  <Text color="dimmed" italic>No logs found for the selected criteria.</Text>
                )}
              </Stack>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  );
};

export default Logs;