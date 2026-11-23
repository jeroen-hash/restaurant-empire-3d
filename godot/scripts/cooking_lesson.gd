extends RefCounted
class_name CookingLesson
## Practical kitchen exercise with an explicit ingredient-loading step.

const ACTIONS := ["prepare", "load_pan", "cook", "season", "plate_main", "plate_side", "plate_veg", "plate_finish"]
const ACTION_LABELS := {
	"prepare": "Ingrediënten snijden en voorbereiden",
	"load_pan": "De gesneden ingrediënten in de pan doen",
	"cook": "De ingrediënten garen",
	"season": "Kruiden en proeven",
	"plate_main": "Hoofdingrediënt op het bord leggen",
	"plate_side": "Bijgerecht op het bord schikken",
	"plate_veg": "Groenten op het bord schikken",
	"plate_finish": "Saus en laatste afwerking aanbrengen"
}

var player_data: Dictionary

func _init(data: Dictionary) -> void:
	player_data = data
	# Migrate saved progress from the previous four-step lesson to the new
	# five-step flow, inserting the explicit ingredient-loading step.
	var lesson_version := int(player_data.get("cooking_lesson_version", 1))
	if lesson_version < 2:
		var old_stage := int(player_data.get("cooking_lesson_stage", 0))
		var stage_migration := {0: 0, 1: 1, 2: 3, 3: 4}
		player_data["cooking_lesson_stage"] = int(stage_migration.get(old_stage, 0))
		player_data["cooking_lesson_version"] = 2
	if not player_data.has("cooking_lesson_stage"):
		player_data["cooking_lesson_stage"] = 0
	if not player_data.has("cooking_lesson_quality"):
		player_data["cooking_lesson_quality"] = 100
	if not player_data.has("cooking_lessons_completed"):
		player_data["cooking_lessons_completed"] = 0
	if not player_data.has("cooking_pan_loaded"):
		player_data["cooking_pan_loaded"] = false

func perform_action(action: String, education, execution_quality := 100) -> Dictionary:
	var stage := int(player_data.get("cooking_lesson_stage", 0))
	var quality := int(player_data.get("cooking_lesson_quality", 100))
	if stage < 0 or stage >= ACTIONS.size():
		stage = 0
		player_data["cooking_lesson_stage"] = 0
	if not ACTIONS.has(action):
		return {"ok": false, "message": "Deze keukenhandeling bestaat niet."}
	if action == "cook" and not bool(player_data.get("cooking_pan_loaded", false)):
		return {"ok": false, "message": "Je kunt nog niet garen: doe eerst de gesneden ingrediënten in de pan."}
	if action != ACTIONS[stage]:
		return {
			"ok": false,
			"complete": false,
			"quality": quality,
			"message": "Nog niet. Volgende stap: %s." % ACTION_LABELS[ACTIONS[stage]]
		}
	if action == "load_pan":
		player_data["cooking_pan_loaded"] = true
	quality = clampi(roundi(float(quality) * 0.65 + float(clampi(int(execution_quality), 0, 100)) * 0.35), 0, 100)
	player_data["cooking_lesson_quality"] = quality
	stage += 1
	player_data["cooking_lesson_stage"] = stage
	if stage < ACTIONS.size():
		return {
			"ok": true,
			"complete": false,
			"quality": quality,
			"message": "%s voltooid. Volgende stap: %s." % [
				ACTION_LABELS[action],
				ACTION_LABELS[ACTIONS[stage]]
			]
		}

	var study_result: Dictionary = education.study("practice")
	player_data["cooking_lessons_completed"] = int(player_data.get("cooking_lessons_completed", 0)) + 1
	player_data["last_cooking_quality"] = quality
	player_data["cooking_lesson_stage"] = 0
	player_data["cooking_lesson_quality"] = 100
	player_data["cooking_pan_loaded"] = false
	return {
		"ok": true,
		"complete": true,
		"quality": quality,
		"level_ups": int(study_result.get("level_ups", 0)),
		"level": int(study_result.get("level", 1)),
		"message": "Praktijkopdracht geslaagd! Kwaliteit: %d/100. Je praktijkvaardigheid stijgt." % quality
	}

func get_summary() -> String:
	var stage := clampi(int(player_data.get("cooking_lesson_stage", 0)), 0, ACTIONS.size() - 1)
	return "Praktijkopdracht · Stap %d/8 · Kwaliteit %d/100 · Volgende: %s" % [
		stage + 1,
		int(player_data.get("cooking_lesson_quality", 100)),
		ACTION_LABELS[ACTIONS[stage]]
	]

func get_next_action_label() -> String:
	var stage := clampi(int(player_data.get("cooking_lesson_stage", 0)), 0, ACTIONS.size() - 1)
	return ACTION_LABELS[ACTIONS[stage]]

func get_next_action() -> String:
	var stage := clampi(int(player_data.get("cooking_lesson_stage", 0)), 0, ACTIONS.size() - 1)
	return ACTIONS[stage]
