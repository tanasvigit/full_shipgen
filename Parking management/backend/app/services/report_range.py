from datetime import UTC, date, datetime, timedelta


def resolve_report_window(
    range_key: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime, datetime, str]:
    now = datetime.now(UTC)

    if start_date is not None or end_date is not None:
        if start_date is None or end_date is None:
            raise ValueError("Both start_date and end_date are required for a custom range.")
        if start_date > end_date:
            raise ValueError("start_date must not be after end_date.")

        start = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
        end = datetime.combine(end_date, datetime.max.time(), tzinfo=UTC)
        label = f"{start_date.isoformat()} to {end_date.isoformat()}"
        return start, end, label

    # Presets are rolling windows (not calendar week/month) to match UI labels "This Week" / "This Month".
    key = range_key or "7d"
    if key == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now, "today"
    if key == "7d":
        start = now - timedelta(days=7)
        return start, now, "7d"
    if key == "30d":
        start = now - timedelta(days=30)
        return start, now, "30d"

    start = now - timedelta(days=7)
    return start, now, "7d"
