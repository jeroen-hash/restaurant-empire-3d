extends Node3D

var elapsed := 0.0
var status_label: Label

func _ready() -> void:
	var camera := Camera3D.new()
	camera.position = Vector3(0, 2.2, 5.5)
	camera.look_at(Vector3.ZERO, Vector3.UP)
	camera.current = true
	add_child(camera)

	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, -30, 0)
	add_child(light)

	var cube := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(1.5, 1.5, 1.5)
	cube.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.12, 0.55, 0.38)
	cube.material_override = material
	add_child(cube)

	var floor := MeshInstance3D.new()
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(8, 8)
	floor.mesh = floor_mesh
	floor.position.y = -0.9
	var floor_material := StandardMaterial3D.new()
	floor_material.albedo_color = Color(0.22, 0.25, 0.23)
	floor.material_override = floor_material
	add_child(floor)

	var ui := CanvasLayer.new()
	add_child(ui)
	var panel := PanelContainer.new()
	panel.position = Vector2(20, 20)
	panel.custom_minimum_size = Vector2(420, 110)
	ui.add_child(panel)
	var column := VBoxContainer.new()
	panel.add_child(column)
	var title := Label.new()
	title.text = "ANIMO - IPHONE TEST"
	title.add_theme_font_size_override("font_size", 24)
	column.add_child(title)
	status_label = Label.new()
	status_label.text = "SUCCESS: Godot + 3D + interface gestart."
	status_label.add_theme_font_size_override("font_size", 18)
	column.add_child(status_label)
	var button := Button.new()
	button.text = "TEST KNOP - TIK HIER"
	button.pressed.connect(_on_test_button)
	column.add_child(button)

func _process(delta: float) -> void:
	elapsed += delta
	rotation.y += delta * 0.5
	if is_instance_valid(status_label):
		status_label.text = "SUCCESS: 3D actief | %.1f seconden" % elapsed

func _on_test_button() -> void:
	if is_instance_valid(status_label):
		status_label.text = "SUCCESS: touchscreen werkt."
