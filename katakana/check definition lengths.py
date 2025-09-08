import json

with open("extracted_katakana.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for entry in data:

	if len(entry[2]) > 40:

		print(entry[0] + " (" + str(len(entry[2])) + ")")