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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        

        

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
