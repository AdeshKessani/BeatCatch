import os
import jwt
import requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

security = HTTPBearer()

def get_jwks():
    """Fetch Supabase public keys for JWT verification"""
    url = f"{SUPABASE_URL}/auth/v1/keys"
    response = requests.get(url, headers={"apikey": SUPABASE_ANON_KEY})
    return response.json()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Decode without verification first to get the header
        header = jwt.get_unverified_header(token)
        
        # Fetch JWKS from Supabase
        jwks = get_jwks()
        
        # Find the matching key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == header.get("kid"):
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        
        if not public_key:
            raise HTTPException(status_code=401, detail="Invalid token key")
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")