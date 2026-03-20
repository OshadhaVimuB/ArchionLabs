"""
Dashboard sync service.

After a floor plan is generated or extracted, this module writes a
lightweight reference row into the Supabase ``projects`` table so the
project appears on the landing-page dashboard.

Because the archion-build backend connects to Supabase Postgres with the
``postgres`` role (via DATABASE_URL), it bypasses Row Level Security and
can insert rows without requiring Supabase auth.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def sync_project_to_dashboard(
    db: Session,
    *,
    source_project_id: str,
    name: str,
    description: str | None = None,
    source: str = "build",
) -> None:
    """
    Insert or update a project reference in the Supabase ``public.projects``
    table so it shows up on the landing-page dashboard.

    Uses a check-then-insert/update pattern because PostgreSQL unique
    indexes treat NULLs as distinct, so ON CONFLICT doesn't work when
    ``user_id`` is NULL.
    """
    try:
        now = datetime.now(timezone.utc).isoformat()

        # Check if this project already exists in the dashboard
        result = db.execute(
            text(
                """
                SELECT id FROM public.projects
                WHERE source = :source
                  AND source_project_id = :source_project_id
                  AND user_id IS NULL
                LIMIT 1
                """
            ),
            {"source": source, "source_project_id": source_project_id},
        ).fetchone()

        if result:
            # Update existing row
            db.execute(
                text(
                    """
                    UPDATE public.projects
                    SET name = :name,
                        description = :description,
                        updated_at = :now
                    WHERE id = :id
                    """
                ),
                {
                    "id": result[0],
                    "name": name,
                    "description": description or "",
                    "now": now,
                },
            )
        else:
            # Insert new row
            db.execute(
                text(
                    """
                    INSERT INTO public.projects
                        (user_id, name, description, source, source_project_id, created_at, updated_at)
                    VALUES
                        (NULL, :name, :description, :source, :source_project_id, :now, :now)
                    """
                ),
                {
                    "name": name,
                    "description": description or "",
                    "source": source,
                    "source_project_id": source_project_id,
                    "now": now,
                },
            )

        # Don't commit here — let the caller's transaction handle it
        logger.info(
            f"Synced project '{name}' (source_project_id={source_project_id}) to dashboard"
        )
    except Exception as exc:
        # Best-effort — never break generation because of a dashboard sync failure
        logger.warning(f"Dashboard sync failed (non-fatal): {exc}")
