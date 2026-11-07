"""
Script Eksekusi Rendering Scene 3D Lengkap
Digunakan untuk merender Hero Shot, Closeup Lentera PBR, Closeup Peti PBR, dan Clay Overview.
"""
import bpy
import os
import shutil

base_dir = os.path.dirname(os.path.abspath(__file__))
screenshots_dir = os.path.join(base_dir, "screenshots")
images_dir = os.path.join(base_dir, "images")
os.makedirs(screenshots_dir, exist_ok=True)
os.makedirs(images_dir, exist_ok=True)

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

def render_cycles_view(cam_name, out_filename, samples=28):
    cam = bpy.data.objects.get(cam_name)
    if not cam:
        print(f"Kamera {cam_name} tidak ditemukan!")
        return
    scene.camera = cam
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 4

    out_path = os.path.join(screenshots_dir, out_filename)
    scene.render.filepath = out_path
    print(f"Merender {cam_name} ke {out_path}...")
    bpy.ops.render.render(write_still=True)
    shutil.copyfile(out_path, os.path.join(images_dir, out_filename))
    print(f"Selesai merender {out_filename}!")

if __name__ == "__main__":
    # 1. Hero Shot
    render_cycles_view("Hero_Cinematic_Camera", "01_final_master_showcase.png", samples=28)
    shutil.copyfile(os.path.join(screenshots_dir, "01_final_master_showcase.png"),
                    os.path.join(screenshots_dir, "02_cycles_hero_showcase.png"))
    shutil.copyfile(os.path.join(screenshots_dir, "01_final_master_showcase.png"),
                    os.path.join(images_dir, "02_cycles_hero_showcase.png"))

    # 2. Closeup Model Eksternal (Lentera PBR)
    render_cycles_view("Closeup_Lantern_Camera", "03_lantern_pbr_detail.png", samples=22)

    # 3. Closeup Model Sendiri (Peti PBR)
    render_cycles_view("Closeup_Chest_Camera", "04_chest_pbr_detail.png", samples=22)

    # 4. Clay Topology Overview
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.show_cavity = True
    scene.camera = bpy.data.objects.get("Hero_Cinematic_Camera")
    wb_path = os.path.join(screenshots_dir, "05_scene_overview_clay.png")
    scene.render.filepath = wb_path
    bpy.ops.render.render(write_still=True)
    shutil.copyfile(wb_path, os.path.join(images_dir, "05_scene_overview_clay.png"))
    print("Seluruh proses rendering berhasil diselesaikan!")
