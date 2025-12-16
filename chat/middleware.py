from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    """Get user from JWT token"""
    try:
        # Decode the token
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        
        # Get user from database
        user = User.objects.get(id=user_id)
        return user
    except Exception as e:
        print(f"❌ Token validation failed: {str(e)}")
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            print(f"🔑 Authenticating with token: {token[:20]}...")
            scope['user'] = await get_user_from_token(token)
            print(f"✅ Authenticated user: {scope['user']}")
        else:
            print("❌ No token provided")
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)