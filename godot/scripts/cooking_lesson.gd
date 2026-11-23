extends RefCounted
class_name CookingLesson
## Practical kitchen exercise: prepare, cook, season and plate in the correct order.

const ACTIONS := ["prepare", "cook", "season", "plate"]
const ACTION_LABELS := {
	"prepare": "Snijden en voorbereiden",
	"cook": "Garen",
	"season": "Kruiden en proeven",
	"plate": "Dresseren en doorgeven"
}

var player_data: Dictionary

func _init(data: Dictionary) -> void:
	player_data = data
	if not player_data.has("cooking_lesson_stage"):
		player_data["cooking_lesson_stage"] = 0
	if not player_data.has("cooking_lesson_quality"):
		player_data["cooking_lesson_quality"] = 100
	if not player_data.has("cooking_lessons_completed"):
		player_data["cooking_lessons_completed"] = 0

func perform_action(action: String, education, execution_quality := 100) -> Dictionary:
	var stage := int(player_data.get("cooking_lesson_stage", 0))
	var quality := int(player_data.get("cooking_lesson_quality", 100))
	if stage < 0 or stage >= ACTIONS.size():
		stage = 0
		player_data["cooking_lesson_stage"] = 0
	if not ACTIONS.has(action):
		return {"ok": false, "message": "Deze keukenhandeling bestaat niet."}
	if action != ACTIONS[stage]:
		quality = maxi(0, quality - 15)
		player_data["cooking_lesson_quality"] = quality
		return {
			"ok": false,
			"complete": false,
			"quality": quality,
			"message": "Niet de juiste volgorde. Volgende stap: %s." % ACTION_LABELS[ACTIONS[stage]]
		}

	# The practical grade combines process quality with the player's timing in the hands-on station challenge.
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
	return "Praktijkopdracht · Stap %d/4 · Kwaliteit %d/100 · Volgende: %s" % [
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
