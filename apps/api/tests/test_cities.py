from uuid import uuid4


def test_list_cities_returns_seeded(client, seeded_city):
    response = client.get("/cities")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 6
    names = {c["name"] for c in body}
    assert names == {"Berlim", "Greenville", "Londres", "Nova York", "São Paulo", "Tóquio"}
    greenville = next(c for c in body if c["name"] == "Greenville")
    assert greenville["id"] == str(seeded_city.id)


def test_get_city_returns_greenville_seed(client, seeded_city):
    response = client.get(f"/cities/{seeded_city.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(seeded_city.id)
    assert body["name"] == "Greenville"
    assert body["baseline_emissions"] == 500000
    assert body["target_year"] == 2035


def test_get_city_404(client):
    response = client.get(f"/cities/{uuid4()}")
    assert response.status_code == 404
    body = response.json()
    assert body["error"] == "http_error"


def test_get_city_invalid_uuid(client):
    response = client.get("/cities/not-a-uuid")
    assert response.status_code == 422


def test_update_baseline(client, seeded_city):
    response = client.patch(
        f"/cities/{seeded_city.id}", json={"baseline_emissions": 480000}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["baseline_emissions"] == 480000
    assert body["target_year"] == 2035  # untouched
    assert body["name"] == "Greenville"


def test_update_target_year(client, seeded_city):
    response = client.patch(f"/cities/{seeded_city.id}", json={"target_year": 2040})
    assert response.status_code == 200
    assert response.json()["target_year"] == 2040


def test_update_rejects_negative_baseline(client, seeded_city):
    response = client.patch(
        f"/cities/{seeded_city.id}", json={"baseline_emissions": -1}
    )
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_update_404(client):
    response = client.patch(f"/cities/{uuid4()}", json={"baseline_emissions": 1})
    assert response.status_code == 404


def test_active_cities_stmt_excludes_archived(session):
    from datetime import datetime
    from app.cities.models import City
    from app.cities.queries import active_cities_stmt

    alive = City(name="Alive", baseline_emissions=1.0, target_year=2050)
    dead = City(
        name="Dead", baseline_emissions=1.0, target_year=2050,
        deleted_at=datetime.utcnow(),
    )
    session.add(alive); session.add(dead); session.commit()

    rows = list(session.exec(active_cities_stmt()).all())
    assert [c.name for c in rows] == ["Alive"]

    rows_all = list(session.exec(active_cities_stmt(include_deleted=True)).all())
    assert {c.name for c in rows_all} == {"Alive", "Dead"}


def test_list_cities_excludes_archived(client, session, admin_token):
    from datetime import datetime
    from app.cities.models import City

    archived = City(
        name="Ghost", baseline_emissions=1.0, target_year=2050,
        deleted_at=datetime.utcnow(),
    )
    session.add(archived); session.commit()

    body = client.get("/cities").json()
    assert all(c["name"] != "Ghost" for c in body)

    body_admin = client.get(
        "/cities?include_deleted=true",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    assert any(c["name"] == "Ghost" for c in body_admin)


def test_create_city_admin(client):
    resp = client.post(
        "/cities",
        json={"name": "Atlantis", "baseline_emissions": 100.0, "target_year": 2050},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Atlantis"
    assert body["deleted_at"] is None


def test_create_city_duplicate_case_insensitive(client):
    client.post(
        "/cities",
        json={"name": "Atlantis", "baseline_emissions": 1.0, "target_year": 2050},
    )
    resp = client.post(
        "/cities",
        json={"name": "atlantis", "baseline_emissions": 1.0, "target_year": 2050},
    )
    assert resp.status_code == 409


def test_create_city_requires_admin(anon_client):
    resp = anon_client.post(
        "/cities",
        json={"name": "X", "baseline_emissions": 1.0, "target_year": 2050},
    )
    assert resp.status_code in (401, 403)


def test_soft_delete_city_hides_from_public_list(client, seeded_city):
    resp = client.delete(f"/cities/{seeded_city.id}")
    assert resp.status_code == 200
    assert resp.json()["deleted_at"] is not None
    body = client.get("/cities").json()
    assert all(c["id"] != str(seeded_city.id) for c in body)


def test_soft_delete_is_idempotent(client, seeded_city):
    first = client.delete(f"/cities/{seeded_city.id}").json()
    second = client.delete(f"/cities/{seeded_city.id}").json()
    assert first["deleted_at"] == second["deleted_at"]


def test_get_archived_city_404_public_but_admin_with_flag(client, seeded_city, admin_token):
    client.delete(f"/cities/{seeded_city.id}")
    assert client.get(f"/cities/{seeded_city.id}").status_code == 404
    resp = client.get(
        f"/cities/{seeded_city.id}?include_deleted=true",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200


def test_restore_city(client, seeded_city):
    client.delete(f"/cities/{seeded_city.id}")
    resp = client.post(f"/cities/{seeded_city.id}/restore")
    assert resp.status_code == 200
    assert resp.json()["deleted_at"] is None
    body = client.get("/cities").json()
    assert any(c["id"] == str(seeded_city.id) for c in body)


def test_include_deleted_requires_admin(anon_client):
    resp = anon_client.get("/cities?include_deleted=true")
    assert resp.status_code in (401, 403)
