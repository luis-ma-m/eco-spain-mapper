
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { humanizeLabel } from '@/utils/humanize';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableRegions: string[];
  availableYears: number[];
  availableSectors: string[];
}

export interface FilterState {
  region: string | null;
  year: number | null;
  sector: string | null;
}

const ALL_VALUE = '__all__'

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableRegions,
  availableYears,
  availableSectors
}) => {
  const { t } = useTranslation();

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | number | null,
  ) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const resetState = { region: null, year: null, sector: null };
    onFiltersChange(resetState);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-green-600" />
          <span>{t('filters.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.region')}
          </label>
          <Select
            value={filters.region || ""}
            onValueChange={(value) =>
              handleFilterChange('region', value === ALL_VALUE ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`${t('filters.region')}...`} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={ALL_VALUE}>{t('filters.allRegions')}</SelectItem>
              {availableRegions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.year')}
          </label>
          <Select
            value={filters.year?.toString() || ""}
            onValueChange={(value) =>
              handleFilterChange('year',
                value === ALL_VALUE ? null : value ? parseInt(value) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`${t('filters.year')}...`} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={ALL_VALUE}>{t('filters.allYears')}</SelectItem>
              {availableYears.sort((a, b) => b - a).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sector Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.sector')}
          </label>
          <Select
            value={filters.sector || ""}
            onValueChange={(value) =>
              handleFilterChange('sector', value === ALL_VALUE ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`${t('filters.sector')}...`} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={ALL_VALUE}>{t('filters.allSectors')}</SelectItem>
              {availableSectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {humanizeLabel(sector)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="w-full mt-4"
        >
          {t('filters.reset')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
