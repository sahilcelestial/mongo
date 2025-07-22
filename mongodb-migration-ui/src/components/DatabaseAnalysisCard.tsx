import React, { useState } from 'react';
import { 
  Paper, 
  Text, 
  Table, 
  Group, 
  Badge, 
  Accordion, 
  Box,
  Progress
} from '@mantine/core';
import { DatabaseStats, CollectionStats } from '../types';

interface DatabaseAnalysisCardProps {
  database: DatabaseStats;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const DatabaseAnalysisCard: React.FC<DatabaseAnalysisCardProps> = ({ database }) => {
  // Sort collections by size (largest first)
  const sortedCollections = [...database.collections].sort((a, b) => b.size - a.size);
  
  return (
    <Paper p="md" mb="md" shadow="xs">
      <Group position="apart" mb="md">
        <Text weight={600} size="lg">{database.name}</Text>
        <Group spacing="xs">
          <Badge color="blue">{database.collections.length} Collections</Badge>
          <Badge color="green">{database.totalDocuments.toLocaleString()} Documents</Badge>
          <Badge color="violet">{formatSize(database.totalSize)}</Badge>
        </Group>
      </Group>

      <Accordion>
        <Accordion.Item value="collections">
          <Accordion.Control>
            <Text weight={500}>Collections</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>Collection Name</th>
                    <th>Documents</th>
                    <th>Size</th>
                    <th>Indexes</th>
                    <th>% of DB</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCollections.map((collection) => (
                    <tr key={collection.name}>
                      <td>
                        <Text weight={500}>{collection.name}</Text>
                      </td>
                      <td>{collection.count.toLocaleString()}</td>
                      <td>{formatSize(collection.size)}</td>
                      <td>{collection.indexes.length}</td>
                      <td>
                        <Group spacing="xs">
                          <Progress 
                            value={(collection.size / database.totalSize) * 100} 
                            color="green"
                            size="sm"
                            style={{ width: 100 }}
                          />
                          <Text size="xs" color="dimmed">
                            {((collection.size / database.totalSize) * 100).toFixed(1)}%
                          </Text>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
};

export default DatabaseAnalysisCard;