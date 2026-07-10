from __future__ import annotations

from typing import Any


EVENT_WEIGHTS = {
    "favorite": 5,
    "reservation": 4,
    "review": 3,
    "search": 2,
    "view": 1,
    "unfavorite": -2,
}


def rank_for_user(
    signals: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
    limit: int = 12,
) -> list[dict[str, float | int]]:
    profile = _build_profile(signals, candidates)
    excluded = _strongly_interacted_ids(signals)
    scored: list[dict[str, float | int]] = []

    for candidate in candidates:
        property_id = int(candidate["id"])
        if property_id in excluded:
            continue

        score = 0.0
        score += _match_score(profile, candidate)
        if candidate.get("is_verified"):
            score += 1.5
        score += min(2.0, float(candidate.get("rating_average") or 0) / 2.5)
        scored.append({"property_id": property_id, "score": round(score, 2)})

    scored.sort(key=lambda row: row["score"], reverse=True)
    return scored[:limit]


def rank_similar(
    source: dict[str, Any],
    candidates: list[dict[str, Any]],
    limit: int = 6,
) -> list[dict[str, float | int]]:
    source_id = int(source["id"])
    scored: list[dict[str, float | int]] = []

    for candidate in candidates:
        property_id = int(candidate["id"])
        if property_id == source_id:
            continue

        score = 0.0
        if candidate.get("commune") == source.get("commune"):
            score += 5.0
        elif candidate.get("city") == source.get("city"):
            score += 3.0

        if candidate.get("type") == source.get("type"):
            score += 3.0

        if candidate.get("listing_type") == source.get("listing_type"):
            score += 2.0

        score += _price_proximity_score(
            float(source.get("price") or 0),
            float(candidate.get("price") or 0),
            0.35,
        )

        source_amenities = set(source.get("amenity_ids") or [])
        candidate_amenities = set(candidate.get("amenity_ids") or [])
        if source_amenities and candidate_amenities:
            score += len(source_amenities & candidate_amenities) * 0.5

        if candidate.get("is_verified"):
            score += 1.0

        scored.append({"property_id": property_id, "score": round(score, 2)})

    scored.sort(key=lambda row: row["score"], reverse=True)
    return scored[:limit]


def _build_profile(
    signals: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
) -> dict[str, Any]:
    by_id = {int(item["id"]): item for item in candidates}
    cities: dict[str, float] = {}
    communes: dict[str, float] = {}
    types: dict[str, float] = {}
    listing_types: dict[str, float] = {}
    prices: list[float] = []

    for signal in signals:
        property_id = int(signal["property_id"])
        candidate = by_id.get(property_id)
        if candidate is None:
            continue

        weight = max(1, abs(int(signal.get("weight") or EVENT_WEIGHTS.get(signal.get("event_type", "view"), 1))))

        city = candidate.get("city")
        if city:
            cities[city] = cities.get(city, 0) + weight

        commune = candidate.get("commune")
        if commune:
            communes[commune] = communes.get(commune, 0) + weight

        prop_type = candidate.get("type")
        if prop_type:
            types[prop_type] = types.get(prop_type, 0) + weight

        listing_type = candidate.get("listing_type")
        if listing_type:
            listing_types[listing_type] = listing_types.get(listing_type, 0) + weight

        if candidate.get("price") is not None:
            prices.append(float(candidate["price"]))

    avg_price = sum(prices) / len(prices) if prices else None

    return {
        "cities": cities,
        "communes": communes,
        "types": types,
        "listing_types": listing_types,
        "avg_price": avg_price,
    }


def _match_score(profile: dict[str, Any], candidate: dict[str, Any]) -> float:
    score = 0.0
    commune = candidate.get("commune")
    city = candidate.get("city")

    if commune and commune in profile["communes"]:
        score += 3.0
    elif city and city in profile["cities"]:
        score += 2.0

    prop_type = candidate.get("type")
    if prop_type and prop_type in profile["types"]:
        score += 2.0

    listing_type = candidate.get("listing_type")
    if listing_type and listing_type in profile["listing_types"]:
        score += 1.0

    avg_price = profile.get("avg_price")
    if avg_price and candidate.get("price") is not None:
        score += _price_proximity_score(float(avg_price), float(candidate["price"]), 0.25)

    return score


def _price_proximity_score(reference: float, price: float, tolerance: float) -> float:
    if reference <= 0 or price <= 0:
        return 0.0

    ratio = abs(price - reference) / reference
    if ratio > tolerance:
        return 0.0

    return 2.0 * (1 - ratio / tolerance)


def _strongly_interacted_ids(signals: list[dict[str, Any]]) -> list[int]:
    counts: dict[int, int] = {}
    for signal in signals:
        if signal.get("event_type") in {"favorite", "reservation"}:
            property_id = int(signal["property_id"])
            counts[property_id] = counts.get(property_id, 0) + 1

    return [property_id for property_id, count in counts.items() if count > 0]
