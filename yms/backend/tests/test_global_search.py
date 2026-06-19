"""Global command-palette search response serialization."""

from uuid import uuid4

from schemas import GlobalSearchOut


def test_global_search_out_accepts_asyncpg_uuid_ids():
    uid = uuid4()
    out = GlobalSearchOut(
        **{
            "results": [
                {
                    "kind": "vehicle",
                    "id": uid,
                    "label": "MH14ST1011",
                    "sub": "Transporter · TRUCK",
                    "meta": "IN_YARD",
                    "payload": {"vehicleId": uid},
                }
            ],
            "unavailable": [],
        }
    )
    assert out.results[0].id == uid
