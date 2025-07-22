import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Button, 
  Group, 
  Alert,
  Stack,
  Paper,
  MultiSelect,
  LoadingOverlay,
  Skeleton
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { DatabaseStats, MongoDBConnectionConfig } from '../types';
import DatabaseAnalysisCard from '../components/DatabaseAnalysisCard';

const Analyze: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceConfig, setSourceConfig] = useState<MongoDBConnectionConfig | null>(null);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<DatabaseStats[]>([]);

  // Load configuration
  useEffect(() => {
    setLoading(true);
    apiService.loadConfig()
      .then(config => {
        if (config) {
          setSourceConfig(config.source);
          
          // For demo purposes, let's mock some database names
          // In real app, we would fetch this from the API
          setAvailableDatabases(['products', 'users', 'analytics', 'logs']);
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

  const handleAnalyze = async () => {
    if (!sourceConfig) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const results = await apiService.analyzeSource(
        sourceConfig, 
        selectedDatabases.length > 0 ? selectedDatabases : undefined
      );
      
      setAnalysisResults(results);
    } catch (err) {
      setError('Error analyzing databases. Please check your connection settings.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // For demo purposes, we'll simulate analysis results if the real API call fails
  useEffect(() => {
    if (analyzing && !sourceConfig) {
      // Mock data for demonstration
      setTimeout(() => {
        const mockAnalysisResults: DatabaseStats[] = [
          {
            name: 'products',
            collections: [
              { name: 'items', count: 10000, size: 52428800, indexes: [{name: '_id_'}, {name: 'sku_idx'}] },
              { name: 'categories', count: 50, size: 102400, indexes: [{name: '_id_'}] },
              { name: 'reviews', count: 25000, size: 104857600, indexes: [{name: '_id_'}, {name: 'product_id_idx'}] }
            ],
            totalSize: 157388800,
            totalDocuments: 35050
          },
          {
            name: 'users',
            collections: [
              { name: 'accounts', count: 5000, size: 10485760, indexes: [{name: '_id_'}, {name: 'email_idx'}] },
              { name: 'profiles', count: 4800, size: 25165824, indexes: [{name: '_id_'}, {name: 'user_id_idx'}] },
              { name: 'sessions', count: 15000, size: 5242880, indexes: [{name: '_id_'}, {name: 'expires_idx'}] }
            ],
            totalSize: 40894464,
            totalDocuments: 24800
          }
        ];
        
        setAnalysisResults(mockAnalysisResults);
        setAnalyzing(false);
      }, 2000);
    }
  }, [analyzing, sourceConfig]);

  const handleContinue = () => {
    navigate('/migrate');
  };

  return (
    <>
      <Title order={1} mb="md">Analyze Source Databases</Title>
      <Text mb="xl" color="dimmed">
        Analyze your source databases to get information about collections, documents, and indexes.
      </Text>

      <LoadingOverlay visible={loading} />

      {error && (
        <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      <Paper p="md" shadow="xs" mb="xl">
        <Stack spacing="md">
          <Text weight={500}>Select Databases to Analyze</Text>
          
          <MultiSelect
            data={availableDatabases.map(db => ({ value: db, label: db }))}
            value={selectedDatabases}
            onChange={setSelectedDatabases}
            placeholder="Leave empty to analyze all databases"
            searchable
            clearable
            disabled={analyzing}
          />
          
          <Group position="right">
            <Button
              onClick={handleAnalyze}
              loading={analyzing}
              disabled={!sourceConfig}
              color="blue"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Selected Databases'}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {analyzing ? (
        <Stack spacing="md" mt="xl">
          <Skeleton height={150} radius="md" animate={true} />
          <Skeleton height={150} radius="md" animate={true} />
        </Stack>
      ) : (
        <>
          {analysisResults.length > 0 && (
            <>
              <Title order={3} mt="xl" mb="md">Analysis Results</Title>
              
              <Stack spacing="md">
                {analysisResults.map((db, index) => (
                  <DatabaseAnalysisCard key={index} database={db} />
                ))}
              </Stack>
              
              <Group position="right" mt="xl">
                <Button color="green" onClick={handleContinue}>
                  Continue to Migration
                </Button>
              </Group>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Analyze;