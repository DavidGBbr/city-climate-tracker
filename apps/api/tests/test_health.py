def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "city-climate-action-tracker"
    assert body["status"] == "ok"


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
