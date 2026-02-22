import cv2
import face_recognition
import numpy as np
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_enhanced_encoding(encoding_array: list) -> dict:
    """
    Create enhanced encoding with metadata for standardized format
    """
    return {
        "encoding": encoding_array,
        "format": "face_recognition",
        "source_system": "FRAMS",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "conversion_quality": 1.0,
        "original_dimensions": len(encoding_array)
    }

def register_faces():
    print("Starting face registration process...")
    
    try:
        # Fetch all students
        response = supabase.table('students').select('id, user_id, enrollment_number').execute()
        students = response.data
        
        print(f"Found {len(students)} students.")
        
        for student in students:
            user_id = student['user_id']
            enrollment = student['enrollment_number']
            
            print(f"Checking student {enrollment} ({user_id})...")
            
            # Check for reference image in storage
            # Path: face_registrations/{userId}/reference.jpg
            file_path = f"face_registrations/{user_id}/reference.jpg"
            
            try:
                # Get public URL
                public_url_response = supabase.storage.from_('avatars').get_public_url(file_path)
                public_url = public_url_response
                
                # Download the image
                image_response = requests.get(public_url, timeout=30)
                if image_response.status_code != 200:
                    print(f"  No reference image found for {enrollment}")
                    continue
                
                # Process image with face_recognition
                image_array = np.asarray(bytearray(image_response.content), dtype=np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                
                if image is None:
                    print(f"  Failed to decode image for {enrollment}")
                    continue
                
                # Detect faces
                face_locations = face_recognition.face_locations(image)
                
                if len(face_locations) == 0:
                    print(f"  No faces detected in image for {enrollment}")
                    continue
                
                if len(face_locations) > 1:
                    print(f"  Multiple faces detected in image for {enrollment} - skipping")
                    continue
                
                # Generate face encoding
                face_encodings = face_recognition.face_encodings(image, face_locations)
                
                if len(face_encodings) == 0:
                    print(f"  Failed to generate encoding for {enrollment}")
                    continue
                
                # Create enhanced encoding with metadata
                enhanced_encoding = create_enhanced_encoding(face_encodings[0].tolist())
                
                # Update student record with enhanced encoding
                update_response = supabase.table('students').update({
                    'face_encoding': enhanced_encoding
                }).eq('id', student['id']).execute()
                
                if update_response.data:
                    print(f"  ✓ Successfully registered face for {enrollment}")
                else:
                    print(f"  ✗ Failed to update database for {enrollment}")
                    
            except Exception as e:
                print(f"  Error processing {enrollment}: {str(e)}")
                continue
        
        print("Face registration process completed!")
        
    except Exception as e:
        print(f"Error in face registration: {str(e)}")

if __name__ == "__main__":
    register_faces()