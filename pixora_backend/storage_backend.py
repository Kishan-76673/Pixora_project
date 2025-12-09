"""
Storage utility functions that support multiple storage options:
- Local filesystem (development)
- Google Drive (when credentials available)
- AWS S3 (when credentials available)
"""

from django.conf import settings
from django.core.files.storage import FileSystemStorage
import os
import uuid

# Initialize storage backend based on settings
def get_storage_backend():
    """Get the appropriate storage backend based on STORAGE_TYPE setting"""
    storage_type = getattr(settings, 'STORAGE_TYPE', 'local')
    
    if storage_type == 'local':
        return FileSystemStorage()
    elif storage_type == 'google_drive':
        # Will implement when credentials available
        from .google_drive_storage import GoogleDriveStorage
        return GoogleDriveStorage()
    elif storage_type == 'aws_s3':
        # Will implement when credentials available
        from storages.backends.s3boto3 import S3Boto3Storage
        return S3Boto3Storage()
    else:
        return FileSystemStorage()


def save_file(file, folder='uploads'):
    """
    Save file to storage
    
    Args:
        file: Uploaded file object
        folder: Subfolder to save in (e.g., 'avatars', 'posts')
    
    Returns:
        str: Path/URL of saved file
    """
    storage = get_storage_backend()
    
    # Generate unique filename
    ext = os.path.splitext(file.name)[1]
    filename = f"{folder}/{uuid.uuid4()}{ext}"
    
    # Save file
    saved_path = storage.save(filename, file)
    return saved_path


def get_file_url(filepath):
    """
    Get URL of file
    
    Args:
        filepath: Path of the file in storage
    
    Returns:
        str: URL to access the file
    """
    storage = get_storage_backend()
    return storage.url(filepath)


def delete_file(filepath):
    """
    Delete file from storage
    
    Args:
        filepath: Path of the file to delete
    
    Returns:
        bool: True if deleted successfully
    """
    storage = get_storage_backend()
    if storage.exists(filepath):
        storage.delete(filepath)
        return True
    return False


def file_exists(filepath):
    """
    Check if file exists in storage
    
    Args:
        filepath: Path of the file
    
    Returns:
        bool: True if file exists
    """
    storage = get_storage_backend()
    return storage.exists(filepath)


def validate_file(file, allowed_extensions, max_size_mb=10):
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file object
        allowed_extensions: List of allowed extensions (e.g., ['jpg', 'png'])
        max_size_mb: Maximum file size in MB
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if file.size > max_size_bytes:
        return False, f"File size exceeds {max_size_mb}MB limit"
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower().replace('.', '')
    if ext not in allowed_extensions:
        return False, f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
    
    return True, None