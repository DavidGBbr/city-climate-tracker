from sqlmodel import select

from .models import City


def active_cities_stmt(include_deleted: bool = False):
    stmt = select(City)
    if not include_deleted:
        stmt = stmt.where(City.deleted_at.is_(None))
    return stmt.order_by(City.name)
