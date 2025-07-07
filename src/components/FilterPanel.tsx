
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { humanizeLabel } from '@/utils/humanize';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableRegions: string[];
  availableYears: number[];
  availableCategories: string[];
  availableValues: string[];
}

export interface FilterState {
  region: string | null;
  year: number | null;
  sectorCategory: string | null;
  sector: string | null;
}

const ALL_VALUE = '__all__'

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableRegions,
  availableYears,
  availableCategories,
  availableValues
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
    const resetState = { region: null, year: null, sectorCategory: null, sector: null };
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
        {/* Active Filters Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.active')}
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.region && (
              <Badge variant="secondary">
                {t('filters.region')}: {filters.region}
              </Badge>
            )}
            {filters.year && (
              <Badge variant="secondary">
                {t('filters.year')}: {filters.year}
              </Badge>
            )}
            {filters.sectorCategory && (
              <Badge variant="secondary">
                {t('filters.category')}: {t(`category.${filters.sectorCategory}`)}
              </Badge>
            )}
            {filters.sector && (
              <Badge variant="secondary">
                {t('filters.value')}: {t(`value.${filters.sector}`)}
              </Badge>
            )}
            {!filters.region && !filters.year && !filters.sectorCategory && !filters.sector && (
              <span className="text-sm text-gray-500">{t('filters.none')}</span>
            )}
          </div>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.region')}
          </label>
          <Select
            value={filters.region ?? ALL_VALUE}
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
            value={
              filters.year !== null && filters.year !== undefined
                ? filters.year.toString()
                : ALL_VALUE
            }
            onValueChange={(value) =>
              handleFilterChange(
                'year',
                value === ALL_VALUE ? null : value ? parseInt(value) : null
              )
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

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.category')}
          </label>
          <Select
            value={filters.sectorCategory ?? ALL_VALUE}
            onValueChange={(value) =>
              handleFilterChange('sectorCategory', value === ALL_VALUE ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`${t('filters.category')}...`} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={ALL_VALUE}>{t('filters.allCategories')}</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`category.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Filter */}
        <div
          style={{
            maxHeight: filters.sectorCategory ? '200px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}
        >
          {filters.sectorCategory && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                {t('filters.value')}
              </label>
              <Select
                value={filters.sector ?? ALL_VALUE}
                onValueChange={(value) =>
                  handleFilterChange('sector', value === ALL_VALUE ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${t('filters.value')}...`} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value={ALL_VALUE}>{t('filters.allValues')}</SelectItem>
                  {availableValues.map((val) => (
                    <SelectItem key={val} value={val}>
                      {t(`value.${val}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
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
