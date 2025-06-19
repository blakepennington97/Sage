// Cost estimation service for geographic price adjustments
// This service provides location-based pricing adjustments for recipe ingredients

export interface CostRegion {
  id: string;
  name: string;
  multiplier: number; // Price multiplier compared to US average
  country: string;
  currency: string;
  currencySymbol: string;
}

// Regional cost multipliers based on cost of living data
export const COST_REGIONS: CostRegion[] = [
  { id: 'us-average', name: 'US Average', multiplier: 1.0, country: 'US', currency: 'USD', currencySymbol: '$' },
  { id: 'us-expensive', name: 'US High Cost (NYC, SF)', multiplier: 1.6, country: 'US', currency: 'USD', currencySymbol: '$' },
  { id: 'us-affordable', name: 'US Low Cost (Midwest)', multiplier: 0.8, country: 'US', currency: 'USD', currencySymbol: '$' },
  { id: 'canada', name: 'Canada', multiplier: 1.15, country: 'CA', currency: 'CAD', currencySymbol: 'C$' },
  { id: 'uk', name: 'United Kingdom', multiplier: 1.25, country: 'UK', currency: 'GBP', currencySymbol: '£' },
  { id: 'australia', name: 'Australia', multiplier: 1.3, country: 'AU', currency: 'AUD', currencySymbol: 'A$' },
];

export class CostEstimationService {
  private static selectedRegion: CostRegion = COST_REGIONS[0]; // Default to US Average

  static setRegion(regionId: string): void {
    const region = COST_REGIONS.find(r => r.id === regionId);
    if (region) {
      this.selectedRegion = region;
    }
  }

  static getCurrentRegion(): CostRegion {
    return this.selectedRegion;
  }

  static adjustCostForRegion(baseCostUSD: number, regionId?: string): number {
    const region = regionId 
      ? COST_REGIONS.find(r => r.id === regionId) || this.selectedRegion
      : this.selectedRegion;
    
    return baseCostUSD * region.multiplier;
  }

  static formatCurrency(amount: number, regionId?: string): string {
    const region = regionId 
      ? COST_REGIONS.find(r => r.id === regionId) || this.selectedRegion
      : this.selectedRegion;
    
    return `${region.currencySymbol}${amount.toFixed(2)}`;
  }

  static getRegionComparison(baseCostUSD: number): Array<{
    region: CostRegion;
    adjustedCost: number;
    formattedCost: string;
  }> {
    return COST_REGIONS.map(region => ({
      region,
      adjustedCost: baseCostUSD * region.multiplier,
      formattedCost: this.formatCurrency(baseCostUSD * region.multiplier, region.id),
    }));
  }

  // Estimate restaurant cost multiplier based on region
  static getRestaurantMultiplier(regionId?: string): number {
    const region = regionId 
      ? COST_REGIONS.find(r => r.id === regionId) || this.selectedRegion
      : this.selectedRegion;
    
    // Restaurant multipliers vary by region (typically 2.5x to 4x home cooking)
    const baseMultiplier = 3.5;
    if (region.multiplier > 1.4) return baseMultiplier * 1.2; // Expensive cities
    if (region.multiplier < 0.9) return baseMultiplier * 0.9; // Affordable areas
    return baseMultiplier;
  }
}

// Location detection utilities (placeholder for future implementation)
export class LocationService {
  static async detectUserRegion(): Promise<CostRegion> {
    // TODO: Implement actual location detection
    // Could use IP geolocation, device location, or user preference
    return COST_REGIONS[0]; // Default to US Average for now
  }

  static async requestLocationPermission(): Promise<boolean> {
    // TODO: Implement location permission request
    return false;
  }
}