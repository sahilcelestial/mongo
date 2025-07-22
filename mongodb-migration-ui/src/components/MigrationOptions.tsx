import React, { useState } from 'react';
import {
  Paper,
  Text,
  Switch,
  NumberInput,
  TextInput,
  Stack,
  Divider,
  Button,
  Group,
  MultiSelect,
} from '@mantine/core';
import { MigrationOptions } from '../types';

interface MigrationOptionsProps {
  initialOptions: Partial<MigrationOptions>;
  availableDatabases: string[];
  availableCollections: string[];
  onSave: (options: MigrationOptions) => void;
}

const MigrationOptions: React.FC<MigrationOptionsProps> = ({
  initialOptions,
  availableDatabases,
  availableCollections,
  onSave,
}) => {
  const [options, setOptions] = useState<MigrationOptions>({
    dropTarget: initialOptions.dropTarget || false,
    batchSize: initialOptions.batchSize || 1000,
    concurrency: initialOptions.concurrency || 5,
    timeoutMs: initialOptions.timeoutMs || 30000,
    dryRun: initialOptions.dryRun || false,
    sourceDatabases: initialOptions.sourceDatabases || [],
    collections: initialOptions.collections || [],
    skipCollections: initialOptions.skipCollections || [],
  });

  const handleChange = (field: keyof MigrationOptions, value: any) => {
    setOptions({ ...options, [field]: value });
  };

  const handleSave = () => {
    onSave(options);
  };

  return (
    <Paper p="md" shadow="xs">
      <Text weight={500} size="lg" mb="md">Migration Options</Text>
      
      <Stack spacing="md">
        <Text weight={500} size="sm" mt="md">Data Selection</Text>
        <Divider />
        
        <MultiSelect
          label="Source Databases"
          description="Select databases to migrate (leave empty for all)"
          data={availableDatabases.map(db => ({ value: db, label: db }))}
          value={options.sourceDatabases || []}
          onChange={(value) => handleChange('sourceDatabases', value)}
          searchable
          clearable
        />
        
        <TextInput
          label="Target Database"
          description="Override target database name (leave empty to use source names)"
          value={options.targetDatabase || ''}
          onChange={(e) => handleChange('targetDatabase', e.target.value)}
        />
        
        <MultiSelect
          label="Collections to Include"
          description="Only migrate these collections (leave empty for all)"
          data={availableCollections.map(coll => ({ value: coll, label: coll }))}
          value={options.collections || []}
          onChange={(value) => handleChange('collections', value)}
          searchable
          clearable
        />
        
        <MultiSelect
          label="Collections to Skip"
          description="Skip these collections during migration"
          data={availableCollections.map(coll => ({ value: coll, label: coll }))}
          value={options.skipCollections || []}
          onChange={(value) => handleChange('skipCollections', value)}
          searchable
          clearable
        />
        
        <Text weight={500} size="sm" mt="md">Performance Settings</Text>
        <Divider />
        
        <NumberInput
          label="Batch Size"
          description="Number of documents to process in each batch"
          value={options.batchSize}
          onChange={(value) => handleChange('batchSize', value || 1000)}
          min={10}
          max={10000}
          step={100}
        />
        
        <NumberInput
          label="Concurrency"
          description="Number of parallel operations"
          value={options.concurrency}
          onChange={(value) => handleChange('concurrency', value || 5)}
          min={1}
          max={20}
        />
        
        <NumberInput
          label="Operation Timeout"
          description="Timeout for operations in milliseconds"
          value={options.timeoutMs}
          onChange={(value) => handleChange('timeoutMs', value || 30000)}
          min={1000}
          max={120000}
          step={1000}
        />
        
        <Text weight={500} size="sm" mt="md">Advanced Options</Text>
        <Divider />
        
        <Switch
          label="Drop Target Collections"
          description="Remove existing data in target collections before migration"
          checked={options.dropTarget}
          onChange={(e) => handleChange('dropTarget', e.currentTarget.checked)}
        />
        
        <Switch
          label="Dry Run"
          description="Analyze data without performing migration"
          checked={options.dryRun}
          onChange={(e) => handleChange('dryRun', e.currentTarget.checked)}
        />
        
        <Group position="right" mt="md">
          <Button color="green" onClick={handleSave}>
            Save Options
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default MigrationOptions;