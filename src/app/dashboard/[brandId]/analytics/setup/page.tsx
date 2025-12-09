'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBrand } from '@/contexts/BrandContext';
import { useFinalizeAnalytics, useGA4Properties } from '@/hooks/useAnalytics';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AnalyticsSetupPage() {
  const router = useRouter();
  const { brand, isLoading: brandLoading } = useBrand();
  const {
    data: properties,
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useGA4Properties(brand?.id || '');
  const {
    finalize,
    isLoading: finalizing,
    error: finalizeError,
  } = useFinalizeAnalytics(brand?.id || '');

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handleFinalize = async () => {
    if (!selectedProperty) return;

    const success = await finalize(selectedProperty);
    if (success) {
      router.push(`/dashboard/${brand?.id}/analytics`);
    }
  };

  if (brandLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  if (propertiesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Connect Google Analytics</h1>
          <p className="text-muted-foreground">Select a GA4 property to connect</p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>{propertiesError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/${brand.id}/analytics`)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Google Analytics</h1>
        <p className="text-muted-foreground">Select a GA4 property to connect</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select GA4 Property</CardTitle>
          <CardDescription>
            Choose the Google Analytics 4 property you want to connect to {brand.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {propertiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading properties...</span>
            </div>
          ) : properties && properties.length > 0 ? (
            <>
              <div className="space-y-2">
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => setSelectedProperty(property.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedProperty === property.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground">Property ID: {property.id}</p>
                      </div>
                      {selectedProperty === property.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {finalizeError && <p className="text-sm text-destructive">{finalizeError}</p>}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/${brand.id}/analytics`)}
                >
                  Cancel
                </Button>
                <Button onClick={handleFinalize} disabled={!selectedProperty || finalizing}>
                  {finalizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Property'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No GA4 properties found in your account.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Make sure you have access to at least one Google Analytics 4 property.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/dashboard/${brand.id}/analytics`)}
              >
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
