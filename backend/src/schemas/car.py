from typing import Optional, List
from pydantic import BaseModel, Field

class CarPredictionRequest(BaseModel):
    brand: str = Field(..., min_length=1, description="Brand/Make of vehicle, e.g. Maruti, Hyundai, Tata")
    model: str = Field(..., min_length=1, description="Model series, e.g. Swift, Creta, Nexon EV")
    year: int = Field(..., ge=1980, le=2026, description="Manufacturing year")
    km_driven: float = Field(..., ge=0, le=2000000, description="Odometer reading in kilometers")
    fuel: str = Field(..., description="Fuel type: Petrol, Diesel, CNG, LPG, Electric, Hybrid")
    seller_type: str = Field(default="Individual", description="Seller type: Individual, Dealer, Trustmark Dealer")
    transmission: str = Field(..., description="Transmission: Manual or Automatic")
    owner: str = Field(default="First Owner", description="Ownership: First Owner, Second Owner, Third Owner, Fourth & Above Owner")
    mileage_kmpl: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Mileage in kmpl / km/kg")
    engine_cc: Optional[float] = Field(default=None, ge=0.0, le=8000.0, description="Engine displacement in CC (0 for Electric)")
    max_power_bhp: Optional[float] = Field(default=None, ge=0.0, le=1500.0, description="Max power in bhp")
    seats: Optional[int] = Field(default=5, ge=2, le=14, description="Seating capacity")
    original_price: Optional[float] = Field(default=None, ge=10000, le=100000000, description="Optional original purchase price in INR")
    battery_soh: Optional[float] = Field(default=None, ge=10.0, le=100.0, description="Optional EV traction battery State of Health (SOH) percentage (10% to 100%)")

class DepreciationInfo(BaseModel):
    original_price: float = Field(..., description="Original launch or purchase invoice price in INR")
    depreciation_amount: float = Field(..., description="Authoritative total depreciation in INR (original - final resale)")
    depreciation_percentage: float = Field(..., description="Depreciation percentage of original invoice")
    residual_retention_percentage: float = Field(default=0.0, description="Residual retention percentage (final resale / original invoice * 100)")
    annualized_loss: float = Field(default=0.0, description="Annualized loss in INR per year (depreciation / max(1, age))")
    value_cost_per_km: float = Field(default=0.0, description="Value cost in INR per km (depreciation / max(1, km))")
    is_appreciation: bool = Field(default=False, description="True if vehicle value appreciated above original price")

class RepairCostTier(BaseModel):
    name: str = Field(..., description="Repair / service category name")
    estimated_cost_inr_range: List[float] = Field(..., description="Estimated cost range [low, high] in INR")
    description: str = Field(..., description="Technical repair description")
    is_deducted_from_resale: bool = Field(default=False, description="Whether this cost is automatically deducted from vehicle price")

class BatteryValuationImpact(BaseModel):
    battery_soh: Optional[float] = Field(default=None, description="Evaluated battery State of Health percentage")
    soh_source: str = Field(default="experimental_telemetry", description="'experimental_telemetry', 'verified_diagnostic', or 'unavailable'")
    condition_category: str = Field(..., description="Condition category")
    replacement_risk: str = Field(..., description="5-status risk: Normal, Degraded — inspection recommended, Critical — professional inspection required, Replacement required, Unknown")
    pack_replacement_risk: str = Field(..., description="Risk string (backward compatible alias)")
    adjustment_inr: float = Field(..., description="Provisional monetary premium (+) or deduction (-) in INR")
    adjustment_percent: float = Field(..., description="Percentage shift applied to base vehicle price")
    adjustment_confidence_interval: Optional[List[float]] = Field(default=None, description="Uncertainty range [low, high] in INR")
    is_provisional: bool = Field(default=True, description="True because used-car dataset lacks verified battery SOH records")
    explanation: str = Field(..., description="Automotive domain explanation of the valuation impact")
    rule_precedence: str = Field(default="Documented Valuation Flow: Base Value + Provisional Battery Adjustment", description="Valuation rule that took precedence")
    is_eol_override: bool = Field(default=False, description="Whether End-of-Life SOH replacement override was applied")
    baseline_market_value: Optional[float] = Field(default=None, description="Pre-adjustment baseline vehicle valuation in INR")
    replacement_pack_cost_estimate: Optional[float] = Field(default=None, description="Informational complete pack replacement estimate in INR (not automatically deducted)")
    repair_cost_tiers: Optional[List[RepairCostTier]] = Field(default=None, description="Informational repair tier estimates")
    chassis_floor_inr: Optional[float] = Field(default=None, description="Enforced rolling chassis and core powertrain floor in INR")

class CarPredictionResponse(BaseModel):
    estimated_resale_price: float = Field(..., description="Authoritative final resale valuation in INR")
    base_vehicle_value: Optional[float] = Field(default=None, description="Authoritative baseline vehicle valuation before battery adjustment")
    battery_adjustment: Optional[float] = Field(default=None, description="Provisional battery adjustment in INR")
    replacement_risk: Optional[str] = Field(default=None, description="5-status replacement risk classification")
    currency: str = "INR"
    depreciation: Optional[DepreciationInfo] = None
    battery_valuation_impact: Optional[BatteryValuationImpact] = None
    vehicle_summary: dict
    model_version: str
    algorithm: str
    metrics: dict
    limitations: list[str]
