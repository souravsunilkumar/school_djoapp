import pytest

def test_home_renderpage(client):
    response = client.get('/setup_auth/')
    assert response.status_code == 200