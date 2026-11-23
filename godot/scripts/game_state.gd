extends Node
## Centrale spelstatus en lokale opslag. Multiplayer/cloud sync komt later.

const SAVE_PATH := "user://restaurant_empire_save.json"
const SAVE_VERSION := 1

var player_data: Dictionary = {
	"career_level": 1,
	"career_title": "Culinaire student",
	"cash": 250.0,
	"day": 1,
	"game_minutes": 8 * 60,
	"position": {"x": -22.0, "y": 0.0, "z": -5.3}
}

var restaurant_data: Dictionary = {
	"name": "ANIMO CAFE",
	"owned": false,
	"reputation": 0.0,
	"stock": {},
	"staff": []
}

func save_game() -> bool:
	var payload := {
		"version": SAVE_VERSION,
		"player": player_data,
		"restaurant": restaurant_data
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Opslaan mislukt: %s" % error_string(FileAccess.get_open_error()))
		return false
	file.store_string(JSON.stringify(payload, "\t"))
	file.close()
	return true

func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		return false
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Bewaarbestand is ongeldig; nieuwe startgegevens worden gebruikt.")
		return false
	if int(parsed.get("version", 0)) != SAVE_VERSION:
		push_warning("Bewaarbestand heeft een niet-ondersteunde versie.")
		return false
	player_data = parsed.get("player", player_data)
	restaurant_data = parsed.get("restaurant", restaurant_data)
	return true
