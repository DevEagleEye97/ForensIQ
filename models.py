"""
ForensIQ Data Contracts & Persistence Models
Architecture: Pydantic v2 Telemetry Contracts & SQLAlchemy ORM
"""

import json
from datetime import datetime, timezone
from typing import List, Literal, Optional, Dict, Any, Union
from sqlalchemy import Column, String, Integer, Text, DateTime
from pydantic import BaseModel, Field, ConfigDict
from database import Base
from services.forensics_engine import SimplifiedReportContract, RecaptureAnalysisContract



# ==============================================================================
# 1. SQLALCHEMY EVIDENCE VAULT ORM MODEL
# ==============================================================================

class EvidenceVault(Base):
    __tablename__ = "evidence_vault"

    case_id = Column(String, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_hash = Column(String, nullable=False, unique=True, index=True)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    tamper_probability = Column(Integer, nullable=False)
    verdict = Column(String, nullable=False)
    classification_model = Column(String, nullable=False)
    exif_software = Column(String, nullable=True)
    camera_make = Column(String, nullable=True)
    anomalies_json = Column(Text, nullable=False)
    ela_base64_preview = Column(Text, nullable=True)
    timestamp_utc = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        """Convert ORM record to standardized dictionary."""
        try:
            anomalies = json.loads(self.anomalies_json) if self.anomalies_json else []
        except Exception:
            anomalies = [self.anomalies_json] if self.anomalies_json else []

        return {
            "case_id": self.case_id,
            "file_name": self.file_name,
            "file_hash": self.file_hash,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "tamper_probability": self.tamper_probability,
            "verdict": self.verdict,
            "classification_model": self.classification_model,
            "exif_software": self.exif_software,
            "camera_make": self.camera_make,
            "anomalies": anomalies,
            "ela_base64_preview": self.ela_base64_preview,
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None
        }


# ==============================================================================
# 2. PYDANTIC V2 SCHEMAS (FRONTEND TELEMETRY CONTRACT)
# ==============================================================================

Verdict = Literal[
    "Likely AI-Generated",
    "Likely Authentic",
    "Authentic (Metadata Stripped)",
    "Spliced / Edited",
    "Needs Review",
    "Needs Human Review"
]
Flag = Literal["GREEN", "ORANGE", "RED", "AMBER", "GREEN_FLAG", "RED_FLAG", "NEEDS_REVIEW"]
Confidence = Literal["HIGH", "MEDIUM", "LOW"]


class ExifDataModel(BaseModel):
    software: str
    cameraMake: str
    fileStructure: str
    quantizationHash: Literal["Normal", "Mismatched Compression"]

    model_config = ConfigDict(populate_by_name=True)


class ForensicAnalysisResponse(BaseModel):
    hash: str
    tamperProbability: int = Field(ge=0, le=100)
    verdict: Verdict
    classificationModel: str
    exifData: ExifDataModel
    anomalies: List[str]
    elaBase64: str
    case_id: Optional[str] = None
    evidence_fingerprint: Optional[str] = None
    simplified_report: Optional[SimplifiedReportContract] = None
    recapture_analysis: Optional[RecaptureAnalysisContract] = None
    latency_ms: int = Field(default=0, ge=0)

    model_config = ConfigDict(populate_by_name=True)


class VaultRecordResponse(BaseModel):
    case_id: str
    file_name: str
    file_hash: str
    file_size_bytes: int
    mime_type: str
    tamper_probability: int
    verdict: str
    classification_model: str
    exif_software: Optional[str] = None
    camera_make: Optional[str] = None
    anomalies: List[str] = []
    ela_base64_preview: Optional[str] = None
    timestamp_utc: Optional[str] = None


class VaultListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[VaultRecordResponse]



class SystemStatusResponse(BaseModel):
    status: str
    node_id: str
    uptime_seconds: float
    timestamp_utc: str
    database: Dict[str, Any]
    api_latencies: Dict[str, Any]
    resilience_mode: str


class DocumentAnalysisResponse(BaseModel):
    case_id: str
    filename: str
    sha256: str
    file_size_bytes: int
    title: str
    markdown_content: str
    character_count: int
    word_count: int
    timestamp_utc: str


class MultimodalAnalysisResponse(BaseModel):
    status: str
    case_id: str
    evidence_fingerprint: str
    caption_analyzed: str
    cross_modal_correlation: Dict[str, Any]
    deepfake_classifier: Dict[str, Any]
    timestamp_utc: str

    model_config = ConfigDict(populate_by_name=True)


class DivergentRegion(BaseModel):
    x: int
    y: int
    w: int
    h: int
    intensity: float
    verdict: str

    model_config = ConfigDict(populate_by_name=True)


class DifferentialCompareResponse(BaseModel):
    status: str
    reference_sha256: str
    suspect_sha256: str
    reference_filename: str
    suspect_filename: str
    dimensions: str
    divergence_pct: float
    divergent_regions_count: int
    divergent_regions: List[DivergentRegion]
    heatmap_base64: str
    verdict: str
    verdict_status: str
    summary: str

    model_config = ConfigDict(populate_by_name=True)


# Backwards compatibility alias
DifferentialForensicsResponse = DifferentialCompareResponse


class ChatResponse(BaseModel):
    status: str
    reply: str
    model: str

    model_config = ConfigDict(populate_by_name=True)


class ThreatMetric(BaseModel):
    id: str
    metric: str
    value: Union[int, float]
    unit: str
    region: str
    source: str
    as_of: str
    trend: str
    status: str
    description: str

    model_config = ConfigDict(populate_by_name=True)


class ThreatIntelResponse(BaseModel):
    status: str
    as_of_latest: str
    total_metrics: int
    metrics: List[ThreatMetric]
    disclaimer: str

    model_config = ConfigDict(populate_by_name=True)


# Backwards compatibility alias
ThreatIntelligenceResponse = ThreatIntelResponse

