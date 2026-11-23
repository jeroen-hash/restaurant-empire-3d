extends Node3D
class_name PhysicalKitchenV1
## First physical-interaction prototype. Meshes in this file are temporary
## gameplay blockout objects, not final product art.

signal status_changed(message: String)

const PICKUP_DISTANCE := 2.6
const DROP_DISTANCE := 1.8

var player: PlayerController
var hand_anchor: Node3D
var held_item: Node3D
var held_item_id := ""
var stock := {"chicken": 4, "carrot": 6, "potato": 6}
var item_nodes: Dictionary = {}
var board_area: Area3D
var board_has_ingredient := false
var chicken_cut := false
var knife_taken := false
var hob_area: Area3D
var pan_area: Area3D
var plate_area: Area3D
var pan_on_hob := false
var chicken_in_pan := false
var chicken_cooked := false
var plated := false

func _ready() -> void:
	name = "PhysicalKitchenV1"
	_build_blockout()

func setup_player(value: PlayerController) -> void:
	player = value
	if not is_instance_valid(player):
		return
	hand_anchor = Node3D.new()
	hand_anchor.name = "HeldObjectAnchor"
	hand_anchor.position = Vector3(0.0, -0.62, -0.28)
	player.right_arm.add_child(hand_anchor)

func has_interactable_target() -> bool:
	return is_instance_valid(player) and not _camera_hit().is_empty()

func handle_interaction() -> bool:
	if not is_instance_valid(player) or not is_instance_valid(player.camera):
		return false
	var hit := _camera_hit()
	if is_instance_valid(held_item):
		if hit.has("collider") and hit.collider == hob_area and held_item_id == "pan":
			_place_pan_on_hob()
			return true
		if hit.has("collider") and hit.collider == board_area and held_item_id == "chicken":
			_place_chicken_on_board()
			return true
		if hit.has("collider") and hit.collider == board_area and held_item_id == "knife" and board_has_ingredient and not chicken_cut:
			_cut_chicken_on_board()
			return true
		if hit.has("collider") and hit.collider == hob_area and held_item_id == "":
			_start_cooking()
			return true
		if hit.has("collider") and hit.collider == board_area and held_item_id == "pan" and chicken_cut and not chicken_in_pan:
			_load_chicken_into_pan()
			return true
		if hit.has("collider") and hit.collider == plate_area and held_item_id == "plate" and chicken_cooked:
			_serve_to_plate()
			return true
		if hit.has("collider") and str(hit.collider.get_meta("item_id", "")) == "knife":
			return true
		_drop_held_item()
		return true
	if hit.is_empty():
		return false
	var target := hit.collider as Node3D
	if target == null:
		return false
	var item_id := str(target.get_meta("item_id", ""))
	if item_id == "":
		return false
	if item_id in ["knife", "pan", "plate"]:
		if item_id == "knife":
			knife_taken = true
		_pickup(target, item_id)
		return true
	if item_id in ["chicken", "carrot", "potato"] and int(stock.get(item_id, 0)) > 0:
		stock[item_id] = int(stock[item_id]) - 1
		_pickup(target, item_id)
		status_changed.emit("%s uit de koeling genomen · voorraad: %d" % [_item_label(item_id), int(stock[item_id])])
		return true
	return false

func _camera_hit() -> Dictionary:
	var origin := player.camera.global_position
	var end := origin + (-player.camera.global_basis.z * PICKUP_DISTANCE)
	var query := PhysicsRayQueryParameters3D.create(origin, end)
	query.collide_with_areas = true
	query.exclude = [player.get_rid()]
	return get_world_3d().direct_space_state.intersect_ray(query)

func _pickup(item: Node3D, item_id: String) -> void:
	if is_instance_valid(held_item):
		return
	held_item = item
	held_item_id = item_id
	if item is RigidBody3D:
		(item as RigidBody3D).freeze = true
		(item as RigidBody3D).collision_layer = 0
		(item as RigidBody3D).collision_mask = 0
	var old_parent := item.get_parent()
	old_parent.remove_child(item)
	hand_anchor.add_child(item)
	item.transform = Transform3D.IDENTITY
	item.position = Vector3.ZERO
	item.rotation = Vector3.ZERO
	status_changed.emit("%s vastgenomen. Breng het naar het werkblad." % _item_label(item_id))

func _drop_held_item() -> void:
	if not is_instance_valid(held_item):
		return
	var item := held_item
	var world_transform := item.global_transform
	hand_anchor.remove_child(item)
	add_child(item)
	item.global_transform = world_transform
	if item is RigidBody3D:
		(item as RigidBody3D).collision_layer = 1
		(item as RigidBody3D).collision_mask = 1
	held_item = null
	var dropped_id := held_item_id
	held_item_id = ""
	status_changed.emit("%s neergelegd." % _item_label(dropped_id))

func _place_chicken_on_board() -> void:
	if not is_instance_valid(held_item):
		return
	var item := held_item
	hand_anchor.remove_child(item)
	board_area.add_child(item)
	item.transform = Transform3D.IDENTITY
	item.position = Vector3(0.0, 0.13, 0.0)
	item.rotation = Vector3.ZERO
	if item is RigidBody3D:
		(item as RigidBody3D).collision_layer = 0
		(item as RigidBody3D).collision_mask = 0
	held_item = null
	held_item_id = ""
	board_has_ingredient = true
	status_changed.emit("Kip ligt op de snijplank. Neem nu het mes van het messenrek.")

func _cut_chicken_on_board() -> void:
	var original: Node = null
	for child in board_area.get_children():
		if child is RigidBody3D and str(child.get_meta("item_id", "")) == "chicken":
			original = child
			break
	if original == null:
		status_changed.emit("De kip ligt niet meer op de snijplank.")
		return
	original.queue_free()
	# Temporary visible cut pieces; replace with authored food meshes in the art pass.
	for i in range(5):
		var piece := MeshInstance3D.new()
		piece.name = "TemporaryCutChicken_%02d" % i
		var mesh := BoxMesh.new()
		mesh.size = Vector3(0.075, 0.045, 0.065)
		piece.mesh = mesh
		var material := StandardMaterial3D.new()
		material.albedo_color = Color(0.82, 0.64, 0.52)
		piece.material_override = material
		piece.position = Vector3(-0.18 + float(i % 3) * 0.16, 0.10, -0.08 + float(i / 3) * 0.15)
		board_area.add_child(piece)
	chicken_cut = true
	status_changed.emit("Kip is zichtbaar in stukken gesneden. Neem de pan van het rek en plaats die op de kookplaat.")

func _place_pan_on_hob() -> void:
	var pan := held_item
	hand_anchor.remove_child(pan)
	hob_area.add_child(pan)
	pan.transform = Transform3D.IDENTITY
	pan.position = Vector3(0.0, 0.16, 0.0)
	if pan is RigidBody3D:
		(pan as RigidBody3D).collision_layer = 0
		(pan as RigidBody3D).collision_mask = 0
	pan_area = hob_area
	held_item = null
	held_item_id = ""
	pan_on_hob = true
	status_changed.emit("Pan staat op de kookplaat. Neem de pan vast en richt op de snijplank om de gesneden kip toe te voegen.")

func _load_chicken_into_pan() -> void:
	if not pan_on_hob or not chicken_cut or chicken_in_pan:
		return
	for child in board_area.get_children():
		if child is MeshInstance3D and child.name.begins_with("TemporaryCutChicken"):
			child.visible = false
	var pan_piece := MeshInstance3D.new()
	pan_piece.name = "TemporaryChickenInPan"
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.24, 0.07, 0.18)
	pan_piece.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.76, 0.56, 0.42)
	pan_piece.material_override = material
	pan_piece.position = Vector3(0.0, 0.24, 0.0)
	hob_area.add_child(pan_piece)
	chicken_in_pan = true
	status_changed.emit("Kip zit in de pan. Maak je handen vrij en richt op de kookplaat om te bakken.")

func _start_cooking() -> void:
	if not chicken_in_pan or chicken_cooked:
		return
	chicken_cooked = true
	for child in hob_area.get_children():
		if child is MeshInstance3D and child.name == "TemporaryChickenInPan":
			var material := StandardMaterial3D.new()
			material.albedo_color = Color(0.48, 0.29, 0.17)
			child.material_override = material
	status_changed.emit("De kip is gaar in dit prototype. Neem een bord en richt op de serveerplek om te dresseren.")

func _serve_to_plate() -> void:
	if not chicken_cooked:
		return
	var plate := held_item
	hand_anchor.remove_child(plate)
	plate_area.add_child(plate)
	plate.transform = Transform3D.IDENTITY
	plate.position = Vector3(0.0, 0.12, 0.0)
	if plate is RigidBody3D:
		(plate as RigidBody3D).collision_layer = 0
		(plate as RigidBody3D).collision_mask = 0
	var serving := MeshInstance3D.new()
	serving.name = "TemporaryPlatedChicken"
	var mesh := SphereMesh.new()
	mesh.radius = 0.12
	mesh.height = 0.07
	serving.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.52, 0.32, 0.20)
	serving.material_override = material
	serving.position = Vector3(0.0, 0.19, 0.0)
	plate_area.add_child(serving)
	held_item = null
	held_item_id = ""
	plated = true
	status_changed.emit("Gerecht is op het bord gezet. Eerste fysieke kook- en serveerflow voltooid (prototype).")

func _build_blockout() -> void:
	# Layout uses the imported professional kitchen as its visual background.
	# These small meshes are deliberately marked as temporary interaction proxies.
	var fridge := _make_station("Koeling · voorraad", Vector3(-4.2, 0.0, -1.4), Vector3(1.0, 2.0, 0.9), Color(0.58, 0.66, 0.68))
	fridge.name = "TemporaryColdStorageProxy"
	_add_item("chicken", Vector3(-4.15, 1.15, -1.35), Color(0.78, 0.54, 0.40), Vector3(0.22, 0.13, 0.14))
	_add_item("carrot", Vector3(-3.75, 1.12, -1.35), Color(0.95, 0.36, 0.08), Vector3(0.08, 0.22, 0.08))
	_add_item("potato", Vector3(-3.35, 1.12, -1.35), Color(0.63, 0.47, 0.28), Vector3(0.15, 0.13, 0.14))
	_make_station("Werkblad", Vector3(-2.3, 0.88, 1.8), Vector3(2.2, 0.12, 1.0), Color(0.55, 0.58, 0.58))
	board_area = _make_station("TemporaryCuttingBoardProxy", Vector3(-2.3, 1.02, 1.8), Vector3(0.75, 0.10, 0.48), Color(0.54, 0.34, 0.19))
	board_area.set_meta("item_id", "board")
	_make_station("Messenrek", Vector3(-1.0, 1.45, 1.0), Vector3(0.8, 0.65, 0.12), Color(0.25, 0.27, 0.27))
	_add_item("knife", Vector3(-1.0, 1.85, 1.0), Color(0.72, 0.75, 0.77), Vector3(0.38, 0.035, 0.055))
	_add_item("pan", Vector3(0.2, 1.55, 1.0), Color(0.18, 0.20, 0.22), Vector3(0.42, 0.08, 0.42))
	_add_item("plate", Vector3(0.7, 1.55, 1.0), Color(0.88, 0.87, 0.82), Vector3(0.34, 0.045, 0.34))
	hob_area = _make_station("TemporaryHobProxy", Vector3(0.5, 1.02, -0.1), Vector3(1.1, 0.12, 0.9), Color(0.16, 0.17, 0.18))
	plate_area = _make_station("TemporaryPlatingProxy", Vector3(1.8, 1.02, 1.8), Vector3(0.9, 0.10, 0.7), Color(0.60, 0.62, 0.62))

func _make_station(label_text: String, pos: Vector3, size: Vector3, color: Color) -> Area3D:
	var area := Area3D.new()
	area.name = label_text.replace(" ", "_")
	area.position = pos
	area.collision_layer = 1
	area.collision_mask = 0
	var mesh_node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_node.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.68
	mesh_node.material_override = material
	area.add_child(mesh_node)
	var shape_node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	shape_node.shape = shape
	area.add_child(shape_node)
	add_child(area)
	return area

func _add_item(item_id: String, pos: Vector3, color: Color, size: Vector3) -> void:
	var body := RigidBody3D.new()
	body.name = "TemporaryItem_" + item_id
	body.position = pos
	body.mass = 0.25
	body.set_meta("item_id", item_id)
	body.collision_layer = 1
	body.collision_mask = 1
	var mesh_node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_node.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.55
	mesh_node.material_override = material
	body.add_child(mesh_node)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	item_nodes[item_id] = body

func _item_label(item_id: String) -> String:
	match item_id:
		"chicken": return "Kip"
		"carrot": return "Wortel"
		"potato": return "Aardappel"
		"knife": return "Mes"
		"pan": return "Pan"
		"plate": return "Bord"
	return item_id
