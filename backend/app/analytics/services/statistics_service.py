"""
AIRWISE AI — Analytics Statistics Service
Pure, reliable mathematical computations for environmental time-series data.
Handles missing values correctly and never treats absent measurements as zero.
"""

import math
from typing import List, Optional, Tuple
from app.analytics.schemas.analytics_schemas import StatisticsData


class StatisticsService:
    """Computes descriptive sample statistics and percentage trajectories."""

    @staticmethod
    def calculate_stats(values: List[float]) -> StatisticsData:
        """
        Computes count, mean, median, min, max, standard deviation, and trajectory
        for a list of non-null physical observations.
        """
        valid_vals = [float(v) for v in values if v is not None and not math.isnan(v)]
        count = len(valid_vals)

        if count == 0:
            return StatisticsData(
                count=0,
                mean=None,
                median=None,
                min=None,
                max=None,
                std_dev=None,
                percentage_change=None,
                methodology="No non-null observations available in selected window.",
            )

        # 1. Mean
        mean_val = round(sum(valid_vals) / count, 2)

        # 2. Median
        sorted_vals = sorted(valid_vals)
        if count % 2 == 1:
            median_val = round(sorted_vals[count // 2], 2)
        else:
            mid = count // 2
            median_val = round((sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0, 2)

        # 3. Min & Max
        min_val = round(sorted_vals[0], 2)
        max_val = round(sorted_vals[-1], 2)

        # 4. Sample Standard Deviation (count >= 2)
        if count > 1:
            variance = sum((x - mean_val) ** 2 for x in valid_vals) / (count - 1)
            std_dev_val = round(math.sqrt(variance), 2)
        else:
            std_dev_val = 0.0

        # 5. Trajectory / Percentage Change across chronological halves
        pct_change = StatisticsService.calculate_half_split_change(valid_vals)

        return StatisticsData(
            count=count,
            mean=mean_val,
            median=median_val,
            min=min_val,
            max=max_val,
            std_dev=std_dev_val,
            percentage_change=pct_change,
            methodology=(
                f"Sample statistics derived from {count} non-null sensor observations. "
                "Missing data points are excluded from the denominator to avoid zero-skewed bias."
            ),
        )

    @staticmethod
    def calculate_half_split_change(chronological_values: List[float]) -> Optional[float]:
        """
        Compares the arithmetic mean of the earlier half against the later half
        of a chronological series to determine percentage delta.
        """
        n = len(chronological_values)
        if n < 4:
            return None

        mid = n // 2
        first_half = chronological_values[:mid]
        second_half = chronological_values[mid:]

        mean_first = sum(first_half) / len(first_half)
        mean_second = sum(second_half) / len(second_half)

        if abs(mean_first) < 1e-6:
            return None

        pct = ((mean_second - mean_first) / mean_first) * 100.0
        return round(pct, 1)

    @staticmethod
    def calculate_moving_average(values: List[float], window_size: int = 3) -> List[Optional[float]]:
        """Computes simple moving average for series smoothing."""
        if not values or window_size <= 1:
            return [round(v, 2) if v is not None else None for v in values]

        result: List[Optional[float]] = []
        for i in range(len(values)):
            start_idx = max(0, i - window_size + 1)
            sub_window = [v for v in values[start_idx : i + 1] if v is not None]
            if sub_window:
                result.append(round(sum(sub_window) / len(sub_window), 2))
            else:
                result.append(None)
        return result


statistics_service = StatisticsService()
