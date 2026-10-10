import requests
import pandas as pd
from bs4 import BeautifulSoup
import time

# The API endpoint
BASE_URL = "https://api.appbuildersph.com/api/apps"

all_apps = []
page = 1

print("Starting to fetch app data...")

while True:
    print(f"Fetching page {page}...")
    try:
        response = requests.get(f"{BASE_URL}?page={page}", timeout=10)
        response.raise_for_status()
        json_data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching page {page}: {e}")
        break

    apps_on_page = json_data.get('data', [])

    # If no apps are returned, we've reached the end
    if not apps_on_page:
        print("No more apps found. Stopping.")
        break

    for app in apps_on_page:
        # Clean the HTML from the description
        raw_description = app.get('description', '')
        if raw_description:
            soup = BeautifulSoup(raw_description, 'html.parser')
            clean_description = soup.get_text(separator='\n', strip=True)
        else:
            clean_description = ''

        all_apps.append({
            'name': app.get('name'),
            'tagline': app.get('tagline'),
            'category': app.get('category'),
            'platforms': ', '.join(app.get('platforms', [])),
            'features_and_description': clean_description
        })

    page += 1
    # Be respectful to the API
    time.sleep(0.5)

# Save the results
if all_apps:
    df = pd.DataFrame(all_apps)
    output_file = 'appbuildersph_app_features.csv'
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\nSuccess! Extracted {len(all_apps)} apps.")
    print(f"Data saved to {output_file}")
else:
    print("No data was extracted.")