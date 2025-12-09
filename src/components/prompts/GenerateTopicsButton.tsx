'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

interface GenerateTopicsButtonProps {
  brandId: string;
  onSuccess?: () => void;
}

export function GenerateTopicsButton({ brandId, onSuccess }: GenerateTopicsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/topics/generate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate topics');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to generate topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
      <Sparkles className="mr-2 h-4 w-4" />
      {isLoading ? 'Generating...' : 'Generate Topics'}
    </Button>
  );
}
