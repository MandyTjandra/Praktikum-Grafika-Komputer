import bpy
import os
import math
from mathutils import Vector, Euler

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)

scene_coll = bpy.context.scene.collection
main_coll = bpy.data.collections.new("Tugas_Scene_Lengkap")
scene_coll.children.link(main_coll)

base_dir = os.path.dirname(os.path.abspath(__file__))
textures_dir = os.path.join(base_dir, "textures")
lantern_tex_dir = os.path.join(textures_dir, "external_lantern")
p10_blend = os.path.abspath(r"Praktikum 10\P10_5025241173_Mandy_5025241185_Nawfal.blend")
lantern_blend = os.path.abspath(r"Tugas Blender Scene 3D Lengkap\models\brass_diya_lantern.blend")

# 2. Import Self-Modeled Chest Prop from P10
with bpy.data.libraries.load(p10_blend) as (data_from, data_to):
    data_to.objects = ['Chest_Base', 'Rivet_Array']

for o in data_to.objects:
    main_coll.objects.link(o)

chest_base = bpy.data.objects.get('Chest_Base')
rivet_array = bpy.data.objects.get('Rivet_Array')

# Group chest objects together
chest_parent = bpy.data.objects.new("Self_Modeled_Chest_Group", None)
main_coll.objects.link(chest_parent)

# Scale chest to ~2.16m x 1.2m x 0.84m (ideal hero prop size)
chest_parent.location = (-0.95, 0.2, 0.42)
chest_parent.scale = (0.6, 0.6, 0.6)
chest_parent.rotation_euler = Euler((0, 0, math.radians(-14)), 'XYZ')

chest_base.parent = chest_parent
if rivet_array:
    rivet_array.parent = chest_parent

# Ensure Chest Textures are linked
chest_mat = bpy.data.materials.get("Chest_PBR_Mat")
if chest_mat and chest_mat.node_tree:
    for n in chest_mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            fname = os.path.basename(n.image.filepath)
            t_path = os.path.join(textures_dir, fname)
            if os.path.exists(t_path):
                n.image.filepath = t_path
                n.image.reload()

rivet_mat = bpy.data.materials.get("Rivet_Brass_PBR_Mat")
if rivet_mat and rivet_mat.node_tree:
    for n in rivet_mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            fname = os.path.basename(n.image.filepath)
            t_path = os.path.join(textures_dir, fname)
            if os.path.exists(t_path):
                n.image.filepath = t_path
                n.image.reload()

# 3. Import External PBR Model: Brass Diya Lantern
with bpy.data.libraries.load(lantern_blend) as (data_from, data_to):
    data_to.objects = ['brass_diya_lantern', 'brass_diya_lantern_chain', 'brass_diya_lantern_connection']

lantern_objs = []
for o in data_to.objects:
    main_coll.objects.link(o)
    lantern_objs.append(o)

lantern_parent = bpy.data.objects.new("External_PBR_Lantern_Group", None)
main_coll.objects.link(lantern_parent)
for o in lantern_objs:
    o.parent = lantern_parent

lantern_parent.scale = (6.0, 6.0, 6.0)
lantern_parent.location = (1.30, -0.3, 0.0)
lantern_parent.rotation_euler = Euler((0, 0, math.radians(20)), 'XYZ')

# Rebuild Clean PBR Material for External Model (Ketentuan 2)
# With: Base Color, Roughness, Metallic, Normal, Ambient Occlusion, Emission
lantern_mat = bpy.data.materials.get("brass_diya_lantern")
if lantern_mat and lantern_mat.node_tree:
    nt = lantern_mat.node_tree
    nt.nodes.clear()

    node_out = nt.nodes.new('ShaderNodeOutputMaterial')
    node_out.location = (600, 0)

    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (200, 0)
    nt.links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-1000, 200)

    # 1. Base Color Image
    tex_diff = nt.nodes.new('ShaderNodeTexImage')
    tex_diff.location = (-650, 450)
    tex_diff.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_basecolor.png"))
    tex_diff.image.colorspace_settings.name = 'sRGB'
    nt.links.new(tex_coord.outputs['UV'], tex_diff.inputs['Vector'])

    # 2. Ambient Occlusion (AO) Image
    tex_ao = nt.nodes.new('ShaderNodeTexImage')
    tex_ao.location = (-650, 200)
    tex_ao.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_ao.png"))
    tex_ao.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(tex_coord.outputs['UV'], tex_ao.inputs['Vector'])

    # Mix Base Color & AO using Multiply
    mix_ao = nt.nodes.new('ShaderNodeMix')
    mix_ao.data_type = 'RGBA'
    mix_ao.blend_type = 'MULTIPLY'
    mix_ao.inputs[0].default_value = 1.0  # Factor
    mix_ao.location = (-250, 350)
    nt.links.new(tex_diff.outputs['Color'], mix_ao.inputs[6])
    nt.links.new(tex_ao.outputs['Color'], mix_ao.inputs[7])
    nt.links.new(mix_ao.outputs[2], bsdf.inputs['Base Color'])

    # 3. Metallic Image
    tex_metal = nt.nodes.new('ShaderNodeTexImage')
    tex_metal.location = (-650, -50)
    tex_metal.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_metallic.png"))
    tex_metal.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(tex_coord.outputs['UV'], tex_metal.inputs['Vector'])
    nt.links.new(tex_metal.outputs['Color'], bsdf.inputs['Metallic'])

    # 4. Roughness Image
    tex_rough = nt.nodes.new('ShaderNodeTexImage')
    tex_rough.location = (-650, -300)
    tex_rough.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_roughness.png"))
    tex_rough.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(tex_coord.outputs['UV'], tex_rough.inputs['Vector'])
    nt.links.new(tex_rough.outputs['Color'], bsdf.inputs['Roughness'])

    # 5. Normal Map Image & Normal Map Node
    tex_norm = nt.nodes.new('ShaderNodeTexImage')
    tex_norm.location = (-650, -550)
    tex_norm.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_normal.png"))
    tex_norm.image.colorspace_settings.name = 'Non-Color'

    node_norm_map = nt.nodes.new('ShaderNodeNormalMap')
    node_norm_map.location = (-250, -550)
    node_norm_map.inputs['Strength'].default_value = 1.0

    nt.links.new(tex_coord.outputs['UV'], tex_norm.inputs['Vector'])
    nt.links.new(tex_norm.outputs['Color'], node_norm_map.inputs['Color'])
    nt.links.new(node_norm_map.outputs['Normal'], bsdf.inputs['Normal'])

    # 6. Emission Image
    tex_emit = nt.nodes.new('ShaderNodeTexImage')
    tex_emit.location = (-650, -800)
    tex_emit.image = bpy.data.images.load(os.path.join(lantern_tex_dir, "lantern_emissive.png"))
    tex_emit.image.colorspace_settings.name = 'sRGB'
    nt.links.new(tex_coord.outputs['UV'], tex_emit.inputs['Vector'])
    nt.links.new(tex_emit.outputs['Color'], bsdf.inputs['Emission Color'])
    if 'Emission Strength' in bsdf.inputs:
        bsdf.inputs['Emission Strength'].default_value = 3.5

# Glass material
glass_mat = bpy.data.materials.get("brass_diya_lantern_glass")
if glass_mat and glass_mat.node_tree:
    nt = glass_mat.node_tree
    nt.nodes.clear()
    node_out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Transmission Weight'].default_value = 0.95
    bsdf.inputs['IOR'].default_value = 1.45

# Flame material
flame_mat = bpy.data.materials.get("brass_diya_lantern_flame")
if flame_mat and flame_mat.node_tree:
    nt = flame_mat.node_tree
    nt.nodes.clear()
    node_out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (1.0, 0.5, 0.1, 1.0)
    bsdf.inputs['Emission Color'].default_value = (1.0, 0.55, 0.1, 1.0)
    if 'Emission Strength' in bsdf.inputs:
        bsdf.inputs['Emission Strength'].default_value = 20.0

# 4. Create Ground (Ketentuan 3: realistic wooden deck planks)
bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Rustic_Deck_Ground"
main_coll.objects.link(ground)
scene_coll.objects.unlink(ground)

ground_mat = bpy.data.materials.new("Deck_Wood_PBR")
g_nt = ground_mat.node_tree
g_nt.nodes.clear()
g_out = g_nt.nodes.new("ShaderNodeOutputMaterial")
g_bsdf = g_nt.nodes.new("ShaderNodeBsdfPrincipled")
g_nt.links.new(g_bsdf.outputs['BSDF'], g_out.inputs['Surface'])

g_texcoord = g_nt.nodes.new("ShaderNodeTexCoord")
g_mapping = g_nt.nodes.new("ShaderNodeMapping")
g_mapping.inputs['Scale'].default_value = (1.0, 1.0, 1.0)
g_nt.links.new(g_texcoord.outputs['Generated'], g_mapping.inputs['Vector'])

# Clean straight wood planks parallel along X (grooves running across)
g_wave = g_nt.nodes.new("ShaderNodeTexWave")
g_wave.wave_type = 'BANDS'
g_wave.bands_direction = 'Y'
g_wave.inputs['Scale'].default_value = 14.0
g_wave.inputs['Distortion'].default_value = 0.05
g_wave.inputs['Detail'].default_value = 1.0
g_nt.links.new(g_mapping.outputs['Vector'], g_wave.inputs['Vector'])

# Fine wood noise for organic texture inside each plank
g_noise = g_nt.nodes.new("ShaderNodeTexNoise")
g_noise.inputs['Scale'].default_value = 35.0
g_noise.inputs['Detail'].default_value = 4.0
g_noise.inputs['Roughness'].default_value = 0.65
g_nt.links.new(g_mapping.outputs['Vector'], g_noise.inputs['Vector'])

# Combine wave bands with fine noise
g_mix_tex = g_nt.nodes.new("ShaderNodeMix")
g_mix_tex.data_type = 'FLOAT'
g_mix_tex.blend_type = 'MIX'
g_mix_tex.inputs[0].default_value = 0.25 # subtle noise influence
g_nt.links.new(g_wave.outputs['Fac'], g_mix_tex.inputs[2])
g_nt.links.new(g_noise.outputs['Fac'], g_mix_tex.inputs[3])

g_colramp = g_nt.nodes.new("ShaderNodeValToRGB")
g_colramp.color_ramp.elements[0].position = 0.0
g_colramp.color_ramp.elements[0].color = (0.035, 0.02, 0.012, 1.0) # Deep dark oak groove
g_colramp.color_ramp.elements[1].position = 1.0
g_colramp.color_ramp.elements[1].color = (0.13, 0.08, 0.045, 1.0) # Warm rich mahogany plank
g_nt.links.new(g_mix_tex.outputs[0], g_colramp.inputs['Fac'])
g_nt.links.new(g_colramp.outputs['Color'], g_bsdf.inputs['Base Color'])

g_bsdf.inputs['Roughness'].default_value = 0.55
g_bump = g_nt.nodes.new("ShaderNodeBump")
g_bump.inputs['Strength'].default_value = 0.18
g_nt.links.new(g_wave.outputs['Fac'], g_bump.inputs['Height'])
g_nt.links.new(g_bump.outputs['Normal'], g_bsdf.inputs['Normal'])

ground.data.materials.append(ground_mat)

# 5. Supporting Elements: Gold Coins & Gems (Ketentuan 3)
gold_mat = bpy.data.materials.new("Gold_Doubloon_PBR")
gold_bsdf = gold_mat.node_tree.nodes.get("Principled BSDF")
gold_bsdf.inputs['Base Color'].default_value = (1.0, 0.78, 0.18, 1.0)
gold_bsdf.inputs['Metallic'].default_value = 0.95
gold_bsdf.inputs['Roughness'].default_value = 0.22

gem_mat = bpy.data.materials.new("Ruby_Gem_PBR")
gem_bsdf = gem_mat.node_tree.nodes.get("Principled BSDF")
gem_bsdf.inputs['Base Color'].default_value = (0.9, 0.05, 0.15, 1.0)
gem_bsdf.inputs['Roughness'].default_value = 0.05
gem_bsdf.inputs['Transmission Weight'].default_value = 0.92
gem_bsdf.inputs['IOR'].default_value = 1.77

coins_group = bpy.data.objects.new("Treasure_Coins_Scatter", None)
main_coll.objects.link(coins_group)

bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.08, depth=0.015, location=(0, 0, -10))
coin_template = bpy.context.active_object
coin_template.data.materials.append(gold_mat)
scene_coll.objects.unlink(coin_template)

import random
random.seed(303)

# Scatter 40 gold coins artistically between chest and lantern
for i in range(40):
    t = random.random()
    cx = -0.3 + t * 1.5 + (random.random() - 0.5) * 0.5
    cy = -0.2 - t * 0.2 + (random.random() - 0.5) * 0.4
    cz = 0.008 + (random.random() * 0.015)
    rot_z = random.uniform(0, math.pi * 2)
    rot_x = random.uniform(-0.1, 0.1)
    rot_y = random.uniform(-0.1, 0.1)

    c_inst = coin_template.copy()
    c_inst.location = (cx, cy, cz)
    c_inst.rotation_euler = Euler((rot_x, rot_y, rot_z), 'XYZ')
    c_inst.parent = coins_group
    main_coll.objects.link(c_inst)

# 4 gems
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.06, location=(0, 0, -10))
gem_template = bpy.context.active_object
gem_template.data.materials.append(gem_mat)
scene_coll.objects.unlink(gem_template)

for i in range(4):
    gx = 0.4 + (random.random() - 0.5) * 0.6
    gy = -0.3 + (random.random() - 0.5) * 0.4
    gz = 0.03
    g_inst = gem_template.copy()
    g_inst.location = (gx, gy, gz)
    g_inst.parent = coins_group
    main_coll.objects.link(g_inst)

bpy.data.objects.remove(coin_template, do_unlink=True)
bpy.data.objects.remove(gem_template, do_unlink=True)

# 6. Lighting Setup (Ketentuan 4: lighting baik, highlight, bayangan, kedalaman)
lights_coll = bpy.data.collections.new("Lighting_Setup")
scene_coll.children.link(lights_coll)

# Key Light (Warm, primary directional modeling light)
key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
key_data.energy = 550.0
key_data.color = (1.0, 0.94, 0.85)
key_data.size = 2.5
key_obj = bpy.data.objects.new("Key_Light", key_data)
key_obj.location = (-3.5, -4.5, 4.0)
key_obj.rotation_euler = Euler((math.radians(52), math.radians(12), math.radians(-38)), 'XYZ')
lights_coll.objects.link(key_obj)

# Fill Light (Cool, soft secondary light)
fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
fill_data.energy = 160.0
fill_data.color = (0.75, 0.88, 1.0)
fill_data.size = 4.0
fill_obj = bpy.data.objects.new("Fill_Light", fill_data)
fill_obj.location = (4.5, -3.0, 2.8)
fill_obj.rotation_euler = Euler((math.radians(55), math.radians(-15), math.radians(55)), 'XYZ')
lights_coll.objects.link(fill_obj)

# Rim / Back Light (High intensity edge definition)
rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
rim_data.energy = 380.0
rim_data.color = (0.9, 0.95, 1.0)
rim_data.size = 2.0
rim_obj = bpy.data.objects.new("Rim_Light", rim_data)
rim_obj.location = (0.0, 4.0, 3.5)
rim_obj.rotation_euler = Euler((math.radians(-45), 0, math.radians(180)), 'XYZ')
lights_coll.objects.link(rim_obj)

# Practical Lantern Point Light (Inside Lantern)
lantern_light_data = bpy.data.lights.new(name="Lantern_Flame_Light", type='POINT')
lantern_light_data.energy = 45.0
lantern_light_data.color = (1.0, 0.60, 0.15)
lantern_light_data.shadow_soft_size = 0.05
lantern_light_obj = bpy.data.objects.new("Lantern_Flame_Light", lantern_light_data)
lantern_light_obj.location = (1.30, -0.3, 0.72)
lights_coll.objects.link(lantern_light_obj)

# Chest Rune Core Glow
accent_light_data = bpy.data.lights.new(name="Chest_Rune_Accent_Light", type='POINT')
accent_light_data.energy = 25.0
accent_light_data.color = (0.05, 0.88, 1.0)
accent_light_data.shadow_soft_size = 0.08
accent_light_obj = bpy.data.objects.new("Chest_Rune_Accent_Light", accent_light_data)
accent_light_obj.location = (-0.95, 0.2, 0.75)
lights_coll.objects.link(accent_light_obj)

# 7. Camera Setup (Ketentuan 5: camera, focal length, sudut pandang, komposisi)
cam_coll = bpy.data.collections.new("Cameras")
scene_coll.children.link(cam_coll)

# Camera Focus Target Empty (centered between chest & lantern)
focus_target = bpy.data.objects.new("Camera_Focus_Target", None)
focus_target.location = (0.0, -0.1, 0.45)
cam_coll.objects.link(focus_target)

# 1. Hero Camera (50mm, 3/4 Hero Perspective, Rule of Thirds framing)
cam_hero_data = bpy.data.cameras.new(name="Hero_Cinematic_Camera")
cam_hero_data.lens = 50.0
cam_hero_data.dof.use_dof = True
cam_hero_data.dof.focus_object = focus_target
cam_hero_data.dof.aperture_fstop = 4.0

cam_hero_obj = bpy.data.objects.new("Hero_Cinematic_Camera", cam_hero_data)
cam_hero_obj.location = (0.1, -5.4, 2.7)

tt = cam_hero_obj.constraints.new(type='TRACK_TO')
tt.target = focus_target
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis = 'UP_Y'

cam_coll.objects.link(cam_hero_obj)
bpy.context.scene.camera = cam_hero_obj

# 2. Closeup Lantern Camera (65mm, focused on lantern body & details)
cam_lantern_target = bpy.data.objects.new("Lantern_Focus_Target", None)
cam_lantern_target.location = (1.30, -0.3, 0.45)
cam_coll.objects.link(cam_lantern_target)

cam_close_data = bpy.data.cameras.new(name="Closeup_Lantern_Camera")
cam_close_data.lens = 65.0
cam_close_data.dof.use_dof = True
cam_close_data.dof.focus_object = cam_lantern_target
cam_close_data.dof.aperture_fstop = 2.8

cam_close_obj = bpy.data.objects.new("Closeup_Lantern_Camera", cam_close_data)
cam_close_obj.location = (2.2, -2.4, 1.1)
tt_close = cam_close_obj.constraints.new(type='TRACK_TO')
tt_close.target = cam_lantern_target
tt_close.track_axis = 'TRACK_NEGATIVE_Z'
tt_close.up_axis = 'UP_Y'
cam_coll.objects.link(cam_close_obj)

# 3. Closeup Chest Camera (55mm, focused on chest wood & glowing rune)
cam_chest_target = bpy.data.objects.new("Chest_Focus_Target", None)
cam_chest_target.location = (-0.95, 0.15, 0.42)
cam_coll.objects.link(cam_chest_target)

cam_chest_data = bpy.data.cameras.new(name="Closeup_Chest_Camera")
cam_chest_data.lens = 55.0
cam_chest_data.dof.use_dof = True
cam_chest_data.dof.focus_object = cam_chest_target
cam_chest_data.dof.aperture_fstop = 3.2

cam_chest_obj = bpy.data.objects.new("Closeup_Chest_Camera", cam_chest_data)
cam_chest_obj.location = (-1.1, -2.6, 1.2)
tt_chest = cam_chest_obj.constraints.new(type='TRACK_TO')
tt_chest.target = cam_chest_target
tt_chest.track_axis = 'TRACK_NEGATIVE_Z'
tt_chest.up_axis = 'UP_Y'
cam_coll.objects.link(cam_chest_obj)

# Render Settings (Ketentuan 6)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 28
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 4

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

try:
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'

# Save Blend File
out_blend = os.path.join(base_dir, "Tugas Blender Scene 3D Lengkap.blend")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

print(f"Scene successfully updated and saved to: {out_blend}")
