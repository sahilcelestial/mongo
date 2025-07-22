import React, { useState } from 'react';
import { 
  Title, 
  Text, 
  Paper, 
  Switch,
  NumberInput,
  Stack,
  Group,
  Button,
  Select,
  Divider,
  Alert
} from '@mantine/core';

const Settings: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  
  // Application settings
  const [darkMode, setDarkMode] = useState(false);
  const [logLevel, setLogLevel] = useState('info');
  const [maxLogFileSize, setMaxLogFileSize] = useState(10);
  const [autoBackup, setAutoBackup] = useState(true);
  
  // Migration defaults
  const [defaultBatchSize, setDefaultBatchSize] = useState(1000);
  const [defaultConcurrency, setDefaultConcurrency] = useState(5);
  const [defaultTimeout, setDefaultTimeout] = useState(30000);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const handleSaveSettings = () => {
    // In a real application, this would save the settings to an API or local storage
    setSuccess('Settings saved successfully!');
    
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  return (
    <>
      <Title order={1} mb="md">Settings</Title>
      <Text mb="xl" color="dimmed">
        Configure application settings and defaults.
      </Text>
      
      {success && (
        <Alert color="green" mb="md" onClose={() => setSuccess(null)} withCloseButton>
          {success}
        </Alert>
      )}
      
      <Paper p="md" shadow="xs" mb="xl">
        <Title order={3} mb="md">Application Settings</Title>
        
        <Stack spacing="md">
          <Switch
            label="Dark Mode"
            description="Enable dark theme for the application"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.currentTarget.checked)}
          />
          
          <Divider />
          
          <Select
            label="Log Level"
            description="Set the verbosity of application logs"
            value={logLevel}
            onChange={(value) => setLogLevel(value || 'info')}
            data={[
              { value: 'error', label: 'Error (Minimal)' },
              { value: 'warn', label: 'Warning' },
              { value: 'info', label: 'Info (Standard)' },
              { value: 'debug', label: 'Debug (Verbose)' }
            ]}
          />
          
          <NumberInput
            label="Max Log File Size (MB)"
            description="Maximum size for each log file before rotation"
            value={maxLogFileSize}
            onChange={(value) => setMaxLogFileSize(value || 10)}
            min={1}
            max={100}
          />
          
          <Switch
            label="Auto-backup Before Migration"
            description="Automatically create backups before running migrations"
            checked={autoBackup}
            onChange={(e) => setAutoBackup(e.currentTarget.checked)}
          />
        </Stack>
      </Paper>
      
      <Paper p="md" shadow="xs" mb="xl">
        <Title order={3} mb="md">Default Migration Settings</Title>
        
        <Stack spacing="md">
          <NumberInput
            label="Default Batch Size"
            description="Default number of documents to process in each batch"
            value={defaultBatchSize}
            onChange={(value) => setDefaultBatchSize(value || 1000)}
            min={10}
            max={10000}
            step={100}
          />
          
          <NumberInput
            label="Default Concurrency"
            description="Default number of parallel operations"
            value={defaultConcurrency}
            onChange={(value) => setDefaultConcurrency(value || 5)}
            min={1}
            max={20}
          />
          
          <NumberInput
            label="Default Timeout (ms)"
            description="Default timeout for operations in milliseconds"
            value={defaultTimeout}
            onChange={(value) => setDefaultTimeout(value || 30000)}
            min={1000}
            max={120000}
            step={1000}
          />
        </Stack>
      </Paper>
      
      <Paper p="md" shadow="xs" mb="xl">
        <Title order={3} mb="md">Notifications</Title>
        
        <Stack spacing="md">
          <Switch
            label="Email Notifications"
            description="Send email notifications for completed migrations"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.currentTarget.checked)}
          />
          
          {emailNotifications && (
            <Group grow>
              <div>
                <Text size="sm" weight={500} mb={3}>
                  Email Address
                </Text>
                <Text size="xs" color="dimmed" mb="xs">
                  Where to send migration notifications
                </Text>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="user@example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da'
                  }}
                />
              </div>
            </Group>
          )}
        </Stack>
      </Paper>
      
      <Group position="right">
        <Button
          color="green"
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Group>
    </>
  );
};

export default Settings;