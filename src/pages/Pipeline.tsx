import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Pipeline() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Pipeline de vendas em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
