import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { ProductManager } from '@/components/ProductManager';

interface ProductCreationProps {
  onNavigate?: (page: string, transition?: string) => void;
}

export default function ProductCreation({ onNavigate }: ProductCreationProps) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('admin-dashboard', 'slide-right');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        

        {/* Product Manager */}
        <Card>
          <CardContent>
            <ProductManager 
              userRole="admin"
              showAllProducts={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
