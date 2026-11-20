"""
AIRWISE AI — Common Standardized Response & Pagination Schemas
Follows RFC specifications with consistent 'success', 'message', 'data', and 'meta' wrappers.
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class PaginationMeta(BaseModel):
    page: int = Field(default=1, ge=1, description="Current page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    total: int = Field(default=0, ge=0, description="Total number of items")
    total_pages: int = Field(default=0, ge=0, description="Total number of pages")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit


class SuccessResponse(BaseModel, Generic[DataT]):
    success: bool = Field(default=True)
    message: str = Field(default="Operation completed successfully")
    data: DataT
    meta: Optional[Dict[str, Any]] = None


class ErrorDetail(BaseModel):
    code: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    success: bool = Field(default=False)
    message: str
    error: ErrorDetail
