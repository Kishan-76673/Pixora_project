from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    """Get user from JWT token"""
    try:
        # Decode the token
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user = jwt_auth.get_user(validated_token)
        return user


        # access_token = AccessToken(token)
        # user_id = access_token['user_id']
        
        # # Get user from database
        # user = User.objects.get(id=user_id)
        # return user
    except (InvalidToken, TokenError) as e:
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

        if not token:
            print("❌ No token provided")
            await send({
                "type": "websocket.close",
                "code": 4401,  # Unauthorized
            })
            return

        print(f"🔑 Authenticating with token: {token[:20]}...")
        user = await get_user_from_token(token)

        if isinstance(user, AnonymousUser):
            await send({
                "type": "websocket.close",
                "code": 4401,
            })
            return

        scope["user"] = user
        print(f"✅ Authenticated user: {user}")

        return await super().__call__(scope, receive, send)




