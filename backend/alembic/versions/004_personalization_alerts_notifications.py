"""personalization, alerts, and notifications schema extensions

Revision ID: 004_personalization_alerts_notifications
Revises: 003_live_environmental_data
Create Date: 2026-11-21 01:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_personalization_alerts_notifications'
down_revision: Union[str, None] = '003_live_environmental_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('preferred_location_id', sa.Integer(), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='UTC'),
        sa.Column('temperature_unit', sa.String(length=5), nullable=False, server_default='C'),
        sa.Column('preferred_aqi_scale', sa.String(length=20), nullable=False, server_default='US_EPA'),
        sa.Column('environmental_interests', sa.JSON(), nullable=False),
        sa.Column('preferred_information', sa.JSON(), nullable=False),
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=False, server_default='22:00'),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=False, server_default='07:00'),
        sa.Column('in_app_notifications', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('push_notifications', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['preferred_location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
    )
    op.create_index(op.f('ix_user_preferences_id'), 'user_preferences', ['id'], unique=False)
    op.create_index(op.f('ix_user_preferences_user_id'), 'user_preferences', ['user_id'], unique=True)

    # 2. saved_locations table
    op.create_table(
        'saved_locations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('custom_name', sa.String(length=100), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'location_id', name='uq_user_saved_location'),
    )
    op.create_index(op.f('ix_saved_locations_id'), 'saved_locations', ['id'], unique=False)
    op.create_index(op.f('ix_saved_locations_location_id'), 'saved_locations', ['location_id'], unique=False)
    op.create_index(op.f('ix_saved_locations_user_id'), 'saved_locations', ['user_id'], unique=False)

    # 3. alert_rules table
    op.create_table(
        'alert_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('alert_type', sa.String(length=50), nullable=False, server_default='threshold_exceeded'),
        sa.Column('metric', sa.String(length=20), nullable=False),
        sa.Column('threshold_value', sa.Float(), nullable=False),
        sa.Column('comparison_operator', sa.String(length=10), nullable=False, server_default='>='),
        sa.Column('aqi_scale', sa.String(length=50), nullable=False, server_default='US_EPA'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notification_channels', sa.JSON(), nullable=False),
        sa.Column('cooldown_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_alert_rules_id'), 'alert_rules', ['id'], unique=False)
    op.create_index(op.f('ix_alert_rules_location_id'), 'alert_rules', ['location_id'], unique=False)
    op.create_index(op.f('ix_alert_rules_user_id'), 'alert_rules', ['user_id'], unique=False)

    # 4. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('alert_rule_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.String(length=1000), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='advisory'),
        sa.Column('notification_type', sa.String(length=50), nullable=False, server_default='aqi_alert'),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('metric', sa.String(length=20), nullable=True),
        sa.Column('value', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('aqi_scale', sa.String(length=50), nullable=True),
        sa.Column('observation_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('channels', sa.JSON(), nullable=False),
        sa.Column('delivery_status', sa.String(length=50), nullable=False, server_default='delivered'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['alert_rule_id'], ['alert_rules.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 5. push_subscriptions table
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(length=1000), nullable=False),
        sa.Column('p256dh_key', sa.String(length=255), nullable=False),
        sa.Column('auth_key', sa.String(length=255), nullable=False),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_push_subscriptions_id'), 'push_subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_push_subscriptions_user_id'), 'push_subscriptions', ['user_id'], unique=False)

    # 6. recommendation_caches table
    op.create_table(
        'recommendation_caches',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('cache_key', sa.String(length=255), nullable=False),
        sa.Column('recommendations', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recommendation_caches_cache_key'), 'recommendation_caches', ['cache_key'], unique=False)
    op.create_index(op.f('ix_recommendation_caches_expires_at'), 'recommendation_caches', ['expires_at'], unique=False)
    op.create_index(op.f('ix_recommendation_caches_id'), 'recommendation_caches', ['id'], unique=False)
    op.create_index(op.f('ix_recommendation_caches_location_id'), 'recommendation_caches', ['location_id'], unique=False)
    op.create_index(op.f('ix_recommendation_caches_user_id'), 'recommendation_caches', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('recommendation_caches')
    op.drop_table('push_subscriptions')
    op.drop_table('notifications')
    op.drop_table('alert_rules')
    op.drop_table('saved_locations')
    op.drop_table('user_preferences')
