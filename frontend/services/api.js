import { API_URL } from '../constants/config';

export async function fetchFixtures() {
  const response = await fetch(`${API_URL}/fixtures/premier-league`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
