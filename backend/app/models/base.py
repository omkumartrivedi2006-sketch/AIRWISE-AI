"""
AIRWISE AI — MongoDB Base Document Model & Query Expression System
Provides native MongoDB document abstractions, field descriptors, and query expressions.
"""

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional, Tuple, Union


class BinaryExpression:
    """Represents a MongoDB comparison expression."""
    def __init__(self, field_name: str, operator: str, value: Any):
        self.field_name = field_name
        self.operator = operator
        self.value = value

    def to_mongo_filter(self) -> Dict[str, Any]:
        if self.operator == "$eq":
            return {self.field_name: self.value}
        return {self.field_name: {self.operator: self.value}}

    def __and__(self, other: Any) -> "AndExpression":
        return AndExpression([self, other])

    def __or__(self, other: Any) -> "OrExpression":
        return OrExpression([self, other])


class AndExpression:
    def __init__(self, expressions: List[Any]):
        self.expressions = expressions

    def to_mongo_filter(self) -> Dict[str, Any]:
        filters = []
        for expr in self.expressions:
            if hasattr(expr, "to_mongo_filter"):
                filters.append(expr.to_mongo_filter())
            elif isinstance(expr, dict):
                filters.append(expr)
        if len(filters) == 1:
            return filters[0]
        return {"$and": filters}


class OrExpression:
    def __init__(self, expressions: List[Any]):
        self.expressions = expressions

    def to_mongo_filter(self) -> Dict[str, Any]:
        filters = []
        for expr in self.expressions:
            if hasattr(expr, "to_mongo_filter"):
                filters.append(expr.to_mongo_filter())
            elif isinstance(expr, dict):
                filters.append(expr)
        return {"$or": filters}


class Field:
    """Descriptor representing a MongoDB document field for queries and instances."""
    def __init__(
        self,
        name: str = "",
        type_hint: Any = None,
        default: Any = None,
        primary_key: bool = False,
        index: bool = False,
        unique: bool = False,
        nullable: bool = True,
        autoincrement: bool = False,
        **kwargs: Any,
    ):
        self.name = name
        self.type_hint = type_hint
        self.default = default
        self.primary_key = primary_key
        self.index = index
        self.unique = unique
        self.nullable = nullable
        self.autoincrement = autoincrement
        self.model_class: Any = None

    def __set_name__(self, owner: Any, name: str) -> None:
        if not self.name:
            self.name = name
        self.model_class = owner

    def __get__(self, instance: Any, owner: Any) -> Any:
        if instance is None:
            return self
        return instance.__dict__.get(self.name, self._eval_default())

    def __set__(self, instance: Any, value: Any) -> None:
        instance.__dict__[self.name] = value

    def _eval_default(self) -> Any:
        if callable(self.default):
            return self.default()
        return self.default

    def __hash__(self) -> int:
        return hash(self.name or id(self))

    def __eq__(self, other: Any) -> BinaryExpression:  # type: ignore[override]
        return BinaryExpression(self.name, "$eq", other)

    def __ne__(self, other: Any) -> BinaryExpression:  # type: ignore[override]
        return BinaryExpression(self.name, "$ne", other)

    def __lt__(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$lt", other)

    def __le__(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$lte", other)

    def __gt__(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$gt", other)

    def __ge__(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$gte", other)

    def __gte__(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$gte", other)

    def is_(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$eq", other)

    def is_not(self, other: Any) -> BinaryExpression:
        return BinaryExpression(self.name, "$ne", other)

    def label(self, name: str) -> "Field":
        return self

    def in_(self, values: List[Any]) -> BinaryExpression:
        return BinaryExpression(self.name, "$in", list(values))

    def not_in(self, values: List[Any]) -> BinaryExpression:
        return BinaryExpression(self.name, "$nin", list(values))

    def like(self, pattern: str) -> BinaryExpression:
        regex_pattern = pattern.replace("%", ".*").replace("_", ".")
        return BinaryExpression(self.name, "$regex", f"^{regex_pattern}$")

    def ilike(self, pattern: str) -> BinaryExpression:
        regex_pattern = pattern.replace("%", ".*").replace("_", ".")
        return BinaryExpression(self.name, "$regex", regex_pattern)

    def desc(self) -> Tuple[str, int]:
        return (self.name, -1)

    def asc(self) -> Tuple[str, int]:
        return (self.name, 1)

    def __sub__(self, other: Any) -> "MathExpression":
        return MathExpression(self.name, "-", other)

    def __add__(self, other: Any) -> "MathExpression":
        return MathExpression(self.name, "+", other)


class MathExpression:
    def __init__(self, field_name: str, op: str, value: Any):
        self.field_name = field_name
        self.op = op
        self.value = value


class AbsExpression:
    def __init__(self, expr: Any):
        self.expr = expr

    def __lt__(self, delta: float) -> Any:
        if isinstance(self.expr, MathExpression) and self.expr.op == "-":
            val = self.expr.value
            fname = self.expr.field_name
            return BinaryExpression(fname, "$gt", val - delta) & BinaryExpression(fname, "$lt", val + delta)
        fname = getattr(self.expr, "name", str(self.expr))
        return BinaryExpression(fname, "$lt", delta)

    def __le__(self, delta: float) -> Any:
        if isinstance(self.expr, MathExpression) and self.expr.op == "-":
            val = self.expr.value
            fname = self.expr.field_name
            return BinaryExpression(fname, "$gte", val - delta) & BinaryExpression(fname, "$lte", val + delta)
        fname = getattr(self.expr, "name", str(self.expr))
        return BinaryExpression(fname, "$lte", delta)


# Compatibility aliases for SQL column types
Column = Field
Integer = int
String = str
Float = float
Boolean = bool
DateTime = datetime
JSON = dict
Text = str


def ForeignKey(*args: Any, **kwargs: Any) -> None:
    return None


class Relationship:
    def __init__(self, *args: Any, **kwargs: Any):
        self.name = ""

    def __set_name__(self, owner: Any, name: str) -> None:
        self.name = name

    def __get__(self, instance: Any, owner: Any) -> Any:
        if instance is None:
            return self
        return instance.__dict__.get(self.name, [])

    def __set__(self, instance: Any, value: Any) -> None:
        instance.__dict__[self.name] = value


def relationship(*args: Any, **kwargs: Any) -> Relationship:
    return Relationship(*args, **kwargs)


def Index(*args: Any, **kwargs: Any) -> None:
    return None


def UniqueConstraint(*args: Any, **kwargs: Any) -> None:
    return None


def CheckConstraint(*args: Any, **kwargs: Any) -> None:
    return None


def desc(field: Any) -> Tuple[str, int]:
    if isinstance(field, str):
        return (field, -1)
    if hasattr(field, "desc"):
        return field.desc()
    if hasattr(field, "name"):
        return (field.name, -1)
    return (str(field), -1)


def asc(field: Any) -> Tuple[str, int]:
    if isinstance(field, str):
        return (field, 1)
    if hasattr(field, "asc"):
        return field.asc()
    if hasattr(field, "name"):
        return (field.name, 1)
    return (str(field), 1)


def joinedload(*args: Any, **kwargs: Any) -> Any:
    """No-op for MongoDB compatibility."""
    return None


class FuncNamespace:
    """Simulates SQL aggregate functions via MongoDB expressions."""
    @staticmethod
    def count(field: Any = None) -> "CountExpression":
        return CountExpression(field)

    @staticmethod
    def lower(field: Any) -> "LowerExpression":
        return LowerExpression(field)

    @staticmethod
    def abs(expr: Any) -> "AbsExpression":
        return AbsExpression(expr)

    @staticmethod
    def avg(field: Any) -> "ScalarExpression":
        return ScalarExpression(field, "avg")

    @staticmethod
    def min(field: Any) -> "ScalarExpression":
        return ScalarExpression(field, "min")

    @staticmethod
    def max(field: Any) -> "ScalarExpression":
        return ScalarExpression(field, "max")


class ScalarExpression:
    def __init__(self, field: Any, op: str):
        self.field_name = getattr(field, "name", str(field))
        self.model_class = getattr(field, "model_class", None)
        self.op = op

    def label(self, name: str) -> "ScalarExpression":
        return self


class LowerExpression:
    def __init__(self, field: Any):
        self.field_name = getattr(field, "name", str(field))
        self.model_class = getattr(field, "model_class", None)

    def __eq__(self, other: Any) -> BinaryExpression:
        pattern = re.compile(f"^{re.escape(str(other))}$", re.IGNORECASE)
        return BinaryExpression(self.field_name, "$regex", pattern)

    def like(self, pattern: str) -> BinaryExpression:
        regex_pattern = pattern.replace("%", ".*").replace("_", ".")
        return BinaryExpression(self.field_name, "$regex", re.compile(regex_pattern, re.IGNORECASE))

    def ilike(self, pattern: str) -> BinaryExpression:
        regex_pattern = pattern.replace("%", ".*").replace("_", ".")
        return BinaryExpression(self.field_name, "$regex", re.compile(regex_pattern, re.IGNORECASE))


class CountExpression:
    def __init__(self, field: Any = None):
        self.model_class = getattr(field, "model_class", None)
        if self.model_class is None and hasattr(field, "__collection__"):
            self.model_class = field
        self.field_name = getattr(field, "name", str(field) if field is not None else "*")

    def label(self, name: str) -> "CountExpression":
        return self


func = FuncNamespace()


class MongoModel:
    """
    Base class for MongoDB Document Entities.
    Provides attribute access, serialization to/from dictionaries, and default ID generation.
    """
    __tablename__: str = ""
    __collection__: str = ""

    id: Any = Field("id", type_hint=int, autoincrement=True)
    created_at: Any = Field(
        "created_at",
        type_hint=datetime,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Any = Field(
        "updated_at",
        type_hint=datetime,
        default=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs: Any):
        # Set all passed keyword arguments
        for k, v in kwargs.items():
            setattr(self, k, v)

        # Apply field defaults for unset attributes
        for cls_attr_name in dir(self.__class__):
            if cls_attr_name.startswith("_"):
                continue
            descriptor = getattr(self.__class__, cls_attr_name, None)
            if isinstance(descriptor, Field):
                if descriptor.name not in self.__dict__:
                    self.__dict__[descriptor.name] = descriptor._eval_default()

    @classmethod
    def get_collection_name(cls) -> str:
        return cls.__collection__ or cls.__tablename__ or cls.__name__.lower() + "s"

    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance attributes to a clean dictionary for MongoDB storage."""
        data = {}
        for k, v in self.__dict__.items():
            if k.startswith("_"):
                continue
            data[k] = v
        return data

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> Any:
        """Instantiate model instance from a MongoDB document dictionary."""
        if not data:
            return None
        clean_data = dict(data)
        # Map _id if id not present
        if "id" not in clean_data and "_id" in clean_data:
            clean_data["id"] = clean_data["_id"]
        instance = cls(**clean_data)
        # Store raw _id if present
        if "_id" in clean_data:
            instance.__dict__["_id"] = clean_data["_id"]
        return instance

    def __repr__(self) -> str:
        attrs = ", ".join(f"{k}={v!r}" for k, v in list(self.__dict__.items())[:5] if not k.startswith("_"))
        return f"<{self.__class__.__name__} {attrs}>"

    # Dictionary-like subscripting support
    def __getattr__(self, name: str) -> Any:
        if name in ("messages", "notifications", "saved_locations", "alert_rules", "pollution_observations"):
            return []
        return None

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, int):
            attrs = [k for k in self.__dict__ if not k.startswith("_")]
            if 0 <= key < len(attrs):
                return getattr(self, attrs[key])
            return None
        return getattr(self, str(key), None)

    def __setitem__(self, key: str, value: Any) -> None:
        setattr(self, key, value)

    def get(self, key: str, default: Any = None) -> Any:
        return getattr(self, key, default)


# Compatibility aliases
Base = MongoModel


class TimeStampedModel(MongoModel):
    """Abstract model mixin with autoincrement ID and UTC timestamps."""
    pass
