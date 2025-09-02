import json

with open("extracted_katakana.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for entry in data:

	entry.append([])
	word = entry[0]
	i = len(word) - 1
	
	while i >= 0:

		if word[i] not in ["ャ","ュ","ョ","ァ","ィ","ゥ","ェ","ォ",]:
			entry[3].insert(0,word[i])
			i = i - 1
			continue

		entry[3].insert(0,word[i-1] + word[i])
		i = i - 2

print(json.dumps(data, ensure_ascii=False)) # this trick makes sure the formatting is as a JSON (with doubl quotes) while preserving kana

