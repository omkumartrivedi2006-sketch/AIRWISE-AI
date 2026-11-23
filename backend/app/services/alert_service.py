"""
AIRWISE AI — Smart Pollution Alert Evaluation Service
Evaluates environmental observations against user-configured threshold rules with
scale-compatibility validation, cooldown throttling, and quiet-hours enforcement.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.alert import AlertRule
from app.models.location import Location
from app.models.notification import Notification
from app.models.pollution import PollutionObservation
from app.models.user import User
from app.models.user_preference import UserPreference
from app.notifications.services.dispatch_service import notification_dispatcher
from app.schemas.personalization import AlertRuleCreate, AlertRuleRead, AlertRuleUpdate

logger = logging.getLogger(__name__)


class AlertService:
    @staticmethod
    def get_user_rules(db: Session, user_id: int) -> List[AlertRuleRead]:
        """Retrieves all alert rules configured by a user."""
        rules = (
            db.query(AlertRule, Location.name, Location.city)
            .outerjoin(Location, AlertRule.location_id == Location.id)
            .filter(AlertRule.user_id == user_id)
            .order_by(AlertRule.created_at.desc())
            .all()
        )

        results: List[AlertRuleRead] = []
        for r, loc_name, city in rules:
            item = AlertRuleRead(
                id=r.id,
                user_id=r.user_id,
                location_id=r.location_id,
                alert_type=r.alert_type,
                metric=r.metric,
                threshold_value=r.threshold_value,
                comparison_operator=r.comparison_operator,
                aqi_scale=r.aqi_scale,
                is_enabled=r.is_enabled,
                notification_channels=r.notification_channels or ["in_app"],
                cooldown_minutes=r.cooldown_minutes,
                last_triggered_at=r.last_triggered_at,
                created_at=r.created_at,
                updated_at=r.updated_at,
                location_name=loc_name,
                city=city,
            )
            results.append(item)
        return results

    @staticmethod
    def create_rule(db: Session, user_id: int, payload: AlertRuleCreate) -> AlertRule:
        """Creates a new user alert rule."""
        rule = AlertRule(
            user_id=user_id,
            location_id=payload.location_id,
            alert_type=payload.alert_type,
            metric=payload.metric.lower(),
            threshold_value=payload.threshold_value,
            comparison_operator=payload.comparison_operator,
            aqi_scale=payload.aqi_scale,
            is_enabled=payload.is_enabled,
            notification_channels=payload.notification_channels,
            cooldown_minutes=payload.cooldown_minutes,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def update_rule(db: Session, user_id: int, rule_id: int, payload: AlertRuleUpdate) -> Optional[AlertRule]:
        """Updates an existing alert rule, validating ownership."""
        rule = db.query(AlertRule).filter(AlertRule.id == rule_id, AlertRule.user_id == user_id).first()
        if not rule:
            return None

        update_dict = payload.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(rule, field) and value is not None:
                setattr(rule, field, value)

        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def delete_rule(db: Session, user_id: int, rule_id: int) -> bool:
        """Deletes an alert rule."""
        rule = db.query(AlertRule).filter(AlertRule.id == rule_id, AlertRule.user_id == user_id).first()
        if not rule:
            return False

        db.delete(rule)
        db.commit()
        return True

    @classmethod
    async def evaluate_observation(
        cls, db: Session, observation: PollutionObservation
    ) -> List[Notification]:
        """
        Evaluates a real validated environmental observation against all matching enabled alert rules.
        Excludes demo data and missing measurements, respects scale compatibility,
        cooldown throttling, and quiet hours.
        """
        if getattr(observation, "is_demo", False):
            logger.info("Observation %s is marked as demo; skipping alert evaluation", observation.id)
            return []

        now = datetime.now(timezone.utc)
        location_id = observation.location_id

        # Query all active rules for this location OR global rules
        rules = (
            db.query(AlertRule)
            .filter(
                AlertRule.is_enabled == True,
                (AlertRule.location_id == location_id) | (AlertRule.location_id == None),
            )
            .all()
        )

        generated_notifications: List[Notification] = []

        for rule in rules:
            user = db.query(User).filter(User.id == rule.user_id).first()
            if not user or not user.is_active:
                continue

            # 1. Scale Compatibility Check for AQI
            if rule.metric == "aqi":
                obs_scale = getattr(observation, "aqi_scale", None) or "US_EPA"
                if obs_scale != rule.aqi_scale:
                    logger.debug(
                        "Skipping rule %s: AQI scale mismatch (rule=%s, obs=%s)",
                        rule.id, rule.aqi_scale, obs_scale
                    )
                    continue

            # 2. Extract Metric Value
            metric_val = getattr(observation, rule.metric, None)
            if metric_val is None:
                # Missing measurement; do not guess or alert
                continue

            # 3. Evaluate Threshold Condition
            triggered = cls._compare(metric_val, rule.comparison_operator, rule.threshold_value)
            if not triggered:
                continue

            # 4. Cooldown Period Check
            if rule.last_triggered_at:
                cooldown_delta = timedelta(minutes=rule.cooldown_minutes)
                # Ensure timezone aware comparison
                last_trig = rule.last_triggered_at
                if last_trig.tzinfo is None:
                    last_trig = last_trig.replace(tzinfo=timezone.utc)
                if now - last_trig < cooldown_delta:
                    logger.info("Rule %s in cooldown until %s", rule.id, last_trig + cooldown_delta)
                    continue

            # 5. Severity Assessment
            severity = cls._assess_severity(rule.metric, metric_val)

            # 6. Quiet Hours Check
            channels = list(rule.notification_channels or ["in_app"])
            pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
            if pref and pref.quiet_hours_enabled and severity != "critical":
                # Check current hour in UTC or user timezone
                curr_time_str = now.strftime("%H:%M")
                start = pref.quiet_hours_start
                end = pref.quiet_hours_end
                is_quiet = False
                if start <= end:
                    is_quiet = start <= curr_time_str <= end
                else:  # Overnight quiet hours e.g. 22:00 to 07:00
                    is_quiet = curr_time_str >= start or curr_time_str <= end

                if is_quiet:
                    # In quiet hours: restrict to in-app only, suppress noisy channels
                    channels = ["in_app"]

            # 7. Construct Notification Record
            loc = db.query(Location).filter(Location.id == observation.location_id).first()
            city_label = loc.city if loc else "Monitored Region"
            unit_label = "µg/m³" if rule.metric in ("pm25", "pm10", "no2", "so2", "o3") else "mg/m³" if rule.metric == "co" else "AQI"

            title = f"{rule.metric.upper()} Threshold Exceeded in {city_label}"
            message = (
                f"{rule.metric.upper()} measured at {metric_val:.1f} {unit_label}, "
                f"exceeding your configured alert threshold of {rule.threshold_value:.1f} {unit_label}. "
                f"Air quality category: {getattr(observation, 'category', 'Elevated')}."
            )

            notification = Notification(
                user_id=user.id,
                alert_rule_id=rule.id,
                title=title,
                message=message,
                severity=severity,
                notification_type=f"{rule.metric}_alert",
                location_id=observation.location_id,
                metric=rule.metric,
                value=float(metric_val),
                unit=unit_label,
                aqi_scale=getattr(observation, "aqi_scale", "US_EPA"),
                observation_time=observation.observed_at,
                source=getattr(observation, "provider", "AIRWISE Environmental Engine"),
                is_read=False,
                channels=channels,
                delivery_status="delivered",
            )

            # 8. Dispatch through enabled channels
            await notification_dispatcher.dispatch(notification, user, channels, db_session=db)

            # 9. Update rule last triggered
            rule.last_triggered_at = now
            db.commit()
            db.refresh(notification)

            generated_notifications.append(notification)

        return generated_notifications

    @staticmethod
    def _compare(val: float, op: str, threshold: float) -> bool:
        if op == ">=":
            return val >= threshold
        elif op == ">":
            return val > threshold
        elif op == "<=":
            return val <= threshold
        elif op == "<":
            return val < threshold
        elif op == "==":
            return abs(val - threshold) < 1e-4
        return False

    @staticmethod
    def _assess_severity(metric: str, value: float) -> str:
        if metric == "aqi":
            if value >= 201:
                return "critical"
            elif value >= 151:
                return "high"
            elif value >= 101:
                return "advisory"
            return "info"
        elif metric == "pm25":
            if value >= 150:
                return "critical"
            elif value >= 55.5:
                return "high"
            elif value >= 35.5:
                return "advisory"
            return "info"
        elif metric == "pm10":
            if value >= 250:
                return "critical"
            elif value >= 150:
                return "high"
            elif value >= 100:
                return "advisory"
            return "info"
        return "advisory"


alert_service = AlertService()
