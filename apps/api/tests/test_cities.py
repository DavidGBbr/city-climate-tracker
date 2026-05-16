from uuid import uuid4


def test_list_cities_returns_seeded(client, seeded_city):
    response = client.get("/cities")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["id"] == str(seeded_city.id)
    assert body[0]["name"] == "Greenville"


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
