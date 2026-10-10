from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class ModelDetail(BaseModel):
    available: bool
    model_name: str
    algorithm: str
    version: str
    training_dataset: str
    training_samples: int
    test_samples: int
    validation_strategy: str
    metrics: Dict[str, Any]
    all_candidate_metrics: Dict[str, Any]
    feature_schema: Dict[str, Any]
    limitations: List[str]

class ModelsInfoResponse(BaseModel):
    car_resale_model: ModelDetail
    battery_soh_model: ModelDetail
    environment: str
