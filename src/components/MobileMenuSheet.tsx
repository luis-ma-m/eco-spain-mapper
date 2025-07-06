
import React, { useState } from 'react';
import { Menu, Upload, Filter, BarChart3, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useTranslation } from '../hooks/useTranslation';
import { humanizeLabel } from '@/utils/humanize';
import DataUpload from './DataUpload';
import FilterPanel from './FilterPanel';
import type { CO2Data } from './DataUpload';
import type { FilterState } from './FilterPanel';

interface MobileMenuSheetProps {
  selectedMetrics: string[];
  availableMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  aggregatedData: CO2Data[];
  availableRegions: string[];
  availableYears: number[];
  availableSectors: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onDataLoaded: (data: CO2Data[]) => void;
}

const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  selectedMetrics,
  availableMetrics,
  onMetricsChange,
  aggregatedData,
  availableRegions,
  availableYears,
  availableSectors,
  filters,
  onFiltersChange,
  onDataLoaded,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'metrics' | 'legend' | 'upload' | 'filters'>('metrics');

  const TabButton: React.FC<{
    id: 'metrics' | 'legend' | 'upload' | 'filters';
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = ({ id, icon: Icon, label }) => (
    <Button
      variant={activeTab === id ? 'default' : 'outline'}
      size="sm"
      onClick={() => setActiveTab(id)}
      className="flex-1 flex flex-col items-center gap-1 h-16"
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="rounded-full bg-green-600 hover:bg-green-700">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-sm p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t('menu.mapControls')}</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-2 border-b">
            <TabButton id="metrics" icon={BarChart3} label={t('menu.metrics')} />
            <TabButton id="legend" icon={Info} label={t('menu.legend')} />
            <TabButton id="upload" icon={Upload} label={t('menu.upload')} />
            <TabButton id="filters" icon={Filter} label={t('menu.filters')} />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('map.selectMetrics')}
                  </label>
                  <Select
                    value={selectedMetrics[0] || ''}
                    onValueChange={value => onMetricsChange([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('map.selectMetricPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {availableMetrics.map(metric => (
                        <SelectItem key={metric} value={metric}>
                          {humanizeLabel(metric)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('map.total')}:</span>
                  <Badge variant="secondary">
                    {aggregatedData.length} {t('map.regionsLabel')}
                  </Badge>
                </div>
              </div>
            )}

            {activeTab === 'legend' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">{t('map.legend')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-600" />
                    <span className="text-sm text-gray-600">{t('map.high')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-600">{t('map.medium')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-600" />
                    <span className="text-sm text-gray-600">{t('map.low')}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <DataUpload onDataLoaded={onDataLoaded} />
            )}

            {activeTab === 'filters' && (
              <FilterPanel
                filters={filters}
                onFiltersChange={onFiltersChange}
                availableRegions={availableRegions}
                availableYears={availableYears}
                availableSectors={availableSectors}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenuSheet;
