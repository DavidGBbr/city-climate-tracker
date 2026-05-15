def test_get_city_returns_greenville_seed(client):
    """Lifespan seeds Greenville with id=1 in a fresh in-memory DB per test."""
    response = client.get("/cities/1")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "Greenville"
    assert body["baseline_emissions"] == 500000
    assert body["target_year"] == 2035


def test_get_city_404(client):
    response = client.get("/cities/999")
    assert response.status_code == 404


def test_update_baseline(client):
    response = client.patch("/cities/1", json={"baseline_emissions": 480000})
    assert response.status_code == 200
    body = response.json()
    assert body["baseline_emissions"] == 480000
    assert body["target_year"] == 2035  # untouched
    assert body["name"] == "Greenville"


def test_update_target_year(client):
    response = client.patch("/cities/1", json={"target_year": 2040})
    assert response.status_code == 200
    assert response.json()["target_year"] == 2040


def test_update_rejects_negative_baseline(client):
    response = client.patch("/cities/1", json={"baseline_emissions": -1})
    assert response.status_code == 422


def test_update_404(client):
    response = client.patch("/cities/999", json={"baseline_emissions": 1})
    assert response.status_code == 404
