import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TonerManagementReport } from '@/components/toner/TonerManagementReport';

// Mocking hooks
vi.mock('@/hooks/useUnitTonerStats', () => ({
  useUnitTonerStats: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useUnitTopConsumers', () => ({
  useUnitTopConsumers: () => ({
    data: [],
    isLoading: false,
  }),
}));

// Ignoramos el componente hijo para mantener la prueba aislada
vi.mock('@/components/toner/TonerPrinterStatsWidget', () => ({
  TonerPrinterStatsWidget: () => <div data-testid="printer-stats-widget">Widget</div>,
}));

// ResizeObserver es necesario para Recharts en JSDom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('TonerManagementReport', () => {
  it('se renderiza correctamente y muestra el título principal', () => {
    render(<TonerManagementReport />);
    
    // Verificamos que se renderice el título de la tarjeta principal
    expect(screen.getByText(/Consumo Histórico Global/i)).toBeInTheDocument();
  });
});
