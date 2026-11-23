extends Node3D

const WorldBuilderScript = preload("res://scripts/world_builder.gd")
const PlayerControllerScript = preload("res://scripts/player_controller.gd")
const EconomyScript = preload("res://scripts/restaurant_economy.gd")
const EducationScript = preload("res://scripts/education_progression.gd")
const CookingLessonScript = preload("res://scripts/cooking_lesson.gd")

var player: PlayerController
var economy
var education
var cooking_lesson
var status_label: Label
var education_label: Label
var cooking_label: Label
var message_label: Label
var save_label: Label
var world: WorldBuilder
var clock_accumulator := 0.0
var autosave_accumulator := 0.0
var interact_button: Button
var pause_button: Button
var camera_button: Button
var credits_dialog: AcceptDialog
var game_paused := false

func _ready() -> void:
	_setup_input()
	GameState.load_game()
	economy = EconomyScript.new(GameState.player_data, GameState.restaurant_data)
	education = EducationScript.new(GameState.player_data)
	cooking_lesson = CookingLessonScript.new(GameState.player_data)
	world = WorldBuilderScript.new()
	world.name = "World"
	add_child(world)

	player = PlayerControllerScript.new()
	player.set_character_type(str(GameState.player_data.get("avatar_type", "man")))
	add_child(player)
	var saved_position: Dictionary = GameState.player_data.get("position", {"x": -25.0, "y": 0.0, "z": -5.0})
	if is_equal_approx(float(saved_position.get("x", -25.0)), -22.0) and is_equal_approx(float(saved_position.get("z", -5.0)), -5.3):
		saved_position = {"x": -25.0, "y": 0.0, "z": -5.0}
	player.set_spawn_position(Vector3(
		float(saved_position.get("x", 0.0)),
		float(saved_position.get("y", 0.0)),
		float(saved_position.get("z", 5.0))
	))
	_build_hud()
	_refresh_education_ui()

func _process(delta: float) -> void:
	if Input.is_action_just_pressed("interact"):
		_on_interact_with_kitchen()
	if player != null:
		var p := player.global_position
		GameState.player_data["position"] = {"x": p.x, "y": p.y, "z": p.z}
		if is_instance_valid(interact_button):
			var station := _get_nearest_cooking_station(p)
			interact_button.visible = not station.is_empty() and float(station["distance"]) <= 2.6
			if interact_button.visible:
				interact_button.text = "WERKPOST · %s" % str(station["button"])
			else:
				interact_button.text = "LOOP NAAR DE VOLGENDE WERKPOST"

	# Automatisch bewaren, ook als de speler lang bezig is.
	autosave_accumulator += delta
	if autosave_accumulator >= 30.0:
		autosave_accumulator = 0.0
		_save_now()

	# Eén seconde echt = één minuut spel; een volledige dag duurt 24 minuten.
	clock_accumulator += delta
	if clock_accumulator >= 1.0:
		var elapsed_minutes := int(clock_accumulator)
		clock_accumulator -= float(elapsed_minutes)
		var game_minutes := int(GameState.player_data.get("game_minutes", 480)) + elapsed_minutes
		while game_minutes >= 1440:
			game_minutes -= 1440
			GameState.player_data["day"] = int(GameState.player_data.get("day", 1)) + 1
		GameState.player_data["game_minutes"] = game_minutes
		if world != null:
			world.set_game_time(game_minutes)
		if is_instance_valid(status_label):
			status_label.text = "%s  ·  Dag %d  ·  %02d:%02d" % [
				str(GameState.player_data.get("career_title", "Culinaire student")),
				int(GameState.player_data.get("day", 1)),
				int(game_minutes / 60),
				game_minutes % 60
			]

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_now()

func _setup_input() -> void:
	_add_key_action("move_forward", [KEY_W, KEY_UP])
	_add_key_action("move_back", [KEY_S, KEY_DOWN])
	_add_key_action("move_left", [KEY_A, KEY_LEFT])
	_add_key_action("move_right", [KEY_D, KEY_RIGHT])
	_add_key_action("interact", [KEY_E])

func _add_key_action(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for keycode in keys:
		var event := InputEventKey.new()
		event.physical_keycode = keycode
		InputMap.action_add_event(action, event)

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	layer.name = "HUD"
	add_child(layer)
	var panel := PanelContainer.new()
	panel.position = Vector2(10, 10)
	panel.custom_minimum_size = Vector2(280, 190)
	layer.add_child(panel)
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(260, 180)
	panel.add_child(scroll)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(column)
	layer.process_mode = Node.PROCESS_MODE_ALWAYS
	var title := Label.new()
	title.text = "ANIMO  ·  RESTAURANT EMPIRE 3D"
	column.add_child(title)
	status_label = Label.new()
	var initial_minutes := int(GameState.player_data.get("game_minutes", 480))
	status_label.text = "%s  ·  Dag %d  ·  %02d:%02d" % [
		str(GameState.player_data.get("career_title", "Culinaire student")),
		int(GameState.player_data.get("day", 1)),
		int(initial_minutes / 60),
		initial_minutes % 60
	]
	column.add_child(status_label)
	education_label = Label.new()
	column.add_child(education_label)
	var avatar_title := Label.new()
	avatar_title.text = "KIES JE PERSONAGE"
	column.add_child(avatar_title)
	var avatar_row := HBoxContainer.new()
	column.add_child(avatar_row)
	var male_button := Button.new()
	male_button.text = "MAN"
	male_button.pressed.connect(_on_avatar_selected.bind("man"))
	avatar_row.add_child(male_button)
	var female_button := Button.new()
	female_button.text = "VROUW"
	female_button.pressed.connect(_on_avatar_selected.bind("woman"))
	avatar_row.add_child(female_button)
	cooking_label = Label.new()
	cooking_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(cooking_label)
	message_label = Label.new()
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_label.text = "Start je praktijkopdracht met: " + cooking_lesson.get_next_action_label() + "."
	column.add_child(message_label)

	var study_row := HBoxContainer.new()
	column.add_child(study_row)
	var theory_button := Button.new()
	theory_button.text = "THEORIELES"
	theory_button.pressed.connect(_on_study_theory)
	study_row.add_child(theory_button)
	var cooking_title := Label.new()
	cooking_title.text = "PRAKTIJKKEUKEN · LOOP NAAR DE JUISTE WERKPOST"
	column.add_child(cooking_title)

	var exam_button := Button.new()
	exam_button.text = "EXAMEN AFLEGGEN"
	exam_button.pressed.connect(_on_take_exam)
	column.add_child(exam_button)

	interact_button = Button.new()
	interact_button.text = "LOOP NAAR DE VOLGENDE WERKPOST"
	interact_button.pressed.connect(_on_interact_with_kitchen)
	column.add_child(interact_button)

	camera_button = Button.new()
	camera_button.text = "EERSTE PERSOON"
	camera_button.pressed.connect(_toggle_camera)
	column.add_child(camera_button)

	pause_button = Button.new()
	pause_button.text = "PAUZE"
	pause_button.pressed.connect(_toggle_pause)
	column.add_child(pause_button)

	credits_dialog = AcceptDialog.new()
	credits_dialog.title = "CREDITS & LICENTIES"
	credits_dialog.dialog_text = "Casual Man en Casual Woman — vinish.dev (https://vinish.dev/free-3d-models/), CC BY 4.0.\n\nRestaurantinterieur, restaurantmeubilair en service station — Innerscene, CC0 1.0.\n\nProfessionele opleidingskeuken — 3DAssets.dev, CC0 1.0."
	layer.add_child(credits_dialog)
	var credits_button := Button.new()
	credits_button.text = "CREDITS & LICENTIES"
	credits_button.pressed.connect(_show_credits)
	column.add_child(credits_button)

	save_label = Label.new()
	save_label.text = "BEWEGEN: joystick / WASD · CAMERA: rechts slepen"
	column.add_child(save_label)
	var save_button := Button.new()
	save_button.text = "SPEL OPSLAAN"
	save_button.pressed.connect(_save_now)
	column.add_child(save_button)

func _on_avatar_selected(avatar_type: String) -> void:
	if player == null:
		return
	GameState.player_data["avatar_type"] = avatar_type
	player.set_character_type(avatar_type)
	message_label.text = "Je personage is aangepast."
	_save_now()

func _on_study_theory() -> void:
	_apply_study("theory")

func _add_cooking_button(parent: GridContainer, label_text: String, action: String) -> void:
	var action_button := Button.new()
	action_button.text = label_text
	action_button.pressed.connect(_on_cooking_action.bind(action))
	parent.add_child(action_button)

const COOKING_STATIONS := [
	{"action": "prepare", "name": "SNIJ- EN VOORBEREIDINGSPOST", "button": "SNIJDEN", "position": Vector3(-25.0, 0.0, -6.5)},
	{"action": "cook", "name": "WARME KEUKEN", "button": "GAREN", "position": Vector3(-23.0, 0.0, -6.5)},
	{"action": "season", "name": "KRUIDEN- EN PROEFPOST", "button": "KRUIDEN & PROEVEN", "position": Vector3(-21.0, 0.0, -6.5)},
	{"action": "plate", "name": "DRESSAGE & PAS", "button": "DRESSEREN", "position": Vector3(-19.0, 0.0, -6.5)}
]

func _get_nearest_cooking_station(position: Vector3) -> Dictionary:
	var nearest: Dictionary = {}
	var nearest_distance := INF
	for station in COOKING_STATIONS:
		var distance: float = position.distance_to(station["position"])
		if distance < nearest_distance:
			nearest_distance = distance
			nearest = station.duplicate()
	nearest["distance"] = nearest_distance
	return nearest

func _on_interact_with_kitchen() -> void:
	if player == null:
		return
	var station := _get_nearest_cooking_station(player.global_position)
	if station.is_empty() or float(station["distance"]) > 2.6:
		message_label.text = "Ga dichter bij een werkpost staan om ermee te werken."
		return
	var next_action := str(cooking_lesson.get_next_action())
	if str(station["action"]) != next_action:
		message_label.text = "Dit is de verkeerde werkpost. Volgende stap: %s." % cooking_lesson.get_next_action_label()
		return
	_on_cooking_action(next_action)

func _on_cooking_action(action: String) -> void:
	if not _is_at_culinary_school():
		message_label.text = "Ga naar de ANIMO Culinary School om in de praktijkkeuken te oefenen."
		return
	var result: Dictionary = cooking_lesson.perform_action(action, education)
	if bool(result.get("ok", false)) and world != null:
		world.show_cooking_action(action)
	message_label.text = str(result.get("message", ""))
	if result.get("complete", false) and int(result.get("level_ups", 0)) > 0:
		message_label.text += " Niveau gestegen naar %d." % int(result["level"])
	_refresh_education_ui()
	_save_now()

func _apply_study(study_type: String) -> void:
	if not _is_at_culinary_school():
		message_label.text = "Je moet in de ANIMO Culinary School zijn om les te volgen."
		return
	var result: Dictionary = education.study(study_type)
	message_label.text = str(result.get("message", ""))
	if int(result.get("level_ups", 0)) > 0:
		message_label.text += " Niveau gestegen naar %d." % int(result["level"])
	_refresh_education_ui()
	_save_now()

func _on_take_exam() -> void:
	if not _is_at_culinary_school():
		message_label.text = "Je moet naar de ANIMO Culinary School gaan om examen af te leggen."
		return
	var result: Dictionary = education.take_exam()
	message_label.text = str(result.get("message", ""))
	_refresh_education_ui()
	_save_now()

func _is_at_culinary_school() -> bool:
	if player == null:
		return false
	return player.global_position.distance_to(Vector3(-22.0, 0.0, -9.0)) <= 9.0

func _refresh_education_ui() -> void:
	if is_instance_valid(education_label):
		education_label.text = education.get_summary()
	if is_instance_valid(cooking_label):
		cooking_label.text = cooking_lesson.get_summary()

func _show_credits() -> void:
	if is_instance_valid(credits_dialog):
		credits_dialog.popup_centered()

func _toggle_camera() -> void:
	if player == null:
		return
	var first_person: bool = player.toggle_camera_mode()
	if is_instance_valid(camera_button):
		camera_button.text = "DERDE PERSOON" if first_person else "EERSTE PERSOON"

func _toggle_pause() -> void:
	game_paused = not game_paused
	get_tree().paused = game_paused
	if is_instance_valid(pause_button):
		pause_button.text = "VERDER SPELEN" if game_paused else "PAUZE"
	if game_paused:
		_save_now()

func _save_now() -> void:
	if player != null:
		var p := player.global_position
		GameState.player_data["position"] = {"x": p.x, "y": p.y, "z": p.z}
	var ok := GameState.save_game()
	if is_instance_valid(save_label):
		save_label.text = "Spel opgeslagen" if ok else "Opslaan mislukt"
