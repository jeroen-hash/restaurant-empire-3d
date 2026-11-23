extends Node3D

const WorldBuilderScript = preload("res://scripts/world_builder.gd")
const PlayerControllerScript = preload("res://scripts/player_controller.gd")

var player: PlayerController
var status_label: Label
var save_label: Label

func _ready() -> void:
	_setup_input()
	GameState.load_game()
	var world := WorldBuilderScript.new()
	world.name = "World"
	add_child(world)

	player = PlayerControllerScript.new()
	add_child(player)
	var saved_position: Dictionary = GameState.player_data.get("position", {"x": 0.0, "y": 0.0, "z": 5.0})
	player.set_spawn_position(Vector3(
		float(saved_position.get("x", 0.0)),
		float(saved_position.get("y", 0.0)),
		float(saved_position.get("z", 5.0))
	))
	_build_hud()

func _process(_delta: float) -> void:
	if player != null:
		var p := player.global_position
		GameState.player_data["position"] = {"x": p.x, "y": p.y, "z": p.z}

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_now()

func _setup_input() -> void:
	_add_key_action("move_forward", [KEY_W, KEY_UP])
	_add_key_action("move_back", [KEY_S, KEY_DOWN])
	_add_key_action("move_left", [KEY_A, KEY_LEFT])
	_add_key_action("move_right", [KEY_D, KEY_RIGHT])

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
	panel.position = Vector2(18, 18)
	panel.custom_minimum_size = Vector2(260, 74)
	layer.add_child(panel)
	var column := VBoxContainer.new()
	panel.add_child(column)
	var title := Label.new()
	title.text = "ANIMO  ·  RESTAURANT EMPIRE 3D"
	column.add_child(title)
	status_label = Label.new()
	status_label.text = "Culinaire student  ·  Dag 1"
	column.add_child(status_label)
	save_label = Label.new()
	save_label.text = "WASD / pijlen bewegen  ·  rechts slepen = camera"
	column.add_child(save_label)

	var save_button := Button.new()
	save_button.text = "SPEL OPSLAAN"
	save_button.pressed.connect(_save_now)
	column.add_child(save_button)

func _save_now() -> void:
	if player != null:
		var p := player.global_position
		GameState.player_data["position"] = {"x": p.x, "y": p.y, "z": p.z}
	var ok := GameState.save_game()
	if is_instance_valid(save_label):
		save_label.text = "Spel opgeslagen" if ok else "Opslaan mislukt"
