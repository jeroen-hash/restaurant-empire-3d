extends RefCounted
class_name EducationProgression
## Three-year culinary school track. Levels 1–15; exams require both theory and practice.

const MAX_LEVEL := 15
var player_data: Dictionary

func _init(data: Dictionary) -> void:
	player_data = data
	_ensure_defaults()

func _ensure_defaults() -> void:
	if not player_data.has("education_year"):
		player_data["education_year"] = 1
	if not player_data.has("education_level"):
		player_data["education_level"] = 1
	if not player_data.has("education_xp"):
		player_data["education_xp"] = 0
	if not player_data.has("theory_skill"):
		player_data["theory_skill"] = 0
	if not player_data.has("practical_skill"):
		player_data["practical_skill"] = 0
	if not player_data.has("education_status"):
		player_data["education_status"] = "Ingeschreven"

func study(study_type: String) -> Dictionary:
	if is_graduated():
		return _failure("Je hebt je diploma al behaald.")
	if study_type != "theory" and study_type != "practice":
		return _failure("Kies theorie of praktijk.")
	player_data["education_xp"] = int(player_data.get("education_xp", 0)) + 25
	var skill_key := "theory_skill" if study_type == "theory" else "practical_skill"
	player_data[skill_key] = int(player_data.get(skill_key, 0)) + 1
	var level_ups := 0
	while int(player_data["education_xp"]) >= 100 and int(player_data["education_level"]) < MAX_LEVEL:
		player_data["education_xp"] = int(player_data["education_xp"]) - 100
		player_data["education_level"] = int(player_data["education_level"]) + 1
		level_ups += 1
	player_data["career_title"] = "Culinaire student"
	player_data["career_level"] = int(player_data["education_level"])
	return {
		"ok": true,
		"message": "Theorie gevolgd." if study_type == "theory" else "Praktijkles gevolgd.",
		"level_ups": level_ups,
		"level": int(player_data["education_level"]),
		"xp": int(player_data["education_xp"])
	}

func take_exam() -> Dictionary:
	if is_graduated():
		return _failure("Je diploma is al behaald.")
	var year := int(player_data.get("education_year", 1))
	var required_level := year * 5
	var required_skill := year * 2
	if int(player_data.get("education_level", 1)) < required_level:
		return _failure("Je bent nog niet klaar voor het examen. Behaal eerst niveau %d." % required_level)
	if int(player_data.get("theory_skill", 0)) < required_skill or int(player_data.get("practical_skill", 0)) < required_skill:
		player_data["education_status"] = "Jaar %d hernemen" % year
		return {
			"ok": false,
			"failed": true,
			"message": "Niet geslaagd. Je moet jaar %d hernemen en zowel theorie als praktijk bijwerken." % year
		}
	if year >= 3:
		player_data["education_level"] = MAX_LEVEL
		player_data["education_status"] = "Diploma behaald"
		player_data["career_title"] = "Gediplomeerd kok"
		player_data["career_level"] = MAX_LEVEL
		return {"ok": true, "graduated": true, "message": "Proficiat! Je hebt je diploma behaald."}
	player_data["education_year"] = year + 1
	player_data["education_status"] = "Jaar %d gestart" % (year + 1)
	return {"ok": true, "graduated": false, "message": "Geslaagd! Je start nu jaar %d." % (year + 1)}

func is_graduated() -> bool:
	return str(player_data.get("education_status", "")) == "Diploma behaald"

func get_summary() -> String:
	if is_graduated():
		return "Hotelschool · Diploma behaald · Niveau 15/15"
	var year := int(player_data.get("education_year", 1))
	var level := int(player_data.get("education_level", 1))
	return "Hotelschool · Jaar %d/3 · Niveau %d/15 · Theorie %d · Praktijk %d" % [
		year, level, int(player_data.get("theory_skill", 0)), int(player_data.get("practical_skill", 0))
	]

func _failure(message: String) -> Dictionary:
	return {"ok": false, "message": message}
