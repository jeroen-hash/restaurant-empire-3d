extends Node3D
class_name KitchenInteraction
## Physical first-person/third-person kitchen interactions for the training kitchen.
## Storage is distance-gated; food is removed from stock only when collected.

const InventoryScript = preload("res://scripts/kitchen_inventory.gd")
const SCHOOL_ORIGIN := Vector3(-22.0, 0.0, -9.0)
const REACH := 2.6

var player: CharacterBody3D
var inventory
var panel: PanelContainer
var menu_column: VBoxContainer
var held_visual: Node3D
var fridge_door: Node3D
var freezer_door: Node3D
var fridge_open := false
var freezer_open := false
var board_owned := false
var board_on_counter := false
var knife_owned := false
var knife_in_hand := false
var board_visual: Node3D
var knife_visual: Node3D
var counter_position := Vector3.ZERO
var last_message := "Loop naar een koelkast, diepvries, voorraadrek of werkblad."

func setup(target_player: CharacterBody3D, player_data: Dictionary, hud_layer: CanvasLayer) -> void:
	player = target_player
	inventory = InventoryScript.new(player_data)
	board_on_counter = bool(player_data.get("kitchen_board_on_counter", false))
	knife_in_hand = str(player_data.get("kitchen_held_tool", "")) == "chef_knife"
	_build_kitchen_props()
	_build_menu(hud_layer)
	if board_on_counter:
		_create_board_visual()
	var held_tool := str(player_data.get("kitchen_held_tool", ""))
	if held_tool in ["cutting_board", "chef_knife"]:
		_create_held_tool(held_tool)
	else:
		var held_food := inventory.get_held_item()
		if not held_food.is_empty():
			_create_held_food(str(held_food.get("id", "")))

func _build_kitchen_props() -> void:
	# Positions are inside the existing imported ANIMO culinary-school kitchen.
	_build_storage_unit("ANIMO_Koelkast", SCHOOL_ORIGIN + Vector3(-6.0, 0.0, -2.0), false)
	_build_storage_unit("ANIMO_Diepvries", SCHOOL_ORIGIN + Vector3(-6.0, 0.0, 1.2), true)
	_build_dry_rack(SCHOOL_ORIGIN + Vector3(-6.0, 0.0, 4.5))
	_build_tool_rack(SCHOOL_ORIGIN + Vector3(-3.8, 0.0, 5.5))
	_build_worktop(SCHOOL_ORIGIN + Vector3(-1.1, 0.0, 5.5))

func _material(color: Color, roughness := 0.62, metallic := 0.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = roughness
	mat.metallic = metallic
	return mat

func _box(parent: Node3D, node_name: String, pos: Vector3, size: Vector3, color: Color, metallic := 0.0) -> MeshInstance3D:
	var mesh_node := MeshInstance3D.new()
	mesh_node.name = node_name
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_node.mesh = mesh
	mesh_node.position = pos
	mesh_node.material_override = _material(color, 0.42 if metallic > 0.0 else 0.72, metallic)
	parent.add_child(mesh_node)
	return mesh_node

func _label(parent: Node3D, value: String, pos: Vector3) -> void:
	var label := Label3D.new()
	label.text = value
	label.position = pos
	label.font_size = 32
	label.pixel_size = 0.004
	label.modulate = Color(0.95, 0.88, 0.72)
	label.outline_size = 5
	label.outline_modulate = Color(0.04, 0.05, 0.05)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)

func _build_storage_unit(unit_name: String, world_pos: Vector3, frozen: bool) -> void:
	var root := Node3D.new()
	root.name = unit_name
	root.position = world_pos
	add_child(root)
	var body_color := Color(0.68, 0.73, 0.74) if not frozen else Color(0.76, 0.81, 0.82)
	_box(root, "InsulatedCabinet", Vector3(0, 1.05, 0), Vector3(1.25, 2.1, 0.95), body_color, 0.58)
	var door_pivot := Node3D.new()
	door_pivot.position = Vector3(-0.59, 1.05, 0.49)
	root.add_child(door_pivot)
	var door := _box(door_pivot, "HingedDoor", Vector3(0.59, 0, 0), Vector3(1.18, 2.02, 0.10), Color(0.79, 0.83, 0.84), 0.52)
	_box(door_pivot, "DoorHandle", Vector3(1.02, 0, -0.07), Vector3(0.045, 0.42, 0.08), Color(0.19, 0.22, 0.23), 0.72)
	for shelf_y in [0.55, 1.05, 1.55]:
		_box(root, "VisibleShelf", Vector3(0, shelf_y, 0.22), Vector3(1.05, 0.035, 0.56), Color(0.78, 0.82, 0.82), 0.42)
	_label(root, "ANIMO DIEPVRIES" if frozen else "ANIMO KOELING", Vector3(0, 2.34, 0))
	if frozen:
		freezer_door = door_pivot
	else:
		fridge_door = door_pivot

func _build_dry_rack(world_pos: Vector3) -> void:
	var root := Node3D.new()
	root.name = "ANIMO_DROGE_VOORRAAD"
	root.position = world_pos
	add_child(root)
	for x in [-0.55, 0.55]:
		for z in [-0.20, 0.20]:
			_box(root, "RackPost", Vector3(x, 1.0, z), Vector3(0.055, 2.0, 0.055), Color(0.18, 0.20, 0.20), 0.62)
	for y in [0.35, 0.95, 1.55]:
		_box(root, "MetalShelf", Vector3(0, y, 0), Vector3(1.2, 0.055, 0.55), Color(0.48, 0.52, 0.52), 0.55)
	_label(root, "DROGE STOCK", Vector3(0, 2.25, 0))

func _build_tool_rack(world_pos: Vector3) -> void:
	var root := Node3D.new()
	root.name = "ANIMO_KEUKENGEREI"
	root.position = world_pos
	add_child(root)
	_box(root, "ToolBoard", Vector3(0, 1.0, 0), Vector3(1.25, 1.9, 0.18), Color(0.23, 0.25, 0.24), 0.35)
	for x in [-0.38, 0.0, 0.38]:
		_box(root, "ToolHook", Vector3(x, 1.35, -0.13), Vector3(0.045, 0.20, 0.07), Color(0.74, 0.69, 0.57), 0.68)
	_label(root, "GEREEDSCHAP", Vector3(0, 2.12, 0))

func _build_worktop(world_pos: Vector3) -> void:
	counter_position = world_pos
	var root := Node3D.new()
	root.name = "ANIMO_VOORBEREIDINGSWERKBLAD"
	root.position = world_pos
	add_child(root)
	_box(root, "StainlessWorktop", Vector3(0, 0.92, 0), Vector3(2.2, 0.12, 1.15), Color(0.61, 0.66, 0.67), 0.72)
	_box(root, "WorktopLegLeft", Vector3(-0.88, 0.44, 0), Vector3(0.09, 0.88, 0.09), Color(0.34, 0.38, 0.39), 0.55)
	_box(root, "WorktopLegRight", Vector3(0.88, 0.44, 0), Vector3(0.09, 0.88, 0.09), Color(0.34, 0.38, 0.39), 0.55)
	_label(root, "VOORBEREIDEN", Vector3(0, 1.75, 0))

func _build_menu(hud_layer: CanvasLayer) -> void:
	panel = PanelContainer.new()
	panel.name = "KitchenInteractionMenu"
	panel.anchor_left = 0.5
	panel.anchor_right = 0.5
	panel.anchor_top = 0.5
	panel.anchor_bottom = 0.5
	panel.offset_left = -155
	panel.offset_right = 155
	panel.offset_top = -170
	panel.offset_bottom = 170
	panel.visible = false
	hud_layer.add_child(panel)
	menu_column = VBoxContainer.new()
	panel.add_child(menu_column)

func _clear_menu() -> void:
	for child in menu_column.get_children():
		child.queue_free()

func _show_menu(title_text: String, options: Array[Dictionary]) -> void:
	_clear_menu()
	var title := Label.new()
	title.text = title_text
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu_column.add_child(title)
	for option in options:
		var button := Button.new()
		button.text = str(option.get("label", "KIES"))
		button.custom_minimum_size = Vector2(280, 42)
		button.pressed.connect(_on_menu_option.bind(str(option.get("id", ""))))
		menu_column.add_child(button)
	var close_button := Button.new()
	close_button.text = "SLUITEN"
	close_button.pressed.connect(_close_menu)
	menu_column.add_child(close_button)
	panel.visible = true

func _close_menu() -> void:
	if is_instance_valid(panel):
		panel.visible = false

func get_context() -> Dictionary:
	if player == null:
		return {}
	var pos := player.global_position
	var candidates := [
		{"target": "fridge", "position": SCHOOL_ORIGIN + Vector3(-6.0, 0.0, -2.0), "label": "OPEN KOELKAST"},
		{"target": "freezer", "position": SCHOOL_ORIGIN + Vector3(-6.0, 0.0, 1.2), "label": "OPEN DIEPVRIES"},
		{"target": "dry", "position": SCHOOL_ORIGIN + Vector3(-6.0, 0.0, 4.5), "label": "BEKIJK DROGE STOCK"},
		{"target": "tools", "position": SCHOOL_ORIGIN + Vector3(-3.8, 0.0, 5.5), "label": "NEEM GEREEDSCHAP"},
		{"target": "counter", "position": counter_position, "label": "WERKBLAD"}
	]
	var nearest: Dictionary = {}
	var nearest_distance := INF
	for candidate in candidates:
		var distance := pos.distance_to(candidate["position"])
		if distance < nearest_distance:
			nearest_distance = distance
			nearest = candidate
	if nearest_distance > REACH:
		return {}
	var target := str(nearest["target"])
	if target == "counter":
		if not board_on_counter and _is_holding("cutting_board"):
			return {"label": "LEG SNIJPLANK NEER", "target": "place_board"}
		if not inventory.get_held_item().is_empty():
			return {"label": "LEG INGREDIËNT NEER", "target": "place_food"}
		if board_on_counter and knife_in_hand and not Dictionary(GameState.player_data.get("kitchen_worktop", {})).is_empty():
			return {"label": "SNIJD INGREDIËNT", "target": "cut"}
		if knife_in_hand:
			return {"label": "LEG MES NEER", "target": "place_knife"}
	return {"label": str(nearest["label"]), "target": target}

func _is_holding(item_id: String) -> bool:
	return str(GameState.player_data.get("kitchen_held_tool", "")) == item_id

func interact() -> void:
	var context := get_context()
	if context.is_empty():
		return
	match str(context.get("target", "")):
		"fridge":
			fridge_open = not fridge_open
			_animate_door(fridge_door, fridge_open)
			if fridge_open:
				_show_storage_menu("KOELKAST · KIES PRODUCT", "fridge")
			else:
				_close_menu()
				last_message = "Koelkast gesloten."
		"freezer":
			freezer_open = not freezer_open
			_animate_door(freezer_door, freezer_open)
			if freezer_open:
				_show_storage_menu("DIEPVRIES · KIES PRODUCT", "freezer")
			else:
				_close_menu()
				last_message = "Diepvries gesloten."
		"dry":
			_show_storage_menu("DROGE VOORRAAD · KIES PRODUCT", "dry")
		"tools":
			_show_menu("KEUKENGEREI", [
				{"id": "take_board", "label": "NEEM SNIJPLANK"},
				{"id": "take_knife", "label": "NEEM KOKSMES"}
			])
		"place_board":
			board_on_counter = true
			GameState.player_data["kitchen_board_on_counter"] = true
			GameState.player_data["kitchen_held_tool"] = ""
			_create_board_visual()
			_clear_held_visual()
			last_message = "Snijplank ligt op het werkblad."
		"place_knife":
			knife_in_hand = false
			GameState.player_data["kitchen_held_tool"] = ""
			_clear_held_visual()
			last_message = "Mes veilig op het werkblad gelegd."
		"place_food":
			var result: Dictionary = inventory.put_down_item()
			last_message = str(result.get("message", ""))
			if bool(result.get("ok", false)):
				_clear_held_visual()
				_create_food_visual(str(result.get("item", "")))
		"cut":
			_cut_ingredient()
		"counter":
			last_message = "Neem eerst een snijplank, ingrediënt en kok mes."
	if is_instance_valid(player):
		player.set_working_action("prepare", false)

func _animate_door(door: Node3D, opened: bool) -> void:
	if not is_instance_valid(door):
		return
	var tween := create_tween()
	tween.tween_property(door, "rotation:y", deg_to_rad(-105.0 if opened else 0.0), 0.28)

func _show_storage_menu(title_text: String, storage_type: String) -> void:
	var options: Array[Dictionary] = []
	for item in inventory.get_storage_items(storage_type):
		options.append({"id": str(item["id"]), "label": "%s  ·  %.0f %s" % [str(item["name"]), float(item["quantity"]), str(item["unit"])]})
	if options.is_empty():
		last_message = "Deze opslag is leeg."
		_show_menu(title_text, [{"id": "none", "label": "GEEN PRODUCTEN BESCHIKBAAR"}])
	else:
		_show_menu(title_text, options)

func _on_menu_option(option_id: String) -> void:
	match option_id:
		"take_board":
			if not inventory.get_held_item().is_empty() or not str(GameState.player_data.get("kitchen_held_tool", "")).is_empty():
				last_message = "Je handen zijn al bezet. Leg eerst neer wat je vasthoudt."
			else:
				board_owned = true
				GameState.player_data["kitchen_held_tool"] = "cutting_board"
				_create_held_tool("cutting_board")
				last_message = "Je hebt de snijplank genomen. Leg ze op het werkblad."
		"take_knife":
			if not inventory.get_held_item().is_empty() or not str(GameState.player_data.get("kitchen_held_tool", "")).is_empty():
				last_message = "Je handen zijn al bezet. Leg eerst neer wat je vasthoudt."
			else:
				knife_owned = true
				knife_in_hand = true
				GameState.player_data["kitchen_held_tool"] = "chef_knife"
				_create_held_tool("chef_knife")
				last_message = "Je hebt het kok mes genomen."
		"none":
			last_message = "Er is geen voorraad beschikbaar."
		_:
			if not str(GameState.player_data.get("kitchen_held_tool", "")).is_empty():
				last_message = "Leg eerst het keukengerei neer voordat je een ingrediënt neemt."
				_close_menu()
				return
			var stock: Dictionary = GameState.player_data.get("kitchen_stock", {})
			var item: Dictionary = stock.get(option_id, {})
			var amount := 1.0
			if str(item.get("unit", "")) == "gram":
				amount = 100.0
			var result: Dictionary = inventory.take_item(option_id, amount)
			last_message = str(result.get("message", ""))
			if bool(result.get("ok", false)):
				_create_held_food(option_id)
	_close_menu()

func _create_held_food(item_id: String) -> void:
	_clear_held_visual()
	held_visual = Node3D.new()
	held_visual.name = "HeldIngredient"
	player.add_child(held_visual)
	held_visual.position = Vector3(0.30, 1.05, -0.46)
	var color := Color(0.78, 0.58, 0.38)
	if item_id == "carrot":
		color = Color(0.92, 0.34, 0.08)
	elif item_id == "potato":
		color = Color(0.62, 0.45, 0.27)
	elif item_id == "frozen_peas":
		color = Color(0.27, 0.55, 0.20)
	elif item_id == "butter":
		color = Color(0.96, 0.82, 0.36)
	var mesh := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.12
	sphere.height = 0.22
	mesh.mesh = sphere
	mesh.material_override = _material(color)
	held_visual.add_child(mesh)

func _create_held_tool(tool_id: String) -> void:
	_clear_held_visual()
	held_visual = Node3D.new()
	held_visual.name = "HeldKitchenTool"
	player.add_child(held_visual)
	held_visual.position = Vector3(0.32, 1.0, -0.42)
	if tool_id == "cutting_board":
		var board := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(0.48, 0.035, 0.34)
		board.mesh = mesh
		board.material_override = _material(Color(0.46, 0.27, 0.13))
		held_visual.add_child(board)
	else:
		var blade := _box(held_visual, "KnifeBlade", Vector3(0, 0, 0), Vector3(0.30, 0.025, 0.055), Color(0.76, 0.81, 0.83), 0.82)
		blade.rotation.z = deg_to_rad(-12)
		var handle := _box(held_visual, "KnifeHandle", Vector3(-0.17, -0.01, 0), Vector3(0.16, 0.045, 0.075), Color(0.19, 0.13, 0.09))
		handle.rotation.z = deg_to_rad(-12)

func _clear_held_visual() -> void:
	if is_instance_valid(held_visual):
		held_visual.queue_free()
	held_visual = null

func _create_board_visual() -> void:
	if is_instance_valid(board_visual):
		board_visual.queue_free()
	board_visual = Node3D.new()
	board_visual.name = "PlacedCuttingBoard"
	add_child(board_visual)
	board_visual.global_position = counter_position + Vector3(0, 1.02, 0)
	var mesh := MeshInstance3D.new()
	var board_mesh := BoxMesh.new()
	board_mesh.size = Vector3(0.78, 0.045, 0.54)
	mesh.mesh = board_mesh
	mesh.material_override = _material(Color(0.48, 0.29, 0.15))
	board_visual.add_child(mesh)

func _create_food_visual(item_id: String) -> void:
	var food := MeshInstance3D.new()
	food.name = "PreparedIngredient_" + item_id
	var mesh := SphereMesh.new()
	mesh.radius = 0.085
	mesh.height = 0.12
	food.mesh = mesh
	food.material_override = _material(Color(0.82, 0.56, 0.31))
	if is_instance_valid(board_visual):
		board_visual.add_child(food)
		food.position = Vector3(randf_range(-0.20, 0.20), 0.10, randf_range(-0.12, 0.12))

func _cut_ingredient() -> void:
	var bench: Dictionary = GameState.player_data.get("kitchen_worktop", {})
	if bench.is_empty():
		last_message = "Leg eerst een ingrediënt op de snijplank."
		return
	if not board_on_counter or not knife_in_hand:
		last_message = "Je hebt een snijplank op het werkblad en een mes in je hand nodig."
		return
	var item_id := str(bench.keys()[0])
	var result: Dictionary = inventory.consume_worktop_item(item_id, 1.0)
	if bool(result.get("ok", false)):
		GameState.player_data["kitchen_prepared"] = str(GameState.player_data.get("kitchen_prepared", "")) + item_id + ","
		last_message = "Je hebt %s gesneden. Het ingrediënt is verbruikt en als voorbereid geregistreerd." % item_id
		if is_instance_valid(board_visual):
			for child in board_visual.get_children():
				if child.name.begins_with("PreparedIngredient_"):
					child.queue_free()
		if is_instance_valid(player):
			player.set_working_action("prepare", true)
			await get_tree().create_timer(0.65).timeout
			player.set_working_action("prepare", false)
	else:
		last_message = str(result.get("message", "Snijden is niet gelukt."))

func get_last_message() -> String:
	return last_message
