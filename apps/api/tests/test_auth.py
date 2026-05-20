from uuid import uuid4

from app.core.config import get_settings

VALID_ACTION = {
    "title": "LED street lighting conversion",
    "sector": "energy",
    "annual_reduction": 9500,
    "status": "planned",
    "start_year": 2027,
}


def test_login_success_returns_token(anon_client):
    settings = get_settings()
    response = anon_client.post("/auth/login", json={"password": settings.admin_password})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 20
    assert body["expires_in"] > 0


def test_login_wrong_password_returns_401(anon_client):
    response = anon_client.post("/auth/login", json={"password": "nope"})
    assert response.status_code == 401
    assert response.json()["error"] == "http_error"


def test_login_missing_password_returns_422(anon_client):
    response = anon_client.post("/auth/login", json={})
    assert response.status_code == 422


def test_protected_route_without_token_returns_401(anon_client, seeded_city):
    response = anon_client.post(
        f"/cities/{seeded_city.id}/actions", json=VALID_ACTION
    )
    assert response.status_code == 401


def test_protected_route_with_bad_token_returns_401(anon_client, seeded_city):
    response = anon_client.post(
        f"/cities/{seeded_city.id}/actions",
        json=VALID_ACTION,
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401


def test_protected_route_with_valid_token_succeeds(anon_client, seeded_city, admin_token):
    response = anon_client.post(
        f"/cities/{seeded_city.id}/actions",
        json=VALID_ACTION,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201


def test_public_routes_remain_open(anon_client, seeded_city):
    """Read endpoints must stay accessible without auth (public viewer)."""
    assert anon_client.get("/cities").status_code == 200
    assert anon_client.get(f"/cities/{seeded_city.id}").status_code == 200
    assert anon_client.get(f"/cities/{seeded_city.id}/actions").status_code == 200
    assert anon_client.get(f"/cities/{seeded_city.id}/summary").status_code == 200


def test_city_update_requires_auth(anon_client, seeded_city, admin_token):
    payload = {"target_year": 2040}
    assert anon_client.patch(f"/cities/{seeded_city.id}", json=payload).status_code == 401
    ok = anon_client.patch(
        f"/cities/{seeded_city.id}",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ok.status_code == 200


def test_action_delete_requires_auth(anon_client, seeded_city, admin_token):
    actions = anon_client.get(f"/cities/{seeded_city.id}/actions").json()
    action_id = actions[0]["id"]
    assert anon_client.delete(f"/actions/{action_id}").status_code == 401
    ok = anon_client.delete(
        f"/actions/{action_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ok.status_code == 204


def test_unknown_action_under_auth_returns_404(anon_client, admin_token):
    response = anon_client.delete(
        f"/actions/{uuid4()}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404
