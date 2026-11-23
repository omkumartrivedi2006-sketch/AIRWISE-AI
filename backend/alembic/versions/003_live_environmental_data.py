"""live environmental data schema extensions

Revision ID: 003_live_environmental_data
Revises: 002_auth_and_user_management
Create Date: 2026-11-20 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_live_environmental_data'
down_revision: Union[str, None] = '002_auth_and_user_management'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend pollution_observations table with additional pollutants and attribution
    op.add_column('pollution_observations', sa.Column('aqi_scale', sa.String(length=50), nullable=True))
    op.add_column('pollution_observations', sa.Column('no2', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('so2', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('co', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('o3', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('wind_speed', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('wind_direction', sa.Float(), nullable=True))
    op.add_column('pollution_observations', sa.Column('provider', sa.String(length=50), nullable=True))
    op.add_column('pollution_observations', sa.Column('provider_observation_id', sa.String(length=100), nullable=True))
    op.add_column('pollution_observations', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('pollution_observations', sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    op.create_index(
        op.f('ix_pollution_observations_provider_observation_id'),
        'pollution_observations',
        ['provider_observation_id'],
        unique=False
    )
    op.create_index(
        'ix_pollution_obs_loc_time_prov',
        'pollution_observations',
        ['location_id', 'observed_at', 'provider'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_pollution_obs_loc_time_prov', table_name='pollution_observations')
    op.drop_index(op.f('ix_pollution_observations_provider_observation_id'), table_name='pollution_observations')

    op.drop_column('pollution_observations', 'is_demo')
    op.drop_column('pollution_observations', 'is_verified')
    op.drop_column('pollution_observations', 'provider_observation_id')
    op.drop_column('pollution_observations', 'provider')
    op.drop_column('pollution_observations', 'wind_direction')
    op.drop_column('pollution_observations', 'wind_speed')
    op.drop_column('pollution_observations', 'o3')
    op.drop_column('pollution_observations', 'co')
    op.drop_column('pollution_observations', 'so2')
    op.drop_column('pollution_observations', 'no2')
    op.drop_column('pollution_observations', 'aqi_scale')
