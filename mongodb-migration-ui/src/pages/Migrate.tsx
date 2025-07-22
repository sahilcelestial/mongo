import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Button, 
  Group, 
  Alert,
  Stack,
  LoadingOverlay,
  Paper,
  Divider
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  MongoDBConnectionConfig, 
  MigrationOptions, 
  MigrationStats,
  MigrationProgress
} from '../types';
import MigrationOptionsComponent from '../components/MigrationOptions';
import MigrationProgressComponent from '../components/MigrationProgress';

const Migrate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [sourceConfig, setSourceConfig] = useState<MongoDBConnectionConfig | null>(null);
  const [targetConfig, setTargetConfig] = useState<MongoDBConnectionConfig | null>(null);
  const [migrationOptions, setMigrationOptions] = useState<MigrationOptions>({
    dropTarget: false,
    batchSize: 1000,
    concurrency: 5,
    timeoutMs: 30000,
    dryRun: false
  });
  
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationId, setMigrationId] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    database: '',
    collection: '',
    totalDocuments: 0,
    processedDocuments: 0,
    percentage: 0
  });
  const [migrationStats, setMigrationStats] = useState<MigrationStats>({
    startTime: new Date(),
    totalDatabases: 0,
    totalCollections: 0,
    totalDocuments: 0,
    migratedDocuments: 0,
    failedDocuments: 0,
    errors: []
  });

  // Load configuration
  useEffect(() => {
    setLoading(true);
    apiService.loadConfig()
      .then(config => {
        if (config) {
          setSourceConfig(config.source);
          setTargetConfig(config.target);
          setMigrationOptions(config.options);
          
          // For demo purposes, let's mock some available databases and collections
          setAvailableDatabases(['products', 'users', 'analytics', 'logs']);
          setAvailableCollections([
            'products.items', 'products.categories', 'products.reviews',
            'users.accounts', 'users.profiles', 'users.sessions',
            'analytics.events', 'analytics.pageviews',
            'logs.system', 'logs.access', 'logs.errors'
          ]);
        } else {
          setError('No configuration found. Please set up connections first.');
          navigate('/setup');
        }
      })
      .catch(() => {
        setError('Failed to load configuration. Please set up connections first.');
        navigate('/setup');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  // Update migration status periodically when migration is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isMigrating && migrationId) {
      intervalId = setInterval(async () => {
        try {
          const status = await apiService.getMigrationStatus(migrationId);
          setMigrationStats(status);
          
          // For demo purposes, we'll simulate progress
          const elapsed = Date.now() - status.startTime.getTime();
          const totalTime = 30000; // assume 30 seconds for complete migration
          const progress = Math.min(elapsed / totalTime * 100, 100);
          
          setMigrationProgress({
            database: 'products',
            collection: 'items',
            totalDocuments: 10000,
            processedDocuments: Math.floor(progress / 100 * 10000),
            percentage: progress
          });
          
          if (status.endTime) {
            setIsMigrating(false);
            setSuccess('Migration completed successfully!');
          }
        } catch (err) {
          console.error('Error fetching migration status:', err);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isMigrating, migrationId]);

  const handleOptionsChange = (options: MigrationOptions) => {
    setMigrationOptions(options);
    
    // Save the new options
    if (sourceConfig && targetConfig) {
      apiService.saveConfig(sourceConfig, targetConfig, options)
        .then((success) => {
          if (success) {
            setSuccess('Migration options saved successfully!');
          } else {
            setError('Failed to save migration options.');
          }
        })
        .catch(() => {
          setError('An error occurred while saving migration options.');
        });
    }
  };

  const startMigration = async () => {
    if (!sourceConfig || !targetConfig) return;
    
    setIsMigrating(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Start the migration
      const id = await apiService.startMigration(sourceConfig, targetConfig, migrationOptions);
      setMigrationId(id);
      
      // Initialize migration stats
      setMigrationStats({
        startTime: new Date(),
        totalDatabases: migrationOptions.sourceDatabases?.length || 2,
        totalCollections: 5,
        totalDocuments: 50000,
        migratedDocuments: 0,
        failedDocuments: 0,
        errors: []
      });
      
      setSuccess('Migration started successfully!');
    } catch (err) {
      setError('Error starting migration. Please check your connection settings and options.');
      setIsMigrating(false);
      console.error(err);
    }
  };

  const stopMigration = async () => {
    if (!migrationId) return;
    
    try {
      await apiService.stopMigration(migrationId);
      setIsMigrating(false);
      setSuccess('Migration stopped successfully.');
    } catch (err) {
      setError('Error stopping migration.');
      console.error(err);
    }
  };

  return (
    <>
      <Title order={1} mb="md">Run Migration</Title>
      <Text mb="xl" color="dimmed">
        Configure migration options and start the migration process.
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

      {!isMigrating ? (
        <MigrationOptionsComponent
          initialOptions={migrationOptions}
          availableDatabases={availableDatabases}
          availableCollections={availableCollections}
          onSave={handleOptionsChange}
        />
      ) : (
        <MigrationProgressComponent
          progress={migrationProgress}
          stats={migrationStats}
          isRunning={isMigrating}
        />
      )}

      <Divider my="xl" />
      
      <Group position="right">
        {isMigrating ? (
          <Button color="red" onClick={stopMigration}>
            Stop Migration
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => navigate('/analyze')}>
              Back to Analysis
            </Button>
            
            <Button 
              color="green" 
              onClick={startMigration}
              disabled={!sourceConfig || !targetConfig}
            >
              Start Migration
            </Button>
          </>
        )}
      </Group>
    </>
  );
};

export default Migrate;