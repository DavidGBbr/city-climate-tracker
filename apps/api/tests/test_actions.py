from uuid import uuid4

VALID_PAYLOAD = {
    "title": "LED street lighting conversion",
    "sector": "energy",
    "annual_reduction": 9500,
    "status": "planned",
    "start_year": 2027,
}


def test_list_actions_returns_seeded(client, seeded_city):
    response = client.get(f"/cities/{seeded_city.id}/actions")
    assert response.status_code == 200
    actions = response.json()
    assert len(actions) == 6
    titles = {a["title"] for a in actions}
    assert "Expand bike lane network" in titles
    # ordered by start_year ascending (composting=2022 first)
    assert actions[0]["start_year"] <= actions[-1]["start_year"]


def test_list_actions_404_for_unknown_city(client):
    response = client.get(f"/cities/{uuid4()}/actions")
    assert response.status_code == 404


def test_create_action(client, seeded_city):
    response = client.post(f"/cities/{seeded_city.id}/actions", json=VALID_PAYLOAD)
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == VALID_PAYLOAD["title"]
    assert body["sector"] == "energy"
    assert body["city_id"] == str(seeded_city.id)
    assert "id" in body

    listing = client.get(f"/cities/{seeded_city.id}/actions").json()
    assert len(listing) == 7


def test_create_action_invalid_sector(client, seeded_city):
    bad = {**VALID_PAYLOAD, "sector": "nuclear"}
    response = client.post(f"/cities/{seeded_city.id}/actions", json=bad)
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_create_action_invalid_status(client, seeded_city):
    bad = {**VALID_PAYLOAD, "status": "on hold"}
    response = client.post(f"/cities/{seeded_city.id}/actions", json=bad)
    assert response.status_code == 422


def test_create_action_rejects_negative_reduction(client, seeded_city):
    bad = {**VALID_PAYLOAD, "annual_reduction": -5}
    response = client.post(f"/cities/{seeded_city.id}/actions", json=bad)
    assert response.status_code == 422


def test_update_action_status(client, seeded_city):
    listing = client.get(f"/cities/{seeded_city.id}/actions").json()
    action_id = listing[0]["id"]
    response = client.patch(f"/actions/{action_id}", json={"status": "completed"})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_update_action_404(client):
    response = client.patch(f"/actions/{uuid4()}", json={"status": "completed"})
    assert response.status_code == 404


def test_delete_action(client, seeded_city):
    listing = client.get(f"/cities/{seeded_city.id}/actions").json()
    action_id = listing[0]["id"]
    response = client.delete(f"/actions/{action_id}")
    assert response.status_code == 204

    remaining = client.get(f"/cities/{seeded_city.id}/actions").json()
    assert len(remaining) == 5
    assert action_id not in {a["id"] for a in remaining}


def test_delete_action_404(client):
    response = client.delete(f"/actions/{uuid4()}")
    assert response.status_code == 404
