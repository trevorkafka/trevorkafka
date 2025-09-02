import xml.etree.ElementTree as ET

tree = ET.parse("JMdict_e.xml")
root = tree.getroot()


# #MIKE'S SUGGESTIONS ARE THE FUNCTIONS BELOW
# def GetFirstChild(parent, predicate_fn):
# 	for child in parent:
# 		if predicate_fn(child):
# 			return child
# 	return None


# #TODO: Make this look for gai1
# def IsREleWithRePri(node):
# 	return node.tag == "r_ele" and GetFirstChild(node, lambda x: x.tag == 're_pri')


# def MikeFn():
# 	tree = ET.parse("JMdict_e.xml")
# 	root = tree.getroot()
# 	for element in root:
# 		loan_word_ele = GetFirstChild(element, IsREleWithRePri)
# 		if not loan_word_ele:
# 			continue
# 		sense_tag_ele = GetFirstChild(element, lambda ele: ele.tag == 'sense')
# 		if not sense_tag_ele:
# 			print('Error: sense tag not found')
# 			continue
# 		gloss_ele = GetFirstChild(sense_tag_ele, lambda ele: ele.tag == 'gloss')
# 		print(gloss_ele.text)

#TREVOR'S FUNCTIONS
def GetFirstChildByTag(parent, tag):
	for child in parent:
		if child.tag == tag:
			return child
	return None

#CHATGPT HEPBURN FUNCTION
def hepburn(katakana: str) -> str:
    # Hepburn romanization table
    table = {
        "ア":"a", "イ":"i", "ウ":"u", "エ":"e", "オ":"o",
        "カ":"ka", "キ":"ki", "ク":"ku", "ケ":"ke", "コ":"ko",
        "サ":"sa", "シ":"shi", "ス":"su", "セ":"se", "ソ":"so",
        "タ":"ta", "チ":"chi", "ツ":"tsu", "テ":"te", "ト":"to",
        "ナ":"na", "ニ":"ni", "ヌ":"nu", "ネ":"ne", "ノ":"no",
        "ハ":"ha", "ヒ":"hi", "フ":"fu", "ヘ":"he", "ホ":"ho",
        "マ":"ma", "ミ":"mi", "ム":"mu", "メ":"me", "モ":"mo",
        "ヤ":"ya", "ユ":"yu", "ヨ":"yo",
        "ラ":"ra", "リ":"ri", "ル":"ru", "レ":"re", "ロ":"ro",
        "ワ":"wa", "ヲ":"o", "ン":"n",

         # Dakuten
	    "ガ":"ga", "ギ":"gi", "グ":"gu", "ゲ":"ge", "ゴ":"go",
	    "ザ":"za", "ジ":"ji", "ズ":"zu", "ゼ":"ze", "ゾ":"zo",
	    "ダ":"da", "ヂ":"ji", "ヅ":"zu", "デ":"de", "ド":"do",
	    "バ":"ba", "ビ":"bi", "ブ":"bu", "ベ":"be", "ボ":"bo",

	    # Handakuten
	    "パ":"pa", "ピ":"pi", "プ":"pu", "ペ":"pe", "ポ":"po",
        
        # Digraphs
        "キャ":"kya", "キュ":"kyu", "キョ":"kyo",
        "シャ":"sha", "シュ":"shu", "ショ":"sho",
        "チャ":"cha", "チュ":"chu", "チョ":"cho",
        "ニャ":"nya", "ニュ":"nyu", "ニョ":"nyo",
        "ヒャ":"hya", "ヒュ":"hyu", "ヒョ":"hyo",
        "ミャ":"mya", "ミュ":"myu", "ミョ":"myo",
        "リャ":"rya", "リュ":"ryu", "リョ":"ryo",
        "ギャ":"gya", "ギュ":"gyu", "ギョ":"gyo",
        "ジャ":"ja", "ジュ":"ju", "ジョ":"jo",
        "ヂャ":"ja", "ヂュ":"ju", "ヂョ":"jo",
        "ビャ":"bya", "ビュ":"byu", "ビョ":"byo",
        "ピャ":"pya", "ピュ":"pyu", "ピョ":"pyo",

        # Small a/i/u/e/o combinations (foreign sounds)
        "ファ":"fa", "フィ":"fi", "フェ":"fe", "フォ":"fo", "フゥ":"fu",
        "ウィ":"wi", "ウェ":"we", "ウォ":"wo",
        "ヴァ":"va", "ヴィ":"vi", "ヴ":"vu", "ヴェ":"ve", "ヴォ":"vo",
        "シェ":"she", "ジェ":"je",
        "チェ":"che",
        "ティ":"ti", "トゥ":"tu",
        "ディ":"di", "デュ":"dyu", "ドゥ":"du",
        "ツァ":"tsa", "ツィ":"tsi", "ツェ":"tse", "ツォ":"tso",
        "イェ":"ye",
        "キェ":"kye", "ギェ":"gye",
        "スィ":"si", "ズィ":"zi",
        "テュ":"tyu", "デュ":"dyu",
        "フャ":"fya", "フュ":"fyu", "フョ":"fyo",
        
        # Handled separately
        "ッ":""
    }
    
    vowels = {"a","i","u","e","o"}
    
    result = ""
    i = 0
    while i < len(katakana):
        # Try digraphs first
        if i+1 < len(katakana) and katakana[i:i+2] in table:
            result += table[katakana[i:i+2]]
            i += 2
            continue
        # Handle sokuon (ッ) doubling
        if katakana[i] == "ッ" and i+1 < len(katakana):
            if i+2 < len(katakana) and katakana[i+1:i+3] in table:
                cons = table[katakana[i+1:i+3]][0]
            elif katakana[i+1] in table:
                cons = table[katakana[i+1]][0]
            else:
                cons = ""
            result += cons
            i += 1
            continue
        # Handle chōonpu (ー)
        if katakana[i] == "ー" and result:
            # lengthen the last vowel
            for ch in reversed(result):
                if ch in vowels:
                    result += ch
                    break
            i += 1
            continue
        # Normal kana
        if katakana[i] in table:
            result += table[katakana[i]]
        else:
            result += katakana[i]
        i += 1

    return result

#THE CODE
katakanaList = []

katakanaToSkip = ['ブルセラ']

for element in root:

	if element.tag != 'entry':
		continue

	r_ele = GetFirstChildByTag(element, 'r_ele')    #potentially contains 're_pri', 'reb', and 'sense' tags
	if r_ele == None:
		continue

	re_pri = GetFirstChildByTag(r_ele, 're_pri')    #potentially contains 'gai1' text
	if re_pri == None or re_pri.text != 'gai1':
		continue

	reb = GetFirstChildByTag(r_ele, 'reb')			#contains katakana text
	if reb.text in katakanaToSkip:
		continue

	sense = GetFirstChildByTag(element, 'sense')    #contains gloss tag
	if sense == None:
		continue

	gloss = GetFirstChildByTag(sense, 'gloss')

	katakanaList.append([reb.text, hepburn(reb.text), gloss.text])

print(katakanaList)


# for element in root:

# 	if element.tag == "entry":

# 		for subElement in element:

# 			if subElement.tag == "r_ele":

# 				for subSubElement in subElement:

# 					if subSubElement.tag == "re_pri" and subSubElement.text == "gai1":

# 						isKatakana = True

# 					else

# 						isKatakana = False

# 	if isKatakana == True:

# 		katakanaEntry = []

# 		for subElement in element:

# 			if subElement.tag == "r_ele":

# 				for subSubElement in subElement:

# 					skipThisKatakana = subSubElement.text in katakanaToSkip

# 					if subSubElement.tag == "reb" and skipThisKatakana == False:

# 						katakanaEntry.append(subSubElement.text)

# 						doubleBreak = True

# 						break

# 				if doubleBreak == True:

# 					break

# 		if skipThisKatakana == False:

# 			for subElement in element:

# 				if subElement.tag == "sense":

# 					for subSubElement in subElement:

# 						if subSubElement.tag == "gloss":

# 							katakanaEntry.append(subSubElement.text)

# 							katakanaEntry.append(skipThisKatakana)

# 							katakanaList.append(katakanaEntry)

# 							doublebreak = True

# 							break

# 					if doubleBreak == True:

# 						break

# print(katakanaList)