from typing import Optional
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

class DepreciationInfo(BaseModel):
    original_price: float
    depreciation_amount: float
    depreciation_percentage: float
    is_appreciation: bool

class CarPredictionResponse(BaseModel):
    estimated_resale_price: float
    currency: str = "INR"
    depreciation: Optional[DepreciationInfo] = None
    vehicle_summary: dict
    model_version: str
    algorithm: str
    metrics: dict
    limitations: list[str]
