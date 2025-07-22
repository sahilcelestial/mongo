import React from 'react';
import { Title, Text, Button, Group, Box, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Center style={{ height: '70vh' }}>
      <Box sx={{ maxWidth: '500px', textAlign: 'center' }}>
        <Title order={1} mb="md" size="3rem">404</Title>
        <Title order={2} mb="xl">Page Not Found</Title>
        
        <Text mb="xl" size="lg">
          The page you are looking for doesn't exist or has been moved.
        </Text>
        
        <Group position="center">
          <Button onClick={() => navigate('/')} size="lg">
            Go to Dashboard
          </Button>
        </Group>
      </Box>
    </Center>
  );
};

export default NotFound;