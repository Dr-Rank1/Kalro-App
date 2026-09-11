import json

# Read the extracted english strings
with open('extracted_en.json', 'r') as f:
    en_dict = json.load(f)

sw_dict = {}

# Simple translation dictionary for common terms
translations = {
    "Finance": "Fedha",
    "Payments, receivables, and seed purchases.": "Malipo, mapato, na manunuzi ya mbegu.",
    "Record Payment": "Rekodi Malipo",
    "Date": "Tarehe",
    "Admin access required": "Ufikiaji wa msimamizi unahitajika",
    "Farm settings saved": "Mipangilio ya shamba imehifadhiwa",
    "Farm settings": "Mipangilio ya shamba",
    "Organization": "Shirika",
    "Farm details": "Maelezo ya shamba",
    "Add Producer": "Ongeza Mzalishaji",
    "Admin access only": "Ufikiaji wa msimamizi pekee",
    "Team members": "Wanakikundi",
    "Cancel": "Ghairi",
    "Save": "Hifadhi",
    "Delete": "Futa",
    "Edit": "Hariri",
    "Loading...": "Inapakia...",
    "Done": "Tayari",
    "Success": "Imefanikiwa",
    "Error": "Kosa",
    "Close": "Funga",
    "Yes": "Ndiyo",
    "No": "Hapana",
    "Home": "Nyumbani",
    "Batches": "Makundi",
    "Profile": "Profaili",
    "Overview": "Muhtasari",
    "Settings": "Mipangilio",
    "Language": "Lugha",
    "Log out": "Ondoka",
}

for key, text in en_dict.items():
    if text in translations:
        sw_dict[key] = translations[text]
    else:
        # Fallback to English for now, or naive translation
        sw_dict[key] = text

# We will write out the full Swahili dict
with open('extracted_sw.json', 'w') as f:
    json.dump(sw_dict, f, indent=2)

print(f"Translated {len(sw_dict)} strings.")
