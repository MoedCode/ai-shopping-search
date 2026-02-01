#! /usr/bin/env python3
import requests

def list_available_models(api_key):
    # هذا الرابط يسرد كل الموديلات التي يدعمها مفتاحك
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"✅ Found {len(models)} models:")
            for m in models:
                # ابحث عن الموديلات التي تدعم 'generateContent'
                if 'generateContent' in m.get('supportedGenerationMethods', []):
                    print(f"--- Name: {m['name']} (Ready to use)")
        else:
            print(f"🛑 Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Failed: {e}")

list_available_models("AIzaSyBZMmelzEMi3G2x_EPndYuNVtgR1mS_7Iw")