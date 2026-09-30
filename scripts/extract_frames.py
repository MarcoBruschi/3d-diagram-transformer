import cv2
import os
import sys

def extract_video_frames(video_path, output_dir, target_w=1920, target_h=1080, quality=82):
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Opening {video_path}: {total_frames} frames detected.")
    
    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        count += 1
        resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        filename = f"frame-{count:04d}.jpg"
        out_path = os.path.join(output_dir, filename)
        cv2.imwrite(out_path, resized, [cv2.IMWRITE_JPEG_QUALITY, quality])
        
        if count % 40 == 0 or count == total_frames:
            print(f"Extracted {count}/{total_frames} -> {out_path}")
            
    cap.release()
    print(f"Finished {video_path}: {count} frames saved to {output_dir}")
    return count

if __name__ == "__main__":
    dark_video = r"C:\Users\mabru\Downloads\imgs\modoEscuro.mp4"
    light_video = r"C:\Users\mabru\Downloads\imgs\modoBranco.mp4"
    
    base_dir = r"c:\Users\mabru\Documents\3d-diagram-transformer\public\sequence"
    dark_dir = os.path.join(base_dir, "dark")
    light_dir = os.path.join(base_dir, "light")
    
    print("=== Extracting Dark Mode Frames ===")
    extract_video_frames(dark_video, dark_dir)
    
    print("\n=== Extracting Light Mode Frames ===")
    extract_video_frames(light_video, light_dir)
    
    # Also copy dark frames to root of sequence for backwards compatibility
    print("\n=== Mirroring Dark Frames to Root Sequence ===")
    extract_video_frames(dark_video, base_dir)
    
    # Clean up old frames > 240 if they exist in base_dir
    for i in range(241, 350):
        old_file = os.path.join(base_dir, f"frame-{i:04d}.jpg")
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except:
                pass
    print("\n=== Done Extraction ===")
