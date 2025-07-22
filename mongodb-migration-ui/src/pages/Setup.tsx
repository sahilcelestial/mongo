import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Tabs, 
  Button, 
  Group, 
  Alert,
  Stepper,
  Stack,
  Center,
  LoadingOverlay
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { MongoDBConnectionConfig, MigrationOptions } from '../types';
import { apiService } from '../services/api';
import ConnectionForm from '../components/ConnectionForm';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sourceConfig, setSourceConfig] = useState<MongoDBConnectionConfig>({
    uri: '',
    deploymentType: 'standalone'
  });

  const [targetConfig, setTargetConfig] = useState<MongoDBConnectionConfig>({
    uri: '',
    deploymentType: 'standalone'
  });

  // Load existing configuration if available
  useEffect(() => {
    setLoading(true);
    apiService.loadConfig()
      .then(config => {
        if (config) {
          setSourceConfig(config.source);
          setTargetConfig(config.target);
        }
      })
      .catch(() => {
        // No existing config, use defaults
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSourceSave = (config: MongoDBConnectionConfig) => {
    setSourceConfig(config);
    setActive(1);
  };

  const handleTargetSave = (config: MongoDBConnectionConfig) => {
    setTargetConfig(config);
    saveConfiguration();
  };

  const saveConfiguration = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Default migration options
      const defaultOptions: MigrationOptions = {
        dropTarget: false,
        batchSize: 1000,
        concurrency: 5,
        timeoutMs: 30000,
        dryRun: false
      };

      const success = await apiService.saveConfig(sourceConfig, targetConfig, defaultOptions);
      
      if (success) {
        setSuccess('Configuration saved successfully!');
        setActive(2);
      } else {
        setError('Failed to save configuration.');
      }
    } catch (err) {
      setError('An error occurred while saving the configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/analyze');
  };

  return (
    <>
      <Title order={1} mb="md">Connection Setup</Title>
      <Text mb="xl" color="dimmed">
        Configure the source and target MongoDB connections for your migration.
      </Text>

      <LoadingOverlay visible={loading} />

      {error && (
        <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {success && (
        <Alert color="green" mb="md" onClose={() => setSuccess(null)} withCloseButton>
          {success}
        </Alert>
      )}

      <Stepper active={active} onStepClick={setActive} mb="xl">
        <Stepper.Step 
          label="Source" 
          description="Configure source database"
        >
          <ConnectionForm
            title="Source MongoDB Connection"
            initialValues={sourceConfig}
            onSave={handleSourceSave}
          />
        </Stepper.Step>

        <Stepper.Step 
          label="Target" 
          description="Configure target database"
        >
          <ConnectionForm
            title="Target MongoDB Connection"
            initialValues={targetConfig}
            onSave={handleTargetSave}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <Stack align="center" spacing="md" mt="xl">
            <Text size="xl" weight={700} color="green">
              Configuration Complete!
            </Text>
            
            <Text align="center" mt="md">
              Your MongoDB connection settings have been saved. You can now proceed to analyze your
              source database or start a migration.
            </Text>
            
            <Group position="center" mt="xl">
              <Button variant="outline" onClick={() => setActive(0)}>
                Edit Source Connection
              </Button>
              
              <Button variant="outline" onClick={() => setActive(1)}>
                Edit Target Connection
              </Button>
              
              <Button color="green" onClick={handleFinish}>
                Continue to Analysis
              </Button>
            </Group>
          </Stack>
        </Stepper.Completed>
      </Stepper>

      <Group position="right" mt="xl">
        {active === 0 && sourceConfig.uri && (
          <Button onClick={() => setActive(1)}>
            Next
          </Button>
        )}
        
        {active === 1 && (
          <Group>
            <Button variant="outline" onClick={() => setActive(0)}>
              Back
            </Button>
            
            <Button 
              color="green" 
              onClick={() => handleTargetSave(targetConfig)}
              disabled={!targetConfig.uri}
            >
              Save Configuration
            </Button>
          </Group>
        )}
      </Group>
    </>
  );
};

export default Setup;