import React, { useState } from 'react';
import { 
  Box, 
  TextInput, 
  Select, 
  Button, 
  Text, 
  Group, 
  Paper,
  Stack,
  Alert
} from '@mantine/core';
import { MongoDBConnectionConfig, MongoDBDeploymentType } from '../types';
import { apiService } from '../services/api';

interface ConnectionFormProps {
  title: string;
  initialValues?: MongoDBConnectionConfig;
  onSave: (config: MongoDBConnectionConfig) => void;
  testButton?: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ 
  title, 
  initialValues, 
  onSave,
  testButton = true
}) => {
  const [config, setConfig] = useState<MongoDBConnectionConfig>(initialValues || {
    uri: '',
    deploymentType: 'standalone'
  } as MongoDBConnectionConfig);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  const handleChange = (field: keyof MongoDBConnectionConfig, value: any) => {
    setConfig({ ...config, [field]: value });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const success = await apiService.testConnection(config);
      setTestResult({ 
        success, 
        message: success 
          ? 'Connection successful!' 
          : 'Connection failed. Please check your configuration.'
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Connection test failed. Please check your configuration.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <Paper p="md" shadow="xs">
      <Text weight={500} size="lg" mb="md">{title}</Text>
      
      <Stack spacing="md">
        <TextInput
          label="MongoDB URI"
          placeholder="mongodb://username:password@hostname:port/database"
          value={config.uri}
          onChange={(e) => handleChange('uri', e.target.value)}
          required
        />

        <Select
          label="Deployment Type"
          value={config.deploymentType}
          onChange={(value) => handleChange('deploymentType', value as MongoDBDeploymentType)}
          data={[
            { value: 'standalone', label: 'Standalone MongoDB' },
            { value: 'replicaSet', label: 'Replica Set' },
            { value: 'sharded', label: 'Sharded Cluster' },
            { value: 'atlas', label: 'MongoDB Atlas' }
          ]}
          required
        />

        {config.deploymentType === 'replicaSet' && (
          <TextInput
            label="Replica Set Name"
            placeholder="rs0"
            value={config.replicaSet || ''}
            onChange={(e) => handleChange('replicaSet', e.target.value)}
          />
        )}

        {config.deploymentType === 'atlas' && (
          <>
            <TextInput
              label="Atlas API Key (optional)"
              placeholder="Atlas API Key"
              value={config.apiKey || ''}
              onChange={(e) => handleChange('apiKey', e.target.value)}
            />

            <TextInput
              label="Project ID (optional)"
              placeholder="Atlas Project ID"
              value={config.projectId || ''}
              onChange={(e) => handleChange('projectId', e.target.value)}
            />
          </>
        )}

        {testResult && (
          <Alert 
            color={testResult.success ? 'green' : 'red'} 
            title={testResult.success ? 'Success' : 'Error'}
          >
            {testResult.message}
          </Alert>
        )}

        <Group position="right" mt="md">
          {testButton && (
            <Button 
              color="blue" 
              onClick={handleTestConnection} 
              loading={testing}
              disabled={!config.uri}
            >
              Test Connection
            </Button>
          )}
          
          <Button 
            color="green" 
            onClick={handleSave}
            disabled={!config.uri}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default ConnectionForm;