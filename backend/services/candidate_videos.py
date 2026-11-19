from __future__ import annotations
from typing import Any, Iterable
import numpy as np


def _cosine_similarity(left: Iterable[float], right: Iterable[float]) -> float:
    left_values = np.asarray(list(left), dtype=np.float64)
    right_values = np.asarray(list(right), dtype=np.float64)

    if left_values.size == 0 or left_values.shape != right_values.shape:
        return 0.0

    left_norm = np.linalg.norm(left_values)
    right_norm = np.linalg.norm(right_values)

    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0

    similarity = np.dot(left_values, right_values) / (left_norm * right_norm)
    return float(np.clip(similarity, -1.0, 1.0))


def rank_project_posts(profile_embedding: list[float] | None, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not profile_embedding:
        return candidates

    ranked: list[dict[str, Any]] = []
    for candidate in candidates:
        project_embedding = candidate.get("embedding")
        similarity = _cosine_similarity(profile_embedding, project_embedding or [])

        semantic_score = round(max(0.0, (similarity + 1.0) / 2.0) * 100.0, 1)
        combined_base = float(candidate.get("base_score", candidate.get("score", 0)) or 0)

        result = dict(candidate)
        result["semantic_similarity"] = round(similarity, 4)
        result["score"] = round(min(100.0, combined_base * 0.55 + semantic_score * 0.45), 1)
        ranked.append(result)

    ranked.sort(
        key=lambda item: (
            float(item.get("score", 0)),
            str(item.get("created_at", "")),
        ),
        reverse=True,
    )
    return ranked
