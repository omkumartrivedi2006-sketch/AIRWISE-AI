"""
005_admin_audit_and_reviews
Revision ID: 005_admin_audit_and_reviews
Revises: 004_personalization_alerts_notifications
Create Date: 2026-11-21 11:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_admin_audit_and_reviews'
down_revision = '004_personalization_alerts_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_type', sa.String(length=100), nullable=False),
        sa.Column('target_id', sa.String(length=100), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_admin_id'), 'audit_logs', ['admin_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_target_type'), 'audit_logs', ['target_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_target_id'), 'audit_logs', ['target_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)

    # 2. environmental_data_reviews table
    op.create_table(
        'environmental_data_reviews',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('observation_id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('previous_status', sa.String(length=50), nullable=False),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['observation_id'], ['pollution_observations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_environmental_data_reviews_id'), 'environmental_data_reviews', ['id'], unique=False)
    op.create_index(op.f('ix_environmental_data_reviews_observation_id'), 'environmental_data_reviews', ['observation_id'], unique=False)
    op.create_index(op.f('ix_environmental_data_reviews_admin_id'), 'environmental_data_reviews', ['admin_id'], unique=False)

    # 3. Add columns to pollution_observations
    op.add_column('pollution_observations', sa.Column('is_flagged', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('pollution_observations', sa.Column('review_status', sa.String(length=50), server_default=sa.text("'unreviewed'"), nullable=False))
    op.add_column('pollution_observations', sa.Column('reviewed_by_id', sa.Integer(), nullable=True))
    op.add_column('pollution_observations', sa.Column('review_notes', sa.String(length=500), nullable=True))
    op.add_column('pollution_observations', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(None, 'pollution_observations', 'users', ['reviewed_by_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_pollution_observations_is_flagged'), 'pollution_observations', ['is_flagged'], unique=False)
    op.create_index(op.f('ix_pollution_observations_review_status'), 'pollution_observations', ['review_status'], unique=False)

    # 4. Add columns to notifications
    op.add_column('notifications', sa.Column('failure_reason', sa.String(length=500), nullable=True))
    op.add_column('notifications', sa.Column('retry_count', sa.Integer(), server_default=sa.text('0'), nullable=False))


def downgrade() -> None:
    # 4. Remove columns from notifications
    op.drop_column('notifications', 'retry_count')
    op.drop_column('notifications', 'failure_reason')

    # 3. Remove columns from pollution_observations
    op.drop_index(op.f('ix_pollution_observations_review_status'), table_name='pollution_observations')
    op.drop_index(op.f('ix_pollution_observations_is_flagged'), table_name='pollution_observations')
    op.drop_constraint(None, 'pollution_observations', type_='foreignkey')
    op.drop_column('pollution_observations', 'reviewed_at')
    op.drop_column('pollution_observations', 'review_notes')
    op.drop_column('pollution_observations', 'reviewed_by_id')
    op.drop_column('pollution_observations', 'review_status')
    op.drop_column('pollution_observations', 'is_flagged')

    # 2. Drop environmental_data_reviews
    op.drop_index(op.f('ix_environmental_data_reviews_admin_id'), table_name='environmental_data_reviews')
    op.drop_index(op.f('ix_environmental_data_reviews_observation_id'), table_name='environmental_data_reviews')
    op.drop_index(op.f('ix_environmental_data_reviews_id'), table_name='environmental_data_reviews')
    op.drop_table('environmental_data_reviews')

    # 1. Drop audit_logs
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_target_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_target_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_admin_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
